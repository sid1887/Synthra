import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { getHistory } from '../api';
export default function HistoryPanel({ onSelectAnalysis }) {
    const [histories, setHistories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        loadHistory();
    }, []);
    const loadHistory = async () => {
        try {
            setLoading(true);
            const data = await getHistory();
            setHistories(data);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "bg-white rounded-lg shadow-lg p-6", children: _jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "loading-spinner mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading history..." })] }) }));
    }
    if (error) {
        return (_jsxs("div", { className: "bg-red-50 rounded-lg shadow-lg p-6 border border-red-200", children: [_jsx("h3", { className: "font-bold text-red-800 mb-2", children: "Error" }), _jsx("p", { className: "text-red-700", children: error })] }));
    }
    if (histories.length === 0) {
        return (_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6 text-center", children: [_jsx("div", { className: "text-4xl mb-3", children: "\uD83D\uDCE6" }), _jsx("p", { className: "text-gray-600", children: "No analysis history yet" }), _jsx("p", { className: "text-sm text-gray-500 mt-2", children: "Upload and analyze your first circuit!" })] }));
    }
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-lg overflow-hidden", children: [_jsx("div", { className: "bg-synthra-600 text-white p-4 font-bold", children: "Recent Analyses" }), _jsx("div", { className: "divide-y max-h-96 overflow-y-auto", children: histories.map((history) => (_jsx("button", { onClick: () => onSelectAnalysis(history.id), className: "w-full text-left p-4 hover:bg-gray-50 transition", children: _jsxs("div", { className: "flex justify-between items-start gap-3", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-bold text-sm text-gray-800", children: history.circuitLabel.replace(/_/g, ' ').toUpperCase() }), _jsx("div", { className: "text-xs text-gray-500 mt-1", children: new Date(history.timestamp).toLocaleString() })] }), _jsxs("div", { className: "text-right text-xs", children: [_jsx("div", { className: "font-bold text-synthra-600", children: history.componentCount }), _jsx("div", { className: "text-gray-500", children: "components" })] })] }) }, history.id))) }), _jsxs("div", { className: "bg-gray-50 px-4 py-3 text-xs text-center text-gray-600 border-t", children: [histories.length, " analyses saved"] })] }));
}
