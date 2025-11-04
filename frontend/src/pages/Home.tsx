import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Home: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/api/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { job_id } = response.data;
      navigate(`/editor/${job_id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed');
      setUploading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2>Upload Your Schematic</h2>
        <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
          Drop a circuit image and watch AI bring it to life
        </p>
      </div>

      <div className="upload-zone" onClick={() => document.getElementById('file-input')?.click()}>
        {uploading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Processing image...</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📤</div>
            <h3>Click or drag to upload</h3>
            <p>Supported: PNG, JPG, PDF (scanned schematics)</p>
            <input
              id="file-input"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
            />
          </>
        )}
      </div>

      {error && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: 'rgba(255, 0, 0, 0.2)', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          ❌ {error}
        </div>
      )}

      <div style={{ marginTop: '4rem', textAlign: 'center' }}>
        <h3>How It Works</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '2rem',
          marginTop: '2rem'
        }}>
          <div>
            <div style={{ fontSize: '3rem' }}>🔍</div>
            <h4>1. Detect</h4>
            <p>AI recognizes components and wires</p>
          </div>
          <div>
            <div style={{ fontSize: '3rem' }}>⚙️</div>
            <h4>2. Generate</h4>
            <p>Auto-create netlist and Verilog</p>
          </div>
          <div>
            <div style={{ fontSize: '3rem' }}>📊</div>
            <h4>3. Simulate</h4>
            <p>Run SPICE or HDL simulation</p>
          </div>
          <div>
            <div style={{ fontSize: '3rem' }}>📜</div>
            <h4>4. Document</h4>
            <p>Export beautiful PDF reports</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
