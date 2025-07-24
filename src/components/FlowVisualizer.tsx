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
  ExternalLink
} from 'lucide-react'
import { AnalysisResult, PageNode } from '@/types/analysis'

interface FlowVisualizerProps {
  analysisResult: AnalysisResult
  onBack: () => void
}

export default function FlowVisualizer({ analysisResult, onBack }: FlowVisualizerProps) {
  const [selectedNode, setSelectedNode] = useState<PageNode | null>(null)
  const [zoom, setZoom] = useState(1)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<PageNode[]>([])

  useEffect(() => {
    // Position nodes in a circular layout
    const positionedNodes = analysisResult.pages.map((page, index) => {
      const angle = (index / analysisResult.pages.length) * 2 * Math.PI
      const radius = Math.min(300, 50 + analysisResult.pages.length * 20)
      const x = 400 + radius * Math.cos(angle)
      const y = 300 + radius * Math.sin(angle)
      
      return {
        ...page,
        position: { x, y }
      }
    })
    setNodes(positionedNodes)
  }, [analysisResult])

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5))
  const handleResetZoom = () => setZoom(1)

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'page': return 'bg-blue-500'
      case 'component': return 'bg-green-500'
      case 'layout': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'page': return <FileText className="w-4 h-4" />
      case 'component': return <Component className="w-4 h-4" />
      case 'layout': return <Layout className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-80 border-r bg-white flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              {analysisResult.repoName}
            </h2>
            <p className="text-sm text-slate-600 mb-3">
              {analysisResult.pages.length} pages • {analysisResult.routes.length} routes
            </p>
            <a 
              href={analysisResult.repoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center"
            >
              View Repository <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>

        {/* Analysis Summary */}
        <div className="p-6 border-b">
          <h3 className="font-medium text-slate-900 mb-3">Analysis Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total Files</span>
              <span className="font-medium">{analysisResult.totalFiles}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Analyzed Files</span>
              <span className="font-medium">{analysisResult.analyzedFiles}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Pages Found</span>
              <span className="font-medium">{analysisResult.pages.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Routes Found</span>
              <span className="font-medium">{analysisResult.routes.length}</span>
            </div>
          </div>
        </div>

        {/* Pages List */}
        <div className="flex-1 overflow-hidden">
          <div className="p-6 pb-4">
            <h3 className="font-medium text-slate-900 mb-3">Pages & Components</h3>
          </div>
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-2 pb-6">
              {nodes.map((node) => (
                <Card 
                  key={node.id}
                  className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                    selectedNode?.id === node.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedNode(node)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 ${getNodeColor(node.type)} rounded-lg flex items-center justify-center text-white`}>
                        {getNodeIcon(node.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">
                          {node.name}
                        </p>
                        <p className="text-xs text-slate-600 truncate">
                          {node.path}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {node.type}
                      </Badge>
                    </div>
                    {node.connections.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-slate-600">
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
        <div className="p-4 border-b bg-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Route className="w-5 h-5 text-primary" />
            <h3 className="font-medium text-slate-900">Navigation Flow</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-600 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetZoom}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-slate-50 overflow-hidden relative">
          <div 
            ref={canvasRef}
            className="w-full h-full relative"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {/* Draw connections */}
              {nodes.map((node) => 
                node.connections.map((connectionId) => {
                  const targetNode = nodes.find(n => n.id === connectionId)
                  if (!targetNode || !node.position || !targetNode.position) return null
                  
                  return (
                    <line
                      key={`${node.id}-${connectionId}`}
                      x1={node.position.x + 40}
                      y1={node.position.y + 40}
                      x2={targetNode.position.x + 40}
                      y2={targetNode.position.y + 40}
                      stroke="#e2e8f0"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                  )
                })
              )}
              
              {/* Arrow marker */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#e2e8f0"
                  />
                </marker>
              </defs>
            </svg>

            {/* Draw nodes */}
            {nodes.map((node) => (
              <div
                key={node.id}
                className={`absolute w-20 h-20 rounded-xl border-2 cursor-pointer transition-all hover:scale-110 ${
                  selectedNode?.id === node.id 
                    ? 'border-primary shadow-lg scale-110' 
                    : 'border-slate-200 hover:border-slate-300'
                } ${getNodeColor(node.type)} text-white flex flex-col items-center justify-center`}
                style={{
                  left: node.position?.x || 0,
                  top: node.position?.y || 0,
                }}
                onClick={() => setSelectedNode(node)}
              >
                {getNodeIcon(node.type)}
                <span className="text-xs font-medium mt-1 text-center leading-tight px-1">
                  {node.name.length > 8 ? node.name.substring(0, 8) + '...' : node.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="border-t bg-white p-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <div className={`w-6 h-6 ${getNodeColor(selectedNode.type)} rounded-md flex items-center justify-center text-white`}>
                    {getNodeIcon(selectedNode.type)}
                  </div>
                  <span>{selectedNode.name}</span>
                  <Badge variant="secondary">{selectedNode.type}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">Path</p>
                  <p className="text-sm text-slate-600 font-mono">{selectedNode.path}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">File Path</p>
                  <p className="text-sm text-slate-600 font-mono">{selectedNode.filePath}</p>
                </div>
                {selectedNode.connections.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-900 mb-2">
                      Connections ({selectedNode.connections.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.connections.map((connectionId) => {
                        const connectedNode = nodes.find(n => n.id === connectionId)
                        return connectedNode ? (
                          <Badge 
                            key={connectionId} 
                            variant="outline" 
                            className="cursor-pointer hover:bg-slate-100"
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