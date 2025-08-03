import { useState } from 'react'
import { Toaster } from '@/components/ui/toaster'
import Dashboard from '@/components/Dashboard'
import FlowVisualizer from '@/components/FlowVisualizer'
import { AnalysisResult } from '@/types/analysis'

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'visualizer'>('dashboard')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  const handleAnalysisComplete = (result: AnalysisResult) => {
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
        <FlowVisualizer 
          analysisResult={analysisResult!} 
          onBack={handleBackToDashboard}
        />
      )}
      <Toaster />
    </div>
  )
}

export default App