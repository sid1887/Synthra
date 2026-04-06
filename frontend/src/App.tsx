import { useState } from 'react';
import './index.css';
import ImageUpload from './components/ImageUpload';
import AnalysisResults from './components/AnalysisResults';
import { AnalysisResponse } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<'upload' | 'results'>('upload');
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [preview, setPreview] = useState<string>('');

  const handleAnalyze = async (file: File) => {
    setPreview(URL.createObjectURL(file));
    setCurrentView('results');
  };

  const handleReset = () => {
    setResult(null);
    setPreview('');
    setCurrentView('upload');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-blue-600">🔬 Synthra</h1>
          <p className="text-gray-600">Circuit Analysis & Simulation</p>
          {currentView === 'results' && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              ↻ New Analysis
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <ImageUpload onAnalyze={handleAnalyze} />
          </div>
        )}

        {currentView === 'results' && result && preview && (
          <AnalysisResults result={result} preview={preview} />
        )}

        {currentView === 'results' && !result && preview && (
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="inline-block mb-4">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-lg text-gray-700">Analyzing circuit...</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-sm text-gray-500">
          <p>Synthra v1.0 | Circuit analysis backend focused</p>
        </div>
      </footer>
    </div>
  );
}
