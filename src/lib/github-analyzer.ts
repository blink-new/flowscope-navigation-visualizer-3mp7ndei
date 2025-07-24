import { AnalysisResult, PageNode, RouteInfo, GitHubRepo } from '@/types/analysis'

// GitHub API base URL
const GITHUB_API_BASE = 'https://api.github.com'

interface GitHubFile {
  name: string
  path: string
  type: 'file' | 'dir'
  download_url?: string
  url: string
}

interface GitHubContent {
  name: string
  path: string
  type: string
  content?: string
  download_url?: string
}

/**
 * Parse GitHub repository URL to extract owner and repo name
 */
function parseGitHubUrl(url: string): GitHubRepo {
  const cleanUrl = url.replace(/\/$/, '') // Remove trailing slash
  const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?/)
  
  if (!match) {
    throw new Error('Invalid GitHub repository URL')
  }

  return {
    url: cleanUrl,
    owner: match[1],
    name: match[2],
    branch: match[3] || 'main'
  }
}

/**
 * Fetch repository contents recursively
 */
async function fetchRepoContents(repo: GitHubRepo, path: string = ''): Promise<GitHubFile[]> {
  const url = `${GITHUB_API_BASE}/repos/${repo.owner}/${repo.name}/contents/${path}`
  
  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      if (response.status === 404) {
        // Try with 'master' branch if 'main' fails
        if (repo.branch === 'main') {
          repo.branch = 'master'
          return fetchRepoContents(repo, path)
        }
        throw new Error('Repository not found or is private')
      }
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const contents: GitHubContent[] = await response.json()
    const files: GitHubFile[] = []

    for (const item of contents) {
      if (item.type === 'file') {
        files.push({
          name: item.name,
          path: item.path,
          type: 'file',
          download_url: item.download_url,
          url: `${GITHUB_API_BASE}/repos/${repo.owner}/${repo.name}/contents/${item.path}`
        })
      } else if (item.type === 'dir' && shouldScanDirectory(item.path)) {
        // Recursively fetch subdirectory contents
        const subFiles = await fetchRepoContents(repo, item.path)
        files.push(...subFiles)
      }
    }

    return files
  } catch (error) {
    console.error('Error fetching repo contents:', error)
    throw error
  }
}

/**
 * Determine if we should scan a directory (skip node_modules, .git, etc.)
 */
function shouldScanDirectory(path: string): boolean {
  const skipDirs = ['node_modules', '.git', '.next', 'dist', 'build', '.vercel', '.netlify']
  return !skipDirs.some(dir => path.includes(dir))
}

/**
 * Check if file is a React/TypeScript component
 */
function isReactFile(filePath: string): boolean {
  const extensions = ['.tsx', '.jsx', '.ts', '.js']
  const hasValidExtension = extensions.some(ext => filePath.endsWith(ext))
  
  if (!hasValidExtension) return false
  
  // Skip test files, config files, etc.
  const skipPatterns = [
    '.test.', '.spec.', '.config.', '.setup.',
    'vite.config', 'webpack.config', 'tailwind.config'
  ]
  
  return !skipPatterns.some(pattern => filePath.includes(pattern))
}

/**
 * Fetch and analyze file content
 */
async function analyzeFileContent(file: GitHubFile): Promise<{
  isPage: boolean
  isComponent: boolean
  isLayout: boolean
  routes: string[]
  imports: string[]
  exports: string[]
}> {
  if (!file.download_url) {
    return {
      isPage: false,
      isComponent: false,
      isLayout: false,
      routes: [],
      imports: [],
      exports: []
    }
  }

  try {
    const response = await fetch(file.download_url)
    const content = await response.text()

    // Analyze content for React patterns
    const isPage = detectPageComponent(file.path, content)
    const isComponent = detectReactComponent(content)
    const isLayout = detectLayoutComponent(file.path, content)
    const routes = extractRoutes(content)
    const imports = extractImports(content)
    const exports = extractExports(content)

    return {
      isPage,
      isComponent,
      isLayout,
      routes,
      imports,
      exports
    }
  } catch (error) {
    console.error(`Error analyzing file ${file.path}:`, error)
    return {
      isPage: false,
      isComponent: false,
      isLayout: false,
      routes: [],
      imports: [],
      exports: []
    }
  }
}

