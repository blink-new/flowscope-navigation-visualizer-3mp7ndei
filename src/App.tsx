import { useState } from 'react'
import { Toaster } from '@/components/ui/toaster'
import Dashboard from '@/components/Dashboard'
import PageFlowVisualizer from '@/components/PageFlowVisualizer'
import { FlowAnalysisResult } from '@/types/analysis'

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'visualizer'>('dashboard')
  const [analysisResult, setAnalysisResult] = useState<FlowAnalysisResult | null>(null)

  const handleAnalysisComplete = (result: FlowAnalysisResult) => {
    setAnalysisResult(result)
    setCurrentView('visualizer')
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
    setAnalysisResult(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {currentView === 'dashboard' ? (
        <Dashboard onAnalysisComplete={handleAnalysisComplete} />
      ) : (
        <PageFlowVisualizer 
          analysisResult={analysisResult!} 
          onBack={handleBackToDashboard}
        />
      )}
      <Toaster />
    </div>
  )
}

export default App