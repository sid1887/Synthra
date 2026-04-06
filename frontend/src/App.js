import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import './index.css';
import ImageUpload from './components/ImageUpload';
import AnalysisResults from './components/AnalysisResults';
export default function App() {
    const [currentView, setCurrentView] = useState('upload');
    const [result, setResult] = useState(null);
    const [preview, setPreview] = useState('');
    const handleAnalyze = async (file) => {
        setPreview(URL.createObjectURL(file));
        setCurrentView('results');
    };
    const handleReset = () => {
        setResult(null);
        setPreview('');
        setCurrentView('upload');
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("header", { className: "bg-white shadow sticky top-0 z-50", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center", children: [_jsx("h1", { className: "text-3xl font-bold text-blue-600", children: "\uD83D\uDD2C Synthra" }), _jsx("p", { className: "text-gray-600", children: "Circuit Analysis & Simulation" }), currentView === 'results' && (_jsx("button", { onClick: handleReset, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition", children: "\u21BB New Analysis" }))] }) }), _jsxs("main", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [currentView === 'upload' && (_jsx("div", { className: "max-w-2xl mx-auto", children: _jsx(ImageUpload, { onAnalyze: handleAnalyze }) })), currentView === 'results' && result && preview && (_jsx(AnalysisResults, { result: result, preview: preview })), currentView === 'results' && !result && preview && (_jsxs("div", { className: "max-w-2xl mx-auto text-center py-20", children: [_jsx("div", { className: "inline-block mb-4", children: _jsx("div", { className: "w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" }) }), _jsx("p", { className: "text-lg text-gray-700", children: "Analyzing circuit..." })] }))] }), _jsx("footer", { className: "bg-white border-t mt-12", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-sm text-gray-500", children: _jsx("p", { children: "Synthra v1.0 | Circuit analysis backend focused" }) }) })] }));
}
