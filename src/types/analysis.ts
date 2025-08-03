export interface PageFlow {
  id: string
  name: string
  path: string
  filePath: string
  type: 'page' | 'layout' | 'modal' | 'redirect'
  connections: PageConnection[]
  position?: { x: number; y: number }
  metadata: {
    title: string
    description: string
    hasAuth: boolean
    hasParams: boolean
    isProtected: boolean
    complexity: 'low' | 'medium' | 'high'
    userActions: string[]
    entryPoints: string[]
  }
}

export interface PageConnection {
  targetPageId: string
  type: 'navigation' | 'redirect' | 'modal' | 'conditional'
  trigger: string // e.g., "button click", "form submit", "auto redirect"
  condition?: string // e.g., "authenticated", "form valid"
}

export interface UserJourney {
  id: string
  name: string
  description: string
  steps: PageFlow[]
  startPage: string
  endPage: string
  userType: 'guest' | 'authenticated' | 'admin'
}

export interface RouteInfo {
  path: string
  component: string
  filePath: string
  children?: RouteInfo[]
  guards?: string[]
  params?: string[]
}

export interface FlowAnalysisResult {
  repoUrl: string
  repoName: string
  pages: PageFlow[]
  routes: RouteInfo[]
  userJourneys: UserJourney[]
  totalFiles: number
  analyzedFiles: number
  timestamp: string
}

export interface GitHubRepo {
  url: string
  owner: string
  name: string
  branch?: string
}

// Legacy types for backward compatibility
export type PageNode = PageFlow
export type AnalysisResult = FlowAnalysisResult