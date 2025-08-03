import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { GitBranch, Upload, Zap, Eye, ArrowRight, Github } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { FlowAnalysisResult } from '@/types/analysis'
import { analyzeGitHubRepo } from '@/lib/github-analyzer'

interface DashboardProps {
  onAnalysisComplete: (result: FlowAnalysisResult) => void
}

export default function Dashboard({ onAnalysisComplete }: DashboardProps) {
  const [repoUrl, setRepoUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState('')
  const { toast } = useToast()

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) {
      toast({
        title: "Repository URL required",
        description: "Please enter a valid GitHub repository URL",
        variant: "destructive"
      })
      return
    }

    setIsAnalyzing(true)
    setAnalysisStep('Validating repository URL...')
    
    try {
      // Add progress updates
      setAnalysisStep('Fetching repository contents...')
      await new Promise(resolve => setTimeout(resolve, 500)) // Brief delay for UX
      
      setAnalysisStep('Analyzing React components...')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setAnalysisStep('Detecting routing patterns...')
      const result = await analyzeGitHubRepo(repoUrl)
      
      setAnalysisStep('Building navigation graph...')
      await new Promise(resolve => setTimeout(resolve, 300))
      
      onAnalysisComplete(result)
      
      // Check if this is demo data due to API limitations
      const isDemo = result.pages.some(page => 
        page.preview?.description?.includes('Demo data') || 
        page.preview?.description?.includes('API unavailable')
      )
      
      if (isDemo) {
        toast({
          title: "Demo visualization ready!",
          description: `Showing sample flow with ${result.pages.length} pages. GitHub API was unavailable.`,
          variant: "default"
        })
      } else {
        toast({
          title: "Analysis complete!",
          description: `Found ${result.pages.length} pages and ${result.routes.length} routes`
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze repository"
      
      // If error contains demo data, still proceed to show visualization
      if (errorMessage.includes('Showing demo visualization')) {
        try {
          // Try to get demo data from the error context
          const result = await analyzeGitHubRepo(repoUrl)
          onAnalysisComplete(result)
          toast({
            title: "Demo visualization loaded",
            description: "GitHub API unavailable. Showing sample navigation flow.",
            variant: "default"
          })
        } catch (demoError) {
          toast({
            title: "Analysis failed",
            description: errorMessage,
            variant: "destructive"
          })
        }
      } else {
        toast({
          title: "Analysis failed",
          description: errorMessage,
          variant: "destructive"
        })
      }
    } finally {
      setIsAnalyzing(false)
      setAnalysisStep('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnalyze()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Flowscope</h1>
                <p className="text-sm text-slate-600">Navigation Flow Visualizer</p>
              </div>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">
              v1.0.0-beta
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Visualize Your React App's Navigation Flow
            </h2>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Analyze AI-generated codebases and understand how pages connect. 
              Perfect for debugging routing logic and onboarding new developers.
            </p>
          </div>

          {/* Upload Section */}
          <Card className="mb-8 border-2 border-dashed border-slate-200 hover:border-primary/50 transition-colors">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center space-x-2">
                <Github className="w-5 h-5" />
                <span>Analyze GitHub Repository</span>
              </CardTitle>
              <CardDescription>
                Enter a GitHub repository URL to analyze its navigation structure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="https://github.com/username/repository"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  disabled={isAnalyzing}
                />
                <Button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !repoUrl.trim()}
                  className="px-6"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>
              
              {isAnalyzing && analysisStep && (
                <div className="text-sm text-primary text-center font-medium">
                  {analysisStep}
                </div>
              )}
              
              <div className="text-sm text-slate-500 text-center space-y-1">
                <div>Supports React, Next.js, and other React-based frameworks</div>
                <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  💡 If GitHub API is unavailable, a demo visualization will be shown
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <GitBranch className="w-5 h-5 text-primary" />
                  <span>Route Detection</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Automatically detects React Router, Next.js routing, and custom navigation patterns
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Eye className="w-5 h-5 text-primary" />
                  <span>Visual Mapping</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Interactive node-based diagrams showing how pages and components connect
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Upload className="w-5 h-5 text-primary" />
                  <span>Export Ready</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Export flow diagrams as PNG or SVG for documentation and team sharing
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started */}
          <Card className="bg-slate-50 border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Getting Started</CardTitle>
              <CardDescription>
                Follow these steps to analyze your first repository
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Enter Repository URL</p>
                  <p className="text-sm text-slate-600">Paste the GitHub URL of your React project</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Automatic Analysis</p>
                  <p className="text-sm text-slate-600">Our analyzer will scan your codebase for routing patterns</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Explore Flow Diagram</p>
                  <p className="text-sm text-slate-600">Navigate the interactive visualization of your app's structure</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}