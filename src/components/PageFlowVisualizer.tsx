import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ArrowLeft, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  FileText,
  Route,
  Layout,
  ExternalLink,
  Eye,
  GitBranch,
  Users,
  Shield,
  MousePointer,
  Layers,
  Navigation
} from 'lucide-react'
import { FlowAnalysisResult, PageFlow, PageConnection } from '@/types/analysis'

interface PageFlowVisualizerProps {
  analysisResult: FlowAnalysisResult
  onBack: () => void
}

export default function PageFlowVisualizer({ analysisResult, onBack }: PageFlowVisualizerProps) {
  const [selectedPage, setSelectedPage] = useState<PageFlow | null>(null)
  const [zoom, setZoom] = useState(0.8)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedPage, setDraggedPage] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const [pages, setPages] = useState<PageFlow[]>([])
  const [viewMode, setViewMode] = useState<'flow' | 'journeys'>('flow')

  useEffect(() => {
    // Position pages in a more organized flow layout
    const positionedPages = analysisResult.pages.map((page, index) => {
      // Create a flow-based layout similar to Figma
      const cols = 4 // Fixed columns for better organization
      const col = index % cols
      const row = Math.floor(index / cols)
      
      const x = 150 + col * 400 // More spacing for page cards
      const y = 150 + row * 350 // More vertical spacing
      
      return {
        ...page,
        position: page.position || { x, y }
      }
    })
    setPages(positionedPages)
  }, [analysisResult])

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.3))
  const handleResetZoom = () => setZoom(0.8)

  const handleMouseDown = useCallback((e: React.MouseEvent, pageId: string) => {
    e.preventDefault()
    setIsDragging(true)
    setDraggedPage(pageId)
    
    const page = pages.find(p => p.id === pageId)
    if (page && page.position) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        setDragOffset({
          x: (e.clientX - rect.left) / zoom - page.position.x,
          y: (e.clientY - rect.top) / zoom - page.position.y
        })
      }
    }
  }, [pages, zoom])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !draggedPage) return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const newX = (e.clientX - rect.left) / zoom - dragOffset.x
    const newY = (e.clientY - rect.top) / zoom - dragOffset.y
    
    setPages(prev => prev.map(page => 
      page.id === draggedPage 
        ? { ...page, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
        : page
    ))
  }, [isDragging, draggedPage, dragOffset, zoom])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDraggedPage(null)
  }, [])

  const getPageTypeColor = (type: string) => {
    switch (type) {
      case 'page': return 'from-blue-500 to-blue-600'
      case 'layout': return 'from-purple-500 to-purple-600'
      case 'modal': return 'from-orange-500 to-orange-600'
      case 'redirect': return 'from-gray-500 to-gray-600'
      default: return 'from-slate-500 to-slate-600'
    }
  }

  const getPageTypeIcon = (type: string) => {
    switch (type) {
      case 'page': return <FileText className="w-5 h-5" />
      case 'layout': return <Layout className="w-5 h-5" />
      case 'modal': return <Layers className="w-5 h-5" />
      case 'redirect': return <Navigation className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  const getConnectionTypeColor = (type: string) => {
    switch (type) {
      case 'navigation': return '#3b82f6' // blue
      case 'redirect': return '#ef4444' // red
      case 'modal': return '#f59e0b' // amber
      case 'conditional': return '#8b5cf6' // purple
      default: return '#6b7280' // gray
    }
  }

  const getComplexityColor = (complexity: 'low' | 'medium' | 'high') => {
    switch (complexity) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const renderConnectionLine = (fromPage: PageFlow, connection: PageConnection) => {
    const toPage = pages.find(p => p.id === connection.targetPageId)
    if (!toPage || !fromPage.position || !toPage.position) return null
    
    const startX = fromPage.position.x + 180 // Center of card
    const startY = fromPage.position.y + 140
    const endX = toPage.position.x + 180
    const endY = toPage.position.y + 140
    
    // Create curved path for better visual flow
    const midX = (startX + endX) / 2
    const midY = (startY + endY) / 2 - 60 // Curve upward
    
    const color = getConnectionTypeColor(connection.type)
    const isDashed = connection.type === 'conditional'
    
    return (
      <g key={`${fromPage.id}-${connection.targetPageId}`}>
        <path
          d={`M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`}
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeDasharray={isDashed ? "8,4" : "none"}
          markerEnd="url(#arrowhead)"
          className="drop-shadow-sm"
        />
        {/* Connection label */}
        <foreignObject
          x={midX - 60}
          y={midY - 10}
          width="120"
          height="20"
        >
          <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-center border shadow-sm">
            {connection.trigger}
          </div>
        </foreignObject>
      </g>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Sidebar */}
      <div className="w-80 border-r bg-white/80 backdrop-blur-sm flex flex-col shadow-lg">
        {/* Header */}
        <div className="p-6 border-b bg-white/90">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-slate-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex space-x-2">
              <Button 
                variant={viewMode === 'flow' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setViewMode('flow')}
              >
                <Route className="w-4 h-4 mr-1" />
                Flow
              </Button>
              <Button 
                variant={viewMode === 'journeys' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setViewMode('journeys')}
              >
                <Users className="w-4 h-4 mr-1" />
                Journeys
              </Button>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              {analysisResult.repoName}
            </h2>
            <p className="text-sm text-slate-600 mb-3 flex items-center">
              <GitBranch className="w-4 h-4 mr-1" />
              {analysisResult.pages.length} pages • {analysisResult.routes.length} routes
            </p>
            <a 
              href={analysisResult.repoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center font-medium"
            >
              View Repository <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>

        {/* Analysis Summary */}
        <div className="p-6 border-b">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
            <Eye className="w-4 h-4 mr-2" />
            Page Flow Analysis
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analysisResult.pages.length}</div>
              <div className="text-xs text-blue-600 font-medium">Pages</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analysisResult.pages.reduce((acc, page) => acc + page.connections.length, 0)}
              </div>
              <div className="text-xs text-green-600 font-medium">Connections</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {analysisResult.pages.filter(p => p.metadata.isProtected).length}
              </div>
              <div className="text-xs text-purple-600 font-medium">Protected</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {analysisResult.userJourneys.length}
              </div>
              <div className="text-xs text-orange-600 font-medium">Journeys</div>
            </div>
          </div>
        </div>

        {/* Pages List */}
        <div className="flex-1 overflow-hidden">
          <div className="p-6 pb-4">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Pages
            </h3>
          </div>
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-3 pb-6">
              {pages.map((page) => (
                <Card 
                  key={page.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] border-l-4 ${
                    selectedPage?.id === page.id 
                      ? 'ring-2 ring-primary shadow-lg scale-[1.02] border-l-primary' 
                      : page.type === 'page' 
                        ? 'border-l-blue-500' 
                        : page.type === 'layout' 
                          ? 'border-l-purple-500' 
                          : page.type === 'modal'
                            ? 'border-l-orange-500'
                            : 'border-l-gray-500'
                  }`}
                  onClick={() => setSelectedPage(page)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${getPageTypeColor(page.type)} rounded-xl flex items-center justify-center text-white shadow-sm`}>
                        {getPageTypeIcon(page.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm text-slate-900 truncate">
                            {page.metadata.title}
                          </p>
                          <div className="flex items-center space-x-1">
                            {page.metadata.isProtected && (
                              <Shield className="w-3 h-3 text-amber-600" />
                            )}
                            <Badge className={`text-xs ${getComplexityColor(page.metadata.complexity)}`}>
                              {page.metadata.complexity}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 truncate font-mono">
                          {page.path}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-1">
                          {page.metadata.description}
                        </p>
                      </div>
                    </div>
                    {page.connections.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-600 flex items-center">
                          <GitBranch className="w-3 h-3 mr-1" />
                          {page.connections.length} connection{page.connections.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Canvas Header */}
        <div className="p-4 border-b bg-white/90 backdrop-blur-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <Route className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Page Flow Diagram</h3>
              <p className="text-xs text-slate-600 flex items-center">
                <MousePointer className="w-3 h-3 mr-1" />
                Drag pages to rearrange • Click to select
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut} className="hover:bg-slate-50">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-600 min-w-[60px] text-center font-mono">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={handleZoomIn} className="hover:bg-slate-50">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetZoom} className="hover:bg-slate-50">
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" size="sm" className="hover:bg-slate-50">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 overflow-auto relative">
          <div 
            ref={canvasRef}
            className="relative min-w-full min-h-full cursor-move"
            style={{ 
              transform: `scale(${zoom})`, 
              transformOrigin: 'top left',
              width: `${100 / zoom}%`,
              height: `${100 / zoom}%`
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-30">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              {pages.map((page) => 
                page.connections.map((connection) => renderConnectionLine(page, connection))
              )}
              
              {/* Arrow marker definitions */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="12"
                  markerHeight="8"
                  refX="11"
                  refY="4"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 12 4, 0 8"
                    fill="#6366f1"
                    className="drop-shadow-sm"
                  />
                </marker>
              </defs>
            </svg>

            {/* Page Cards */}
            {pages.map((page) => (
              <div
                key={page.id}
                className={`absolute transition-all duration-200 ${
                  selectedPage?.id === page.id ? 'scale-105 z-10' : 'z-0'
                } ${isDragging && draggedPage === page.id ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{
                  left: page.position?.x || 0,
                  top: page.position?.y || 0,
                  zIndex: selectedPage?.id === page.id ? 10 : 2
                }}
                onMouseDown={(e) => handleMouseDown(e, page.id)}
                onClick={() => setSelectedPage(page)}
              >
                <Card 
                  className={`w-80 h-64 shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${
                    selectedPage?.id === page.id 
                      ? 'border-primary shadow-2xl' 
                      : 'border-slate-200 hover:border-slate-300'
                  } bg-white/95 backdrop-blur-sm`}
                >
                  {/* Card Header */}
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${getPageTypeColor(page.type)} rounded-xl flex items-center justify-center text-white shadow-sm`}>
                          {getPageTypeIcon(page.type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-900">
                            {page.metadata.title}
                          </CardTitle>
                          <p className="text-sm text-slate-600 font-mono">{page.path}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {page.metadata.isProtected && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200">
                            <Shield className="w-3 h-3 mr-1" />
                            Protected
                          </Badge>
                        )}
                        <Badge className={`text-xs border ${getComplexityColor(page.metadata.complexity)}`}>
                          {page.metadata.complexity.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Card Content */}
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <p className="text-sm text-slate-600">{page.metadata.description}</p>
                      
                      {/* User Actions */}
                      <div>
                        <p className="text-xs font-semibold text-slate-700 mb-2">User Actions:</p>
                        <div className="flex flex-wrap gap-1">
                          {page.metadata.userActions.slice(0, 3).map((action, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {action}
                            </Badge>
                          ))}
                          {page.metadata.userActions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{page.metadata.userActions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Entry Points */}
                      <div>
                        <p className="text-xs font-semibold text-slate-700 mb-2">Entry Points:</p>
                        <div className="flex flex-wrap gap-1">
                          {page.metadata.entryPoints.slice(0, 2).map((entry, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                              {entry}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {/* Connection Count */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-500 font-mono">
                          {page.filePath.split('/').pop()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          <GitBranch className="w-3 h-3 mr-1" />
                          {page.connections.length} connections
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Page Details */}
        {selectedPage && (
          <div className="border-t bg-white/90 backdrop-blur-sm p-4 shadow-lg">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-3">
                  <div className={`w-8 h-8 bg-gradient-to-br ${getPageTypeColor(selectedPage.type)} rounded-xl flex items-center justify-center text-white shadow-sm`}>
                    {getPageTypeIcon(selectedPage.type)}
                  </div>
                  <div>
                    <span className="text-slate-900">{selectedPage.metadata.title}</span>
                    <Badge variant="secondary" className="ml-2">{selectedPage.type}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">Route Path</p>
                    <p className="text-sm text-slate-600 font-mono bg-slate-50 px-2 py-1 rounded">{selectedPage.path}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">File Location</p>
                    <p className="text-sm text-slate-600 font-mono bg-slate-50 px-2 py-1 rounded truncate">{selectedPage.filePath}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">Complexity</p>
                    <Badge className={`${getComplexityColor(selectedPage.metadata.complexity)} border`}>
                      {selectedPage.metadata.complexity.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                {selectedPage.connections.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-2 flex items-center">
                      <GitBranch className="w-4 h-4 mr-1" />
                      Page Connections ({selectedPage.connections.length})
                    </p>
                    <div className="space-y-2">
                      {selectedPage.connections.map((connection, idx) => {
                        const targetPage = pages.find(p => p.id === connection.targetPageId)
                        return targetPage ? (
                          <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                            <div className="flex items-center space-x-2">
                              <div className={`w-6 h-6 bg-gradient-to-br ${getPageTypeColor(targetPage.type)} rounded-lg flex items-center justify-center text-white`}>
                                {getPageTypeIcon(targetPage.type)}
                              </div>
                              <span className="font-medium text-sm">{targetPage.metadata.title}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                                style={{ borderColor: getConnectionTypeColor(connection.type), color: getConnectionTypeColor(connection.type) }}
                              >
                                {connection.type}
                              </Badge>
                              <span className="text-xs text-slate-500">{connection.trigger}</span>
                            </div>
                          </div>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}