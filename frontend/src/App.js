import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { analyzeImage } from './api';
import './index.css';
import ImageUpload from './components/ImageUpload';
import AnalysisResults from './components/AnalysisResults';
import HistoryPanel from './components/HistoryPanel';
export default function App() {
    const [state, setState] = useState('idle');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const handleAnalyze = async (file) => {
        setError('');
        setPreview(URL.createObjectURL(file));
        setState('uploading');
        try {
            setState('analyzing');
            const response = await analyzeImage(file);
            setResult(response);
            setState('done');
        }
        catch (err) {
            setError(err.message || 'Analysis failed');
            setState('error');
        }
    };
    const handleReset = () => {
        setResult(null);
        setError('');
        setPreview('');
        setState('idle');
    };
    const handleLoadFromHistory = async (id) => {
        try {
            setState('analyzing');
            const response = await fetch(`/api/results/${id}`);
            if (!response.ok)
                throw new Error('Failed to load analysis');
            const data = await response.json();
            setResult(data);
            setPreview(data.image.previewUrl || '');
            setState('done');
            setShowHistory(false);
        }
        catch (err) {
            setError(err.message);
            setState('error');
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100", children: [_jsx("header", { className: "bg-white shadow", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-synthra-700", children: "Synthra" }), _jsx("p", { className: "text-sm text-gray-500", children: "Circuit Photo Analysis Platform" })] }), _jsx("button", { onClick: () => setShowHistory(!showHistory), className: "px-4 py-2 bg-synthra-600 text-white rounded-lg hover:bg-synthra-700 transition", children: "\uD83D\uDCCB History" })] }) }), _jsx("main", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsx("div", { className: "lg:col-span-2", children: state === 'idle' || state === 'error' ? (_jsx(ImageUpload, { onAnalyze: handleAnalyze, loading: false, error: error })) : state === 'analyzing' ? (_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-12 text-center", children: [_jsx("div", { className: "flex justify-center mb-4", children: _jsx("div", { className: "loading-spinner" }) }), _jsx("p", { className: "text-lg text-gray-700", children: "Analyzing circuit..." })] })) : state === 'done' && result ? (_jsxs(_Fragment, { children: [_jsx(AnalysisResults, { result: result, preview: preview }), _jsx("button", { onClick: handleReset, className: "mt-4 w-full px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition", children: "Analyze Another Circuit" })] })) : null }), _jsx("div", { className: "lg:col-span-1", children: showHistory ? (_jsx(HistoryPanel, { onSelectAnalysis: handleLoadFromHistory })) : (_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h2", { className: "text-xl font-bold mb-4 text-gray-800", children: "How It Works" }), _jsxs("ol", { className: "space-y-3 text-sm text-gray-600", children: [_jsxs("li", { className: "flex gap-3", children: [_jsx("span", { className: "font-bold text-synthra-600", children: "1." }), _jsx("span", { children: "Upload or capture a circuit photo" })] }), _jsxs("li", { className: "flex gap-3", children: [_jsx("span", { className: "font-bold text-synthra-600", children: "2." }), _jsx("span", { children: "We detect components and identify the circuit type" })] }), _jsxs("li", { className: "flex gap-3", children: [_jsx("span", { className: "font-bold text-synthra-600", children: "3." }), _jsx("span", { children: "Get explanations, warnings, and suggestions" })] }), _jsxs("li", { className: "flex gap-3", children: [_jsx("span", { className: "font-bold text-synthra-600", children: "4." }), _jsx("span", { children: "View circuit reconstruction and simulation results" })] })] }), _jsxs("div", { className: "mt-6 pt-6 border-t", children: [_jsx("h3", { className: "font-bold text-gray-800 mb-2", children: "Supported Circuits" }), _jsxs("ul", { className: "text-xs text-gray-600 space-y-1", children: [_jsx("li", { children: "\u2713 LED circuits" }), _jsx("li", { children: "\u2713 Voltage dividers" }), _jsx("li", { children: "\u2713 Transistor switches" }), _jsx("li", { children: "\u2713 RC filters" }), _jsx("li", { children: "\u2713 Protection circuits" })] })] })] })) })] }) }), _jsx("footer", { className: "bg-white border-t mt-12", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-sm text-gray-500", children: _jsx("p", { children: "Synthra v1.0 | Circuit analysis for learners and engineers" }) }) })] }));
}