/**
 * Detect if file is a page component
 */
function detectPageComponent(filePath: string, content: string): boolean {
  // Check file path patterns
  const pagePatterns = [
    /\/pages\//,
    /\/app\//,
    /\/routes\//,
    /\/screens\//,
    /\/views\//
  ]
  
  const hasPagePath = pagePatterns.some(pattern => pattern.test(filePath))
  
  // Check filename patterns
  const fileName = filePath.split('/').pop() || ''
  const pageNamePatterns = [
    /Page\.(tsx|jsx|ts|js)$/,
    /Screen\.(tsx|jsx|ts|js)$/,
    /View\.(tsx|jsx|ts|js)$/,
    /index\.(tsx|jsx|ts|js)$/
  ]
  
  const hasPageName = pageNamePatterns.some(pattern => pattern.test(fileName))
  
  // Check content for page-like patterns
  const hasRouterHooks = /use(Navigate|Location|Params|SearchParams)/.test(content)
  const hasPageTitle = /<title>|document\.title|useTitle/.test(content)
  
  return hasPagePath || hasPageName || (hasRouterHooks && hasPageTitle)
}

/**
 * Detect if file is a React component
 */
function detectReactComponent(content: string): boolean {
  const reactPatterns = [
    /import.*React/,
    /from ['"]react['"]/,
    /export.*function.*\(/,
    /export.*const.*=/,
    /export default/,
    /<[A-Z]/,
    /jsx|tsx/
  ]
  
  return reactPatterns.some(pattern => pattern.test(content))
}

/**
 * Detect if file is a layout component
 */
function detectLayoutComponent(filePath: string, content: string): boolean {
  const layoutPatterns = [
    /layout/i,
    /template/i,
    /wrapper/i
  ]
  
  const hasLayoutPath = layoutPatterns.some(pattern => pattern.test(filePath))
  const hasLayoutContent = /children|outlet|slot/i.test(content)
  
  return hasLayoutPath || hasLayoutContent
}

/**
 * Extract routing information from file content
 */
function extractRoutes(content: string): string[] {
  const routes: string[] = []
  
  // React Router patterns
  const routePatterns = [
    /<Route[^>]+path=['"]([^'"]+)['"]/g,
    /navigate\(['"]([^'"]+)['"]\)/g,
    /<Link[^>]+to=['"]([^'"]+)['"]/g,
    /<NavLink[^>]+to=['"]([^'"]+)['"]/g,
    /router\.push\(['"]([^'"]+)['"]\)/g,
    /href=['"]([^'"]+)['"]/g
  ]
  
  routePatterns.forEach(pattern => {
    let match
    while ((match = pattern.exec(content)) !== null) {
      const route = match[1]
      if (route && route.startsWith('/') && !routes.includes(route)) {
        routes.push(route)
      }
    }
  })
  
  return routes
}

/**
 * Extract import statements
 */
function extractImports(content: string): string[] {
  const imports: string[] = []
  const importPattern = /import.*from ['"]([^'"]+)['"]/g
  
  let match
  while ((match = importPattern.exec(content)) !== null) {
    imports.push(match[1])
  }
  
  return imports
}

/**
 * Extract export statements
 */
function extractExports(content: string): string[] {
  const exports: string[] = []
  const exportPatterns = [
    /export\s+(?:default\s+)?(?:function|const|class)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g,
    /export\s*{\s*([^}]+)\s*}/g
  ]
  
  exportPatterns.forEach(pattern => {
    let match
    while ((match = pattern.exec(content)) !== null) {
      if (pattern.source.includes('{')) {
        // Handle named exports
        const namedExports = match[1].split(',').map(exp => exp.trim().split(' as ')[0])
        exports.push(...namedExports)
      } else {
        exports.push(match[1])
      }
    }
  })
  
  return exports
}

/**
 * Build page nodes from analyzed files
 */
function buildPageNodes(analyzedFiles: Array<{
  file: GitHubFile
  analysis: Awaited<ReturnType<typeof analyzeFileContent>>
}>): PageNode[] {
  const nodes: PageNode[] = []
  
  analyzedFiles.forEach(({ file, analysis }, index) => {
    if (analysis.isPage || analysis.isComponent || analysis.isLayout) {
      const name = file.name.replace(/\.(tsx|jsx|ts|js)$/, '')
      const type = analysis.isPage ? 'page' : analysis.isLayout ? 'layout' : 'component'
      
      // Generate connections based on routes found in the file
      const connections = analysis.routes
        .map(route => {
          // Find other nodes that might match this route
          const targetNode = analyzedFiles.find(({ file: f, analysis: a }) => 
            (a.isPage || a.isComponent) && 
            (f.path.includes(route.slice(1)) || route.includes(f.name.replace(/\.(tsx|jsx|ts|js)$/, '')))
          )
          return targetNode ? targetNode.file.path : null
        })
        .filter(Boolean) as string[]
      
      nodes.push({
        id: file.path,
        name,
        path: analysis.routes[0] || `/${name.toLowerCase()}`,
        filePath: file.path,
        type,
        connections,
        position: {
          x: (index % 4) * 250 + 100,
          y: Math.floor(index / 4) * 150 + 100
        }
      })
    }
  })
  
  return nodes
}

/**
 * Build route information from analyzed files
 */
function buildRouteInfo(analyzedFiles: Array<{
  file: GitHubFile
  analysis: Awaited<ReturnType<typeof analyzeFileContent>>
}>): RouteInfo[] {
  const routes: RouteInfo[] = []
  
  analyzedFiles.forEach(({ file, analysis }) => {
    if (analysis.isPage && analysis.routes.length > 0) {
      analysis.routes.forEach(route => {
        routes.push({
          path: route,
          component: file.name.replace(/\.(tsx|jsx|ts|js)$/, ''),
          filePath: file.path
        })
      })
    }
  })
  
  return routes
}

/**
 * Main function to analyze GitHub repository
 */
export async function analyzeGitHubRepo(repoUrl: string): Promise<AnalysisResult> {
  try {
    // Parse repository URL
    const repo = parseGitHubUrl(repoUrl)
    
    // Fetch repository contents
    const allFiles = await fetchRepoContents(repo)
    
    // Filter React files
    const reactFiles = allFiles.filter(file => isReactFile(file.path))
    
    if (reactFiles.length === 0) {
      throw new Error('No React/TypeScript files found in this repository')
    }
    
    // Analyze each React file
    const analyzedFiles = []
    for (const file of reactFiles.slice(0, 20)) { // Limit to first 20 files for performance
      const analysis = await analyzeFileContent(file)
      analyzedFiles.push({ file, analysis })
    }
    
    // Build page nodes and route information
    const pages = buildPageNodes(analyzedFiles)
    const routes = buildRouteInfo(analyzedFiles)
    
    // If no pages found, create some from components
    if (pages.length === 0 && analyzedFiles.length > 0) {
      analyzedFiles.slice(0, 5).forEach(({ file }, index) => {
        const name = file.name.replace(/\.(tsx|jsx|ts|js)$/, '')
        pages.push({
          id: file.path,
          name,
          path: `/${name.toLowerCase()}`,
          filePath: file.path,
          type: 'component',
          connections: [],
          position: {
            x: (index % 3) * 200 + 100,
            y: Math.floor(index / 3) * 150 + 100
          }
        })
      })
    }
    
    return {
      repoUrl,
      repoName: `${repo.owner}/${repo.name}`,
      pages,
      routes,
      totalFiles: allFiles.length,
      analyzedFiles: reactFiles.length,
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('Repository analysis failed:', error)
    throw error instanceof Error ? error : new Error('Unknown analysis error')
  }
}