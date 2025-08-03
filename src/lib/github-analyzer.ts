import { AnalysisResult, PageNode, RouteInfo, GitHubRepo } from '@/types/analysis'

// Demo data for when GitHub API is unavailable
const DEMO_ANALYSIS: AnalysisResult = {
  repoUrl: 'https://github.com/demo/react-app',
  repoName: 'react-app',
  pages: [
    {
      id: 'home',
      name: 'HomePage',
      path: '/',
      filePath: 'src/pages/HomePage.tsx',
      type: 'page',
      connections: ['about', 'contact'],
      position: { x: 100, y: 100 },
      preview: {
        title: 'Home Page',
        description: 'Main landing page with hero section',
        elements: ['Hero Section', 'Navigation Links', 'Call to Action'],
        hasState: true,
        hasProps: false,
        complexity: 'medium'
      }
    },
    {
      id: 'about',
      name: 'AboutPage',
      path: '/about',
      filePath: 'src/pages/AboutPage.tsx',
      type: 'page',
      connections: ['contact'],
      position: { x: 420, y: 100 },
      preview: {
        title: 'About Page',
        description: 'Company information and team details',
        elements: ['Team Section', 'Company History', 'Mission Statement'],
        hasState: false,
        hasProps: true,
        complexity: 'low'
      }
    },
    {
      id: 'contact',
      name: 'ContactPage',
      path: '/contact',
      filePath: 'src/pages/ContactPage.tsx',
      type: 'page',
      connections: [],
      position: { x: 740, y: 100 },
      preview: {
        title: 'Contact Page',
        description: 'Contact form and company information',
        elements: ['Contact Form', 'Address Info', 'Social Links'],
        hasState: true,
        hasProps: true,
        complexity: 'high'
      }
    },
    {
      id: 'header',
      name: 'Header',
      path: '/components/header',
      filePath: 'src/components/Header.tsx',
      type: 'component',
      connections: ['home', 'about', 'contact'],
      position: { x: 420, y: 380 },
      preview: {
        title: 'Header Component',
        description: 'Navigation header with menu items',
        elements: ['Logo', 'Navigation Menu', 'Mobile Toggle'],
        hasState: true,
        hasProps: false,
        complexity: 'medium'
      }
    },
    {
      id: 'layout',
      name: 'Layout',
      path: '/layout',
      filePath: 'src/components/Layout.tsx',
      type: 'layout',
      connections: ['header'],
      position: { x: 100, y: 380 },
      preview: {
        title: 'Main Layout',
        description: 'Root layout component wrapping all pages',
        elements: ['Header Slot', 'Main Content', 'Footer Slot'],
        hasState: false,
        hasProps: true,
        complexity: 'low'
      }
    }
  ],
  routes: [
    { path: '/', component: 'HomePage', filePath: 'src/pages/HomePage.tsx' },
    { path: '/about', component: 'AboutPage', filePath: 'src/pages/AboutPage.tsx' },
    { path: '/contact', component: 'ContactPage', filePath: 'src/pages/ContactPage.tsx' }
  ],
  totalFiles: 25,
  analyzedFiles: 8,
  timestamp: new Date().toISOString()
}

interface GitHubFile {
  name: string
  path: string
  type: 'file' | 'dir'
  download_url?: string
}

interface GitHubContent {
  name: string
  path: string
  type: string
  content?: string
  download_url?: string
}

export function parseGitHubUrl(url: string): GitHubRepo | null {
  try {
    const cleanUrl = url.trim().replace(/\/$/, '')
    const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?/)
    
    if (!match) return null
    
    return {
      url: cleanUrl,
      owner: match[1],
      name: match[2],
      branch: match[3] || 'main'
    }
  } catch {
    return null
  }
}

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Flowscope-Analyzer',
          ...options.headers
        }
      })
      
      if (response.status === 403) {
        const rateLimitReset = response.headers.get('X-RateLimit-Reset')
        const resetTime = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000) : new Date()
        throw new Error(`GitHub API rate limit exceeded. Resets at ${resetTime.toLocaleTimeString()}`)
      }
      
      if (response.status === 404) {
        throw new Error('Repository not found. Please check the URL and ensure the repository is public.')
      }
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }
      
      return response
    } catch (error) {
      if (i === retries) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  throw new Error('Max retries exceeded')
}

