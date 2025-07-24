import { useState, useEffect, useRef } from 'react'
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
  Component,
  Layout,
  ExternalLink,
  Eye,
  Code,
  GitBranch,
  Clock
} from 'lucide-react'
import { AnalysisResult, PageNode } from '@/types/analysis'

interface FlowVisualizerProps {
  analysisResult: AnalysisResult
  onBack: () => void
}

export default function FlowVisualizer({ analysisResult, onBack }: FlowVisualizerProps) {
  const [selectedNode, setSelectedNode] = useState<PageNode | null>(null)
  const [zoom, setZoom] = useState(0.8)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<PageNode[]>([])

  useEffect(() => {
    // Create a more sophisticated layout algorithm
    const positionedNodes = analysisResult.pages.map((page, index) => {
      // Create a hierarchical flow layout
      const cols = Math.ceil(Math.sqrt(analysisResult.pages.length))
      const rows = Math.ceil(analysisResult.pages.length / cols)
      
      const col = index % cols
      const row = Math.floor(index / cols)
      
      const x = 100 + col * 320 // Increased spacing for cards
      const y = 100 + row * 280 // Increased spacing for cards
      
      return {
        ...page,
        position: { x, y }
      }
    })
    setNodes(positionedNodes)
  }, [analysisResult])

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.3))
  const handleResetZoom = () => setZoom(0.8)

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'page': return 'from-blue-500 to-blue-600'
      case 'component': return 'from-green-500 to-green-600'
      case 'layout': return 'from-purple-500 to-purple-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'page': return <FileText className="w-5 h-5" />
      case 'component': return <Component className="w-5 h-5" />
      case 'layout': return <Layout className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  const getStatusBadge = (node: PageNode) => {
    if (node.connections.length > 0) {
      return <Badge className="bg-green-100 text-green-800 text-xs">CONNECTED</Badge>
    }
    return <Badge className="bg-orange-100 text-orange-800 text-xs">ORPHAN</Badge>
  }

  const getComplexityColor = (complexity: 'low' | 'medium' | 'high') => {
    switch (complexity) {
      case 'low': return 'text-green-600 bg-green-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'high': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
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
            <Button variant="outline" size="sm" className="hover:bg-slate-50">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
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
            Analysis Summary
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analysisResult.totalFiles}</div>
              <div className="text-xs text-blue-600 font-medium">Total Files</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analysisResult.analyzedFiles}</div>
              <div className="text-xs text-green-600 font-medium">Analyzed</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{analysisResult.pages.length}</div>
              <div className="text-xs text-purple-600 font-medium">Pages</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{analysisResult.routes.length}</div>
              <div className="text-xs text-orange-600 font-medium">Routes</div>
            </div>
          </div>
        </div>

        {/* Pages List */}
        <div className="flex-1 overflow-hidden">
          <div className="p-6 pb-4">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
              <Code className="w-4 h-4 mr-2" />
              Components
            </h3>
          </div>
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-3 pb-6">
              {nodes.map((node) => (
                <Card 
                  key={node.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] border-l-4 ${
                    selectedNode?.id === node.id 
                      ? 'ring-2 ring-primary shadow-lg scale-[1.02] border-l-primary' 
                      : node.type === 'page' 
                        ? 'border-l-blue-500' 
                        : node.type === 'layout' 
                          ? 'border-l-purple-500' 
                          : 'border-l-green-500'
                  }`}
                  onClick={() => setSelectedNode(node)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${getNodeColor(node.type)} rounded-xl flex items-center justify-center text-white shadow-sm`}>
                        {getNodeIcon(node.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm text-slate-900 truncate">
                            {node.name}
                          </p>
                          {getStatusBadge(node)}
                        </div>
                        <p className="text-xs text-slate-600 truncate font-mono">
                          {node.path}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-1">
                          {node.filePath}
                        </p>
                      </div>
                    </div>
                    {node.connections.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-600 flex items-center">
                          <GitBranch className="w-3 h-3 mr-1" />
                          {node.connections.length} connection{node.connections.length !== 1 ? 's' : ''}
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
              <h3 className="font-semibold text-slate-900">Navigation Flow</h3>
              <p className="text-xs text-slate-600 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Last analyzed: {new Date(analysisResult.timestamp).toLocaleTimeString()}
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
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 overflow-auto relative">
          <div 
            ref={canvasRef}
            className="relative min-w-full min-h-full"
            style={{ 
              transform: `scale(${zoom})`, 
              transformOrigin: 'top left',
              width: `${100 / zoom}%`,
              height: `${100 / zoom}%`
            }}
          >
            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              {nodes.map((node) => 
                node.connections.map((connectionId) => {
                  const targetNode = nodes.find(n => n.id === connectionId)
                  if (!targetNode || !node.position || !targetNode.position) return null
                  
                  const startX = node.position.x + 140 // Center of card
                  const startY = node.position.y + 120
                  const endX = targetNode.position.x + 140
                  const endY = targetNode.position.y + 120
                  
                  // Create curved dotted line
                  const midX = (startX + endX) / 2
                  const midY = (startY + endY) / 2 - 50 // Curve upward
                  
                  return (
                    <g key={`${node.id}-${connectionId}`}>
                      <path
                        d={`M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`}
                        stroke="#6366f1"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray="8,4"
                        markerEnd="url(#arrowhead)"
                        className="drop-shadow-sm"
                      />
                    </g>
                  )
                })
              )}
              
              {/* Arrow marker */}
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
            {nodes.map((node) => {
              const preview = node.preview || {
                title: node.name,
                description: `${node.type} component`,
                elements: ['JSX Return', 'Component Logic'],
                hasState: false,
                hasProps: false,
                complexity: 'low' as const
              }
              
              return (
                <div
                  key={node.id}
                  className={`absolute transition-all duration-300 hover:scale-105 ${
                    selectedNode?.id === node.id ? 'scale-105 z-10' : 'z-0'
                  }`}
                  style={{
                    left: node.position?.x || 0,
                    top: node.position?.y || 0,
                    zIndex: selectedNode?.id === node.id ? 10 : 2
                  }}
                >
                  <Card 
                    className={`w-72 h-56 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${
                      selectedNode?.id === node.id 
                        ? 'border-primary shadow-2xl' 
                        : 'border-slate-200 hover:border-slate-300'
                    } bg-white/95 backdrop-blur-sm`}
                    onClick={() => setSelectedNode(node)}
                  >
                    {/* Card Header */}
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-8 h-8 bg-gradient-to-br ${getNodeColor(node.type)} rounded-lg flex items-center justify-center text-white shadow-sm`}>
                            {getNodeIcon(node.type)}
                          </div>
                          <div>
                            <CardTitle className="text-sm font-semibold text-slate-900">
                              {preview.title}
                            </CardTitle>
                            <p className="text-xs text-slate-600 font-mono">{node.path}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {getStatusBadge(node)}
                          <Badge className={`text-xs ${getComplexityColor(preview.complexity)}`}>
                            {preview.complexity.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Card Content - Real Preview */}
                    <CardContent className="pt-0">
                      <div className="bg-slate-50 rounded-lg p-3 mb-3 border">
                        <div className="text-xs text-slate-600 mb-2">{preview.description}</div>
                        <div className="space-y-1">
                          {preview.elements.map((element, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                element.includes('State') ? 'bg-blue-400' :
                                element.includes('Props') ? 'bg-green-400' :
                                element.includes('API') ? 'bg-red-400' :
                                element.includes('Navigation') ? 'bg-purple-400' :
                                'bg-slate-300'
                              }`}></div>
                              <span className="text-xs text-slate-700">{element}</span>
                            </div>
                          ))}
                        </div>
                        
                        {/* Feature indicators */}
                        <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-slate-200">
                          {preview.hasState && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600">
                              State
                            </Badge>
                          )}
                          {preview.hasProps && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-600">
                              Props
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Route Info */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-mono truncate">
                          {node.filePath.split('/').pop()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {node.type}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="border-t bg-white/90 backdrop-blur-sm p-4 shadow-lg">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-3">
                  <div className={`w-8 h-8 bg-gradient-to-br ${getNodeColor(selectedNode.type)} rounded-xl flex items-center justify-center text-white shadow-sm`}>
                    {getNodeIcon(selectedNode.type)}
                  </div>
                  <div>
                    <span className="text-slate-900">{selectedNode.name}</span>
                    <Badge variant="secondary" className="ml-2">{selectedNode.type}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">Route Path</p>
                    <p className="text-sm text-slate-600 font-mono bg-slate-50 px-2 py-1 rounded">{selectedNode.path}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">File Location</p>
                    <p className="text-sm text-slate-600 font-mono bg-slate-50 px-2 py-1 rounded truncate">{selectedNode.filePath}</p>
                  </div>
                </div>
                {selectedNode.connections.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-2 flex items-center">
                      <GitBranch className="w-4 h-4 mr-1" />
                      Connected Pages ({selectedNode.connections.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.connections.map((connectionId) => {
                        const connectedNode = nodes.find(n => n.id === connectionId)
                        return connectedNode ? (
                          <Badge 
                            key={connectionId} 
                            variant="outline" 
                            className="cursor-pointer hover:bg-primary hover:text-white transition-colors"
                            onClick={() => setSelectedNode(connectedNode)}
                          >
                            {connectedNode.name}
                          </Badge>
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