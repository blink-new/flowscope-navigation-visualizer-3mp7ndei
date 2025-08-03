export interface PageNode {
  id: string
  name: string
  path: string
  filePath: string
  type: 'page' | 'component' | 'layout'
  connections: string[]
  position?: { x: number; y: number }
  preview?: {
    title: string
    description: string
    elements: string[]
    hasState: boolean
    hasProps: boolean
    complexity: 'low' | 'medium' | 'high'
  }
}

export interface RouteInfo {
  path: string
  component: string
  filePath: string
  children?: RouteInfo[]
}

export interface AnalysisResult {
  repoUrl: string
  repoName: string
  pages: PageNode[]
  routes: RouteInfo[]
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