import { useState, useEffect } from 'react';
import { getHistory } from '../api';
import { History } from '../api';

interface HistoryPanelProps {
  onSelectAnalysis: (id: string) => void;
}

export default function HistoryPanel({ onSelectAnalysis }: HistoryPanelProps) {
  const [histories, setHistories] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getHistory();
      setHistories(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg shadow-lg p-6 border border-red-200">
        <h3 className="font-bold text-red-800 mb-2">Error</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (histories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-4xl mb-3">📦</div>
        <p className="text-gray-600">No analysis history yet</p>
        <p className="text-sm text-gray-500 mt-2">Upload and analyze your first circuit!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-synthra-600 text-white p-4 font-bold">Recent Analyses</div>
      <div className="divide-y max-h-96 overflow-y-auto">
        {histories.map((history) => (
          <button
            key={history.id}
            onClick={() => onSelectAnalysis(history.id)}
            className="w-full text-left p-4 hover:bg-gray-50 transition"
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1">
                <div className="font-bold text-sm text-gray-800">
                  {history.circuitLabel.replace(/_/g, ' ').toUpperCase()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(history.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="font-bold text-synthra-600">{history.componentCount}</div>
                <div className="text-gray-500">components</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="bg-gray-50 px-4 py-3 text-xs text-center text-gray-600 border-t">
        {histories.length} analyses saved
      </div>
    </div>
  );
}
