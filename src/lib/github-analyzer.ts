import { FlowAnalysisResult, PageFlow, RouteInfo, GitHubRepo, UserJourney, PageConnection } from '@/types/analysis'

// Demo data for when GitHub API is unavailable
const DEMO_ANALYSIS: FlowAnalysisResult = {
  repoUrl: 'https://github.com/demo/react-ecommerce',
  repoName: 'react-ecommerce',
  pages: [
    {
      id: 'home',
      name: 'Home',
      path: '/',
      filePath: 'src/pages/HomePage.tsx',
      type: 'page',
      connections: [
        { targetPageId: 'products', type: 'navigation', trigger: 'Shop Now button' },
        { targetPageId: 'login', type: 'navigation', trigger: 'Login link' },
        { targetPageId: 'signup', type: 'navigation', trigger: 'Sign Up button' }
      ],
      position: { x: 100, y: 200 },
      metadata: {
        title: 'Home Page',
        description: 'Landing page with hero section and featured products',
        hasAuth: false,
        hasParams: false,
        isProtected: false,
        complexity: 'medium',
        userActions: ['Browse products', 'Sign up', 'Login'],
        entryPoints: ['Direct URL', 'Search engines', 'Social media']
      }
    },
    {
      id: 'products',
      name: 'Products',
      path: '/products',
      filePath: 'src/pages/ProductsPage.tsx',
      type: 'page',
      connections: [
        { targetPageId: 'product-detail', type: 'navigation', trigger: 'Product card click' },
        { targetPageId: 'cart', type: 'navigation', trigger: 'Add to cart' },
        { targetPageId: 'login', type: 'conditional', trigger: 'Wishlist action', condition: 'not authenticated' }
      ],
      position: { x: 500, y: 200 },
      metadata: {
        title: 'Product Catalog',
        description: 'Browse and filter products with search functionality',
        hasAuth: false,
        hasParams: true,
        isProtected: false,
        complexity: 'high',
        userActions: ['Filter products', 'Search', 'Add to cart', 'View details'],
        entryPoints: ['Home page', 'Search results', 'Category links']
      }
    },
    {
      id: 'product-detail',
      name: 'Product Detail',
      path: '/products/:id',
      filePath: 'src/pages/ProductDetailPage.tsx',
      type: 'page',
      connections: [
        { targetPageId: 'cart', type: 'navigation', trigger: 'Add to cart button' },
        { targetPageId: 'checkout', type: 'navigation', trigger: 'Buy now button' },
        { targetPageId: 'products', type: 'navigation', trigger: 'Back to products' }
      ],
      position: { x: 900, y: 200 },
      metadata: {
        title: 'Product Details',
        description: 'Detailed product view with images, specs, and reviews',
        hasAuth: false,
        hasParams: true,
        isProtected: false,
        complexity: 'medium',
        userActions: ['View images', 'Read reviews', 'Add to cart', 'Share product'],
        entryPoints: ['Product list', 'Search results', 'Direct link']
      }
    },
    {
      id: 'login',
      name: 'Login',
      path: '/login',
      filePath: 'src/pages/LoginPage.tsx',
      type: 'page',
      connections: [
        { targetPageId: 'dashboard', type: 'redirect', trigger: 'Successful login', condition: 'valid credentials' },
        { targetPageId: 'signup', type: 'navigation', trigger: 'Create account link' },
        { targetPageId: 'forgot-password', type: 'navigation', trigger: 'Forgot password link' }
      ],
      position: { x: 100, y: 500 },
      metadata: {
        title: 'User Login',
        description: 'Authentication form for existing users',
        hasAuth: true,
        hasParams: false,
        isProtected: false,
        complexity: 'medium',
        userActions: ['Enter credentials', 'Remember me', 'Forgot password'],
        entryPoints: ['Header link', 'Protected page redirect', 'Checkout flow']
      }
    },
    {
      id: 'signup',
      name: 'Sign Up',
      path: '/signup',
      filePath: 'src/pages/SignUpPage.tsx',
      type: 'page',
      connections: [
        { targetPageId: 'dashboard', type: 'redirect', trigger: 'Account created', condition: 'valid form' },
        { targetPageId: 'login', type: 'navigation', trigger: 'Already have account link' }
      ],
      position: { x: 500, y: 500 },
      metadata: {
        title: 'Create Account',
        description: 'Registration form for new users',
        hasAuth: true,
        hasParams: false,
        isProtected: false,
        complexity: 'high',
        userActions: ['Fill form', 'Verify email', 'Accept terms'],
        entryPoints: ['Home page CTA', 'Login page', 'Checkout flow']
      }
    },
    {
      id: 'dashboard',
      name: 'Dashboard',
      path: '/dashboard',
      filePath: 'src/pages/DashboardPage.tsx',
      type: 'page',
      connections: [
        { targetPageId: 'profile', type: 'navigation', trigger: 'Profile link' },
        { targetPageId: 'orders', type: 'navigation', trigger: 'Order history' },
        { targetPageId: 'products', type: 'navigation', trigger: 'Continue shopping' }
      ],
      position: { x: 900, y: 500 },
      metadata: {
        title: 'User Dashboard',
        description: 'Personalized user area with account overview',
        hasAuth: true,
        hasParams: false,
        isProtected: true,
        complexity: 'medium',
        userActions: ['View orders', 'Update profile', 'Manage preferences'],
        entryPoints: ['Login redirect', 'Header link (authenticated)']
      }
    },
    {
      id: 'cart',
      name: 'Shopping Cart',
      path: '/cart',
      filePath: 'src/pages/CartPage.tsx',
      type: 'page',
      connections: [
        { targetPageId: 'checkout', type: 'navigation', trigger: 'Proceed to checkout' },
        { targetPageId: 'products', type: 'navigation', trigger: 'Continue shopping' },
        { targetPageId: 'login', type: 'conditional', trigger: 'Checkout', condition: 'not authenticated' }
      ],
      position: { x: 100, y: 800 },
      metadata: {
        title: 'Shopping Cart',
        description: 'Review items before checkout',
        hasAuth: false,
        hasParams: false,
        isProtected: false,
        complexity: 'medium',
        userActions: ['Update quantities', 'Remove items', 'Apply coupons'],
        entryPoints: ['Add to cart action', 'Header cart icon']
      }
    },
    {
      id: 'checkout',
      name: 'Checkout',
      path: '/checkout',
      filePath: 'src/pages/CheckoutPage.tsx',
      type: 'page',
      connections: [
        { targetPageId: 'order-success', type: 'redirect', trigger: 'Payment success', condition: 'payment processed' },
        { targetPageId: 'cart', type: 'navigation', trigger: 'Back to cart' }
      ],
      position: { x: 500, y: 800 },
      metadata: {
        title: 'Checkout',
        description: 'Payment and shipping information form',
        hasAuth: true,
        hasParams: false,
        isProtected: true,
        complexity: 'high',
        userActions: ['Enter shipping', 'Select payment', 'Review order'],
        entryPoints: ['Cart page', 'Buy now button']
      }
    },
    {
      id: 'order-success',
      name: 'Order Success',
      path: '/order/success',
      filePath: 'src/pages/OrderSuccessPage.tsx',
      type: 'page',
      connections: [
        { targetPageId: 'dashboard', type: 'navigation', trigger: 'View order details' },
        { targetPageId: 'products', type: 'navigation', trigger: 'Continue shopping' }
      ],
      position: { x: 900, y: 800 },
      metadata: {
        title: 'Order Confirmation',
        description: 'Success page after completed purchase',
        hasAuth: true,
        hasParams: true,
        isProtected: true,
        complexity: 'low',
        userActions: ['View order details', 'Download receipt', 'Continue shopping'],
        entryPoints: ['Checkout completion']
      }
    }
  ],
  routes: [
    { path: '/', component: 'HomePage', filePath: 'src/pages/HomePage.tsx' },
    { path: '/products', component: 'ProductsPage', filePath: 'src/pages/ProductsPage.tsx' },
    { path: '/products/:id', component: 'ProductDetailPage', filePath: 'src/pages/ProductDetailPage.tsx', params: ['id'] },
    { path: '/login', component: 'LoginPage', filePath: 'src/pages/LoginPage.tsx' },
    { path: '/signup', component: 'SignUpPage', filePath: 'src/pages/SignUpPage.tsx' },
    { path: '/dashboard', component: 'DashboardPage', filePath: 'src/pages/DashboardPage.tsx', guards: ['auth'] },
    { path: '/cart', component: 'CartPage', filePath: 'src/pages/CartPage.tsx' },
    { path: '/checkout', component: 'CheckoutPage', filePath: 'src/pages/CheckoutPage.tsx', guards: ['auth'] },
    { path: '/order/success', component: 'OrderSuccessPage', filePath: 'src/pages/OrderSuccessPage.tsx', guards: ['auth'] }
  ],
  userJourneys: [
    {
      id: 'guest-purchase',
      name: 'Guest Purchase Flow',
      description: 'New visitor discovers and purchases a product',
      steps: [],
      startPage: 'home',
      endPage: 'order-success',
      userType: 'guest'
    },
    {
      id: 'returning-user',
      name: 'Returning User Journey',
      description: 'Authenticated user browses and makes repeat purchase',
      steps: [],
      startPage: 'dashboard',
      endPage: 'order-success',
      userType: 'authenticated'
    }
  ],
  totalFiles: 45,
  analyzedFiles: 12,
  timestamp: new Date().toISOString()
}

