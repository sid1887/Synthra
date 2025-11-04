import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface EditorProps {}

const Editor: React.FC<EditorProps> = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const fetchResult = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/result/${jobId}`);
        setResult(response.data.result);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load results');
        setLoading(false);
      }
    };

    fetchResult();
  }, [jobId]);

  if (loading) {
    return (
      <div className="container loading">
        <div className="spinner"></div>
        <p>Loading circuit...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>❌ Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Circuit Editor</h2>
      
      <div className="editor-container">
        <div className="canvas-panel">
          <h3>Schematic Canvas</h3>
          <p style={{ color: '#666' }}>Interactive schematic editor will appear here</p>
          
          {result && (
            <div style={{ marginTop: '1rem' }}>
              <p><strong>Detected Components:</strong> {result.components?.length || 0}</p>
              <p><strong>Confidence:</strong> {(result.overall_confidence * 100).toFixed(1)}%</p>
            </div>
          )}
        </div>
        
        <div className="sidebar">
          <h3>Controls</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <button className="btn" style={{ width: '100%', marginBottom: '0.5rem' }}>
              ⚙️ Generate Netlist
            </button>
            <button className="btn" style={{ width: '100%', marginBottom: '0.5rem' }}>
              📊 Simulate
            </button>
            <button className="btn" style={{ width: '100%' }}>
              📜 Export PDF
            </button>
          </div>
          
          <div>
            <h4>Components</h4>
            {result?.components?.map((comp: any, idx: number) => (
              <div key={idx} style={{ 
                background: 'rgba(255, 255, 255, 0.1)', 
                padding: '0.5rem', 
                marginBottom: '0.5rem',
                borderRadius: '4px'
              }}>
                <strong>{comp.component_type}</strong>
                <br />
                <small>Confidence: {(comp.confidence * 100).toFixed(0)}%</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
