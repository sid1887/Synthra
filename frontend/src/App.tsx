import { useState } from 'react';
import { analyzeImage } from './api';
import { AnalysisResponse } from './types';
import './index.css';
import LandingPage from './components/LandingPage';
import ImageUpload from './components/ImageUpload';
import AnalysisResults from './components/AnalysisResults';
import HistoryPanel from './components/HistoryPanel';

type AppView = 'landing' | 'upload' | 'results' | 'history' | 'schematic' | 'simulation' | 'components' | 'overview' | 'camera';
type AppState = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [state, setState] = useState<AppState>('idle');
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [preview, setPreview] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);

  const handleNavigate = (section: string) => {
    setCurrentView(section as AppView);
    // Scroll to section if it exists
    setTimeout(() => {
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleAnalyze = async (file: File) => {
    setError('');
    setPreview(URL.createObjectURL(file));
    setState('uploading');

    try {
      setState('analyzing');
      const response = await analyzeImage(file);
      setResult(response);
      setState('done');
      setCurrentView('results');
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
      setState('error');
    }
  };

  const handleReset = () => {
    setResult(null);
    setError('');
    setPreview('');
    setState('idle');
    setCurrentView('upload');
  };

  const handleLoadFromHistory = async (id: string) => {
    try {
      setState('analyzing');
      const response = await fetch(`/api/results/${id}`);
      if (!response.ok) throw new Error('Failed to load analysis');
      const data = await response.json();
      setResult(data);
      setPreview('');
      setState('done');
      setShowHistory(false);
      setCurrentView('results');
    } catch (err: any) {
      setError(err.message);
      setState('error');
    }
  };

  return (
    <>
      {/* Landing Page Entry Point */}
      {currentView === 'landing' && (
        <LandingPage onNavigate={handleNavigate} />
      )}

      {/* Workspace Views */}
      {currentView !== 'landing' && (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          {/* Navigation Header */}
          <header className="bg-white shadow sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
              <button
                onClick={() => setCurrentView('landing')}
                className="text-2xl font-bold text-synthra-700 hover:opacity-80 transition"
              >
                ← Synthra
              </button>
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentView('overview')}
                  className="px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                >
                  Overview
                </button>
                <button
                  onClick={() => setCurrentView('history')}
                  className="px-4 py-2 bg-synthra-600 text-white rounded-lg hover:bg-synthra-700 transition"
                >
                  📋 History
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {currentView === 'upload' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <ImageUpload
                    onAnalyze={handleAnalyze}
                    loading={state === 'uploading' || state === 'analyzing'}
                    error={error}
                  />
                </div>
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold mb-4">Quick Start</h2>
                    <ol className="space-y-2 text-sm text-gray-600">
                      <li>1. Upload a circuit image</li>
                      <li>2. We'll detect components</li>
                      <li>3. View analysis details</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'results' && state === 'done' && result && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <AnalysisResults result={result} preview={preview} />
                  <button
                    onClick={handleReset}
                    className="mt-6 w-full px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Analyze Another Circuit
                  </button>
                </div>
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="font-bold mb-4">Analysis Actions</h2>
                    <div className="space-y-2">
                      <button className="w-full px-3 py-2 text-sm bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100">
                        View Schematic
                      </button>
                      <button className="w-full px-3 py-2 text-sm bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100">
                        Simulate
                      </button>
                      <button className="w-full px-3 py-2 text-sm bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100">
                        Export Results
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'history' && (
              <div className="max-w-2xl">
                <HistoryPanel onSelectAnalysis={handleLoadFromHistory} />
              </div>
            )}

            {currentView === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-bold mb-4">Circuit Detection</h2>
                  <p className="text-gray-600 text-sm">AI-powered component detection</p>
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-bold mb-4">Analysis</h2>
                  <p className="text-gray-600 text-sm">Detailed circuit analysis</p>
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-bold mb-4">Simulation</h2>
                  <p className="text-gray-600 text-sm">Circuit behavior simulation</p>
                </div>
              </div>
            )}

            {state === 'analyzing' && (
              <div className="flex justify-center items-center py-20">
                <div className="text-center">
                  <div className="inline-block mb-4">
                    <div className="loading-spinner"></div>
                  </div>
                  <p className="text-lg text-gray-700">Analyzing circuit...</p>
                </div>
              </div>
            )}

            {state === 'error' && error && (
              <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
                <h2 className="font-bold text-red-800 mb-2">Analysis Error</h2>
                <p className="text-red-700 text-sm mb-4">{error}</p>
                <button
                  onClick={handleReset}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Try Again
                </button>
              </div>
            )}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-sm text-gray-500">
              <p>Synthra v1.0 | Circuit analysis for learners and engineers</p>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}