interface GitHubFile {
  name: string
  path: string
  type: 'file' | 'dir'
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

function detectPageFlows(content: string, filePath: string): PageFlow[] {
  const pages: PageFlow[] = []
  
  // Focus on page-level components (not small UI components)
  const pageRegex = /(?:export\s+(?:default\s+)?(?:function|const)\s+(\w+)|function\s+(\w+))\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*{[\s\S]*?return\s*\([\s\S]*?<[\s\S]*?>/g
  const matches = [...content.matchAll(pageRegex)]
  
  matches.forEach((match, index) => {
    const componentName = match[1] || match[2]
    if (!componentName) return
    
    // Only process page-level components
    const isPage = filePath.includes('/pages/') || 
                   filePath.includes('/routes/') || 
                   filePath.includes('/app/') ||
                   componentName.toLowerCase().includes('page') ||
                   componentName.toLowerCase().includes('screen') ||
                   componentName.toLowerCase().includes('view')
    
    if (!isPage) return
    
    // Determine page type
    let type: 'page' | 'layout' | 'modal' | 'redirect' = 'page'
    if (componentName.toLowerCase().includes('layout') || componentName.toLowerCase().includes('wrapper')) {
      type = 'layout'
    } else if (componentName.toLowerCase().includes('modal') || componentName.toLowerCase().includes('dialog')) {
      type = 'modal'
    } else if (componentName.toLowerCase().includes('redirect')) {
      type = 'redirect'
    }
    
    // Extract route path from file structure or component name
    const routePath = extractRoutePath(filePath, componentName)
    
    // Analyze page characteristics
    const hasAuth = /useAuth|isAuthenticated|requireAuth|PrivateRoute|ProtectedRoute/.test(content)
    const hasParams = /useParams|props\.match\.params|\$\{.*\}|:\w+/.test(content)
    const isProtected = /requireAuth|ProtectedRoute|authGuard|canActivate/.test(content)
    const hasState = /useState|useReducer|this\.state/.test(content)
    const hasEffects = /useEffect|componentDidMount|componentDidUpdate/.test(content)
    const hasAPI = /fetch\(|axios\.|api\.|useQuery|useMutation/.test(content)
    const hasForm = /<form|useForm|Formik|react-hook-form/.test(content)
    
    // Calculate complexity
    let complexity: 'low' | 'medium' | 'high' = 'low'
    const complexityScore = [hasState, hasEffects, hasAPI, hasForm, hasAuth].filter(Boolean).length
    if (complexityScore >= 4) complexity = 'high'
    else if (complexityScore >= 2) complexity = 'medium'
    
    // Extract user actions
    const userActions = extractUserActions(content)
    
    // Extract entry points
    const entryPoints = extractEntryPoints(content, routePath)
    
    pages.push({
      id: `${componentName.toLowerCase()}-${index}`,
      name: componentName.replace(/Page$|Screen$|View$/, ''),
      path: routePath,
      filePath,
      type,
      connections: [], // Will be populated later
      metadata: {
        title: componentName.replace(/Page$|Screen$|View$/, ''),
        description: generatePageDescription(componentName, hasAuth, hasForm, hasAPI),
        hasAuth,
        hasParams,
        isProtected,
        complexity,
        userActions,
        entryPoints
      }
    })
  })
  
  return pages
}

function extractRoutePath(filePath: string, componentName: string): string {
  // Extract from file path structure
  if (filePath.includes('/pages/')) {
    const pathPart = filePath.split('/pages/')[1]
    if (pathPart) {
      const route = '/' + pathPart
        .replace(/\.tsx?$/, '')
        .replace(/\/index$/, '')
        .replace(/\[([^\]]+)\]/g, ':$1') // Convert [id] to :id
      
      if (route === '/') return '/'
      return route.replace(/\/$/, '') // Remove trailing slash
    }
  }
  
  // Extract from component name
  let route = `/${componentName.toLowerCase().replace(/page$|screen$|view$/, '')}`
  if (componentName.toLowerCase() === 'home' || componentName.toLowerCase() === 'homepage') {
    route = '/'
  }
  
  return route
}

function extractUserActions(content: string): string[] {
  const actions: string[] = []
  
  // Common user interaction patterns
  if (/<button|onClick/.test(content)) actions.push('Click actions')
  if (/<form|onSubmit/.test(content)) actions.push('Form submission')
  if (/input|textarea|select/i.test(content)) actions.push('Data entry')
  if (/search|filter/i.test(content)) actions.push('Search/Filter')
  if (/login|signin|authenticate/i.test(content)) actions.push('Authentication')
  if (/cart|checkout|purchase|buy/i.test(content)) actions.push('Shopping')
  if (/upload|file/i.test(content)) actions.push('File upload')
  if (/share|social/i.test(content)) actions.push('Social sharing')
  
  return actions.length > 0 ? actions : ['View content']
}

function extractEntryPoints(content: string, routePath: string): string[] {
  const entryPoints: string[] = []
  
  // Common entry point patterns
  if (routePath === '/') entryPoints.push('Direct URL', 'Search engines')
  if (/login|signin/i.test(content)) entryPoints.push('Authentication flow')
  if (/dashboard|profile/i.test(content)) entryPoints.push('User area')
  if (/product|item|detail/i.test(content)) entryPoints.push('Product links')
  if (/search|results/i.test(content)) entryPoints.push('Search results')
  
  return entryPoints.length > 0 ? entryPoints : ['Navigation']
}

function generatePageDescription(componentName: string, hasAuth: boolean, hasForm: boolean, hasAPI: boolean): string {
  const name = componentName.replace(/Page$|Screen$|View$/, '').toLowerCase()
  
  let description = `${componentName.replace(/Page$|Screen$|View$/, '')} page`
  
  if (hasForm) description += ' with form functionality'
  if (hasAuth) description += ' requiring authentication'
  if (hasAPI) description += ' with data integration'
  
  return description
}

function extractPageConnections(content: string): PageConnection[] {
  const connections: PageConnection[] = []
  
  // React Router Link components
  const linkRegex = /<Link[^>]+to=["']([^"']+)["'][^>]*>([^<]*)</g
  const linkMatches = [...content.matchAll(linkRegex)]
  linkMatches.forEach(match => {
    connections.push({
      targetPageId: match[1],
      type: 'navigation',
      trigger: `${match[2] || 'Link'} click`
    })
  })
  
  // Next.js Link components
  const nextLinkRegex = /<Link[^>]+href=["']([^"']+)["'][^>]*>([^<]*)</g
  const nextLinkMatches = [...content.matchAll(nextLinkRegex)]
  nextLinkMatches.forEach(match => {
    connections.push({
      targetPageId: match[1],
      type: 'navigation',
      trigger: `${match[2] || 'Link'} click`
    })
  })
  
  // useNavigate calls
  const navigateRegex = /navigate\s*\(\s*["']([^"']+)["']\s*\)/g
  const navigateMatches = [...content.matchAll(navigateRegex)]
  navigateMatches.forEach(match => {
    connections.push({
      targetPageId: match[1],
      type: 'navigation',
      trigger: 'Programmatic navigation'
    })
  })
  
  // Conditional redirects
  const redirectRegex = /if\s*\([^)]+\)\s*[^{]*navigate\s*\(\s*["']([^"']+)["']\s*\)/g
  const redirectMatches = [...content.matchAll(redirectRegex)]
  redirectMatches.forEach(match => {
    connections.push({
      targetPageId: match[1],
      type: 'conditional',
      trigger: 'Conditional redirect',
      condition: 'Based on state/props'
    })
  })
  
  return connections
}

async function analyzePageFlows(repo: GitHubRepo): Promise<{ pages: PageFlow[], routes: RouteInfo[], totalFiles: number, analyzedFiles: number }> {
  const pages: PageFlow[] = []
  const routes: RouteInfo[] = []
  let totalFiles = 0
  let analyzedFiles = 0
  
  async function scanDirectory(path = ''): Promise<void> {
    try {
      const contents = await fetchRepoContents(repo, path)
      totalFiles += contents.length
      
      for (const item of contents) {
        if (item.type === 'dir' && (item.name === 'src' || item.name === 'pages' || item.name === 'app' || item.name === 'components')) {
          await scanDirectory(item.path)
        } else if (item.type === 'file' && (item.name.endsWith('.tsx') || item.name.endsWith('.jsx')) && item.download_url) {
          // Only analyze page-level files
          const isPageFile = item.path.includes('/pages/') || 
                            item.path.includes('/routes/') || 
                            item.path.includes('/app/') ||
                            item.name.toLowerCase().includes('page')
          
          if (isPageFile) {
            try {
              const content = await fetchFileContent(item.download_url)
              const pageFlows = detectPageFlows(content, item.path)
              pages.push(...pageFlows)
              
              // Extract routes for page files
              pageFlows.forEach(page => {
                if (page.type === 'page') {
                  routes.push({
                    path: page.path,
                    component: page.name,
                    filePath: page.filePath,
                    guards: page.metadata.isProtected ? ['auth'] : undefined,
                    params: page.metadata.hasParams ? ['id'] : undefined
                  })
                }
              })
              
              analyzedFiles++
            } catch (error) {
              console.warn(`Failed to analyze file ${item.path}:`, error)
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${path}:`, error)
    }
  }
  
  await scanDirectory()
  
  // Build connections between pages
  for (const page of pages) {
    if (page.filePath) {
      try {
        const content = await fetchFileContent(`https://raw.githubusercontent.com/${repo.owner}/${repo.name}/${repo.branch}/${page.filePath}`)
        const connections = extractPageConnections(content)
        
        // Map connections to actual page IDs
        connections.forEach(conn => {
          const targetPage = pages.find(p => p.path === conn.targetPageId)
          if (targetPage) {
            page.connections.push({
              ...conn,
              targetPageId: targetPage.id
            })
          }
        })
      } catch (error) {
        console.warn(`Failed to extract connections from ${page.filePath}:`, error)
      }
    }
  }
  
  return { pages, routes, totalFiles, analyzedFiles }
}

export async function analyzeGitHubRepo(url: string): Promise<FlowAnalysisResult> {
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
        demoResult.pages[0].metadata = {
          ...demoResult.pages[0].metadata,
          description: '⚠️ Demo data - GitHub API unavailable. This shows sample page flow analysis.'
        }
      }
      
      throw new Error(`GitHub API unavailable (${error instanceof Error ? error.message : 'Unknown error'}). Showing demo visualization instead.`)
    }
    
    const analysis = await analyzePageFlows(repo)
    
    // Generate user journeys based on detected pages
    const userJourneys = generateUserJourneys(analysis.pages)
    
    return {
      repoUrl: url,
      repoName: repo.name,
      pages: analysis.pages,
      routes: analysis.routes,
      userJourneys,
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
        demoResult.pages[0].metadata = {
          ...demoResult.pages[0].metadata,
          description: `⚠️ ${error.message}. Showing demo visualization instead.`
        }
      }
      
      return demoResult
    }
    
    throw error
  }
}

function generateUserJourneys(pages: PageFlow[]): UserJourney[] {
  const journeys: UserJourney[] = []
  
  // Find common journey patterns
  const homePage = pages.find(p => p.path === '/' || p.name.toLowerCase().includes('home'))
  const loginPage = pages.find(p => p.path.includes('login') || p.name.toLowerCase().includes('login'))
  const dashboardPage = pages.find(p => p.path.includes('dashboard') || p.name.toLowerCase().includes('dashboard'))
  
  if (homePage && loginPage) {
    journeys.push({
      id: 'guest-onboarding',
      name: 'New User Onboarding',
      description: 'First-time visitor discovers the app and creates an account',
      steps: [homePage, loginPage],
      startPage: homePage.id,
      endPage: dashboardPage?.id || loginPage.id,
      userType: 'guest'
    })
  }
  
  if (dashboardPage) {
    journeys.push({
      id: 'authenticated-user',
      name: 'Authenticated User Flow',
      description: 'Returning user accesses their account and performs tasks',
      steps: [dashboardPage],
      startPage: dashboardPage.id,
      endPage: dashboardPage.id,
      userType: 'authenticated'
    })
  }
  
  return journeys
}