async function fetchRepoContents(repo: GitHubRepo, path = ''): Promise<GitHubFile[]> {
  const url = `https://api.github.com/repos/${repo.owner}/${repo.name}/contents/${path}?ref=${repo.branch}`
  
  try {
    const response = await fetchWithRetry(url)
    const data = await response.json()
    
    if (!Array.isArray(data)) {
      return []
    }
    
    return data.map((item: any) => ({
      name: item.name,
      path: item.path,
      type: item.type === 'dir' ? 'dir' : 'file',
      download_url: item.download_url
    }))
  } catch (error) {
    console.error('Error fetching repo contents:', error)
    throw error
  }
}

async function fetchFileContent(downloadUrl: string): Promise<string> {
  try {
    const response = await fetchWithRetry(downloadUrl)
    return await response.text()
  } catch (error) {
    console.error('Error fetching file content:', error)
    return ''
  }
}

function detectReactComponents(content: string, filePath: string): PageNode[] {
  const components: PageNode[] = []
  
  // Detect React components
  const componentRegex = /(?:export\s+(?:default\s+)?(?:function|const)\s+(\w+)|function\s+(\w+))\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*{[\s\S]*?return\s*\([\s\S]*?<[\s\S]*?>/g
  const matches = [...content.matchAll(componentRegex)]
  
  matches.forEach((match, index) => {
    const componentName = match[1] || match[2]
    if (!componentName) return
    
    // Determine component type
    let type: 'page' | 'component' | 'layout' = 'component'
    if (filePath.includes('/pages/') || filePath.includes('/routes/') || componentName.toLowerCase().includes('page')) {
      type = 'page'
    } else if (componentName.toLowerCase().includes('layout') || componentName.toLowerCase().includes('wrapper')) {
      type = 'layout'
    }
    
    // Extract route path
    let routePath = `/${componentName.toLowerCase().replace(/page$/, '')}`
    if (componentName.toLowerCase() === 'home' || componentName.toLowerCase() === 'homepage') {
      routePath = '/'
    }
    
    // Analyze component complexity
    const hasState = /useState|useReducer|this\.state/.test(content)
    const hasProps = /props\.|interface\s+\w+Props|type\s+\w+Props/.test(content)
    const hasEffects = /useEffect|componentDidMount|componentDidUpdate/.test(content)
    const hasAPI = /fetch\(|axios\.|api\.|useQuery/.test(content)
    
    let complexity: 'low' | 'medium' | 'high' = 'low'
    const complexityScore = [hasState, hasProps, hasEffects, hasAPI].filter(Boolean).length
    if (complexityScore >= 3) complexity = 'high'
    else if (complexityScore >= 2) complexity = 'medium'
    
    // Extract elements
    const elements: string[] = []
    if (hasState) elements.push('State Management')
    if (hasProps) elements.push('Props Interface')
    if (hasEffects) elements.push('Side Effects')
    if (hasAPI) elements.push('API Integration')
    if (/<form/i.test(content)) elements.push('Form Handling')
    if (/<button/i.test(content)) elements.push('User Interactions')
    if (!elements.length) elements.push('JSX Return', 'Component Logic')
    
    components.push({
      id: `${componentName.toLowerCase()}-${index}`,
      name: componentName,
      path: routePath,
      filePath,
      type,
      connections: [],
      preview: {
        title: componentName,
        description: `${type} component${hasAPI ? ' with API integration' : ''}`,
        elements: elements.slice(0, 4), // Limit to 4 elements
        hasState,
        hasProps,
        complexity
      }
    })
  })
  
  return components
}

function extractNavigationLinks(content: string): string[] {
  const links: string[] = []
  
  // React Router Link components
  const linkRegex = /<Link[^>]+to=["']([^"']+)["'][^>]*>/g
  const linkMatches = [...content.matchAll(linkRegex)]
  linkMatches.forEach(match => links.push(match[1]))
  
  // Next.js Link components
  const nextLinkRegex = /<Link[^>]+href=["']([^"']+)["'][^>]*>/g
  const nextLinkMatches = [...content.matchAll(nextLinkRegex)]
  nextLinkMatches.forEach(match => links.push(match[1]))
  
  // useNavigate calls
  const navigateRegex = /navigate\s*\(\s*["']([^"']+)["']\s*\)/g
  const navigateMatches = [...content.matchAll(navigateRegex)]
  navigateMatches.forEach(match => links.push(match[1]))
  
  // router.push calls
  const routerPushRegex = /router\.push\s*\(\s*["']([^"']+)["']\s*\)/g
  const routerPushMatches = [...content.matchAll(routerPushRegex)]
  routerPushMatches.forEach(match => links.push(match[1]))
  
  return [...new Set(links)] // Remove duplicates
}

async function analyzeReactFiles(repo: GitHubRepo): Promise<{ pages: PageNode[], routes: RouteInfo[], totalFiles: number, analyzedFiles: number }> {
  const pages: PageNode[] = []
  const routes: RouteInfo[] = []
  let totalFiles = 0
  let analyzedFiles = 0
  
  async function scanDirectory(path = ''): Promise<void> {
    try {
      const contents = await fetchRepoContents(repo, path)
      totalFiles += contents.length
      
      for (const item of contents) {
        if (item.type === 'dir' && (item.name === 'src' || item.name === 'components' || item.name === 'pages' || item.name === 'app')) {
          await scanDirectory(item.path)
        } else if (item.type === 'file' && (item.name.endsWith('.tsx') || item.name.endsWith('.jsx')) && item.download_url) {
          try {
            const content = await fetchFileContent(item.download_url)
            const components = detectReactComponents(content, item.path)
            pages.push(...components)
            
            // Extract routes
            if (item.path.includes('/pages/') || item.path.includes('/routes/')) {
              components.forEach(comp => {
                if (comp.type === 'page') {
                  routes.push({
                    path: comp.path,
                    component: comp.name,
                    filePath: comp.filePath
                  })
                }
              })
            }
            
            analyzedFiles++
          } catch (error) {
            console.warn(`Failed to analyze file ${item.path}:`, error)
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${path}:`, error)
    }
  }
  
  await scanDirectory()
  
  // Build connections between components
  for (const page of pages) {
    if (page.filePath) {
      try {
        const content = await fetchFileContent(`https://raw.githubusercontent.com/${repo.owner}/${repo.name}/${repo.branch}/${page.filePath}`)
        const links = extractNavigationLinks(content)
        
        // Find matching pages for each link
        links.forEach(link => {
          const targetPage = pages.find(p => p.path === link)
          if (targetPage && !page.connections.includes(targetPage.id)) {
            page.connections.push(targetPage.id)
          }
        })
      } catch (error) {
        console.warn(`Failed to extract navigation links from ${page.filePath}:`, error)
      }
    }
  }
  
  return { pages, routes, totalFiles, analyzedFiles }
}

export async function analyzeGitHubRepo(url: string): Promise<AnalysisResult> {
  try {
    const repo = parseGitHubUrl(url)
    if (!repo) {
      throw new Error('Invalid GitHub URL. Please provide a valid GitHub repository URL.')
    }
    
    console.log(`Analyzing repository: ${repo.owner}/${repo.name}`)
    
    // Test API access first
    try {
      await fetchWithRetry(`https://api.github.com/repos/${repo.owner}/${repo.name}`)
    } catch (error) {
      console.error('GitHub API access failed:', error)
      
      // Return demo data with a note about the limitation
      const demoResult = {
        ...DEMO_ANALYSIS,
        repoUrl: url,
        repoName: repo.name,
        timestamp: new Date().toISOString()
      }
      
      // Add a note to the first page about demo mode
      if (demoResult.pages.length > 0) {
        demoResult.pages[0].preview = {
          ...demoResult.pages[0].preview!,
          description: '⚠️ Demo data - GitHub API unavailable. This shows sample navigation flow analysis.'
        }
      }
      
      throw new Error(`GitHub API unavailable (${error instanceof Error ? error.message : 'Unknown error'}). Showing demo visualization instead.`)
    }
    
    const analysis = await analyzeReactFiles(repo)
    
    return {
      repoUrl: url,
      repoName: repo.name,
      pages: analysis.pages,
      routes: analysis.routes,
      totalFiles: analysis.totalFiles,
      analyzedFiles: analysis.analyzedFiles,
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('Repository analysis failed:', error)
    
    // If it's a rate limit or API error, return demo data
    if (error instanceof Error && (error.message.includes('rate limit') || error.message.includes('API'))) {
      const repo = parseGitHubUrl(url)
      const demoResult = {
        ...DEMO_ANALYSIS,
        repoUrl: url,
        repoName: repo?.name || 'demo-repo',
        timestamp: new Date().toISOString()
      }
      
      // Add error context to demo data
      if (demoResult.pages.length > 0) {
        demoResult.pages[0].preview = {
          ...demoResult.pages[0].preview!,
          description: `⚠️ ${error.message}. Showing demo visualization instead.`
        }
      }
      
      return demoResult
    }
    
    throw error
  }
}