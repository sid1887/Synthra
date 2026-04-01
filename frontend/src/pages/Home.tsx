import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, Zap, Box, FileText, ArrowRight } from 'lucide-react';
import { visionService } from '../utils/apiClient';
import { useToast } from '../hooks/useToast';

const Home: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const toast = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      toast.error('File size must be less than 10MB');
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PNG, JPG, or PDF file');
      toast.error('Please upload a PNG, JPG, or PDF file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await visionService.detectComponents(file);
      const { components, wireSegments } = response.data;

      // Save to local storage and navigate to editor
      localStorage.setItem('detectedComponents', JSON.stringify(components));
      localStorage.setItem('detectedWires', JSON.stringify(wireSegments));

      toast.success('Image uploaded and processed successfully!');
      navigate('/editor');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Upload failed. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const fakeEvent = {
        target: { files: [files[0]] }
      } as any;
      handleFileUpload(fakeEvent);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <header style={{
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '20px'
          }}>
            ⚡
          </div>
          <span style={{ fontSize: '24px', fontWeight: 'bold' }}>Synthra</span>
        </div>
        {/* Studio button removed - admin only at /admin/sve */}
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 40px',
        overflowY: 'auto'
      }}>
        <div style={{ maxWidth: '900px', width: '100%' }}>
          {/* Hero Section */}
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h1 style={{
              fontSize: '56px',
              fontWeight: 700,
              marginBottom: '20px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              AI-Powered Circuit Design
            </h1>
            <p style={{
              fontSize: '18px',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: '1.6',
              maxWidth: '600px',
              margin: '0 auto 40px'
            }}>
              Transform schematic images into editable circuits, simulations, and professional documentation with AI
            </p>
          </div>

          {/* Upload Zone */}
          <div
            onClick={() => !uploading && document.getElementById('file-input')?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              border: '2px dashed rgba(6, 182, 212, 0.3)',
              borderRadius: '12px',
              padding: '60px 40px',
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(10px)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              marginBottom: '40px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.8)';
              e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
              e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)';
            }}
          >
            {uploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  border: '3px solid rgba(6, 182, 212, 0.3)',
                  borderTop: '3px solid #06b6d4',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <p style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Processing your schematic...
                </p>
              </div>
            ) : (
              <>
                <Upload size={48} style={{
                  margin: '0 auto 20px',
                  color: '#06b6d4'
                }} />
                <h3 style={{
                  fontSize: '24px',
                  marginBottom: '10px',
                  color: '#fff',
                  fontWeight: '600'
                }}>
                  Click or drag to upload
                </h3>
                <p style={{
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: '30px',
                  fontSize: '14px'
                }}>
                  Supported formats: PNG, JPG, PDF (max 10MB)
                </p>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    padding: '6px 14px',
                    background: 'rgba(6, 182, 212, 0.2)',
                    borderRadius: '20px',
                    color: '#06b6d4',
                    fontSize: '12px'
                  }}>
                    Hand-drawn schematics
                  </span>
                  <span style={{
                    padding: '6px 14px',
                    background: 'rgba(6, 182, 212, 0.2)',
                    borderRadius: '20px',
                    color: '#06b6d4',
                    fontSize: '12px'
                  }}>
                    Scanned diagrams
                  </span>
                  <span style={{
                    padding: '6px 14px',
                    background: 'rgba(6, 182, 212, 0.2)',
                    borderRadius: '20px',
                    color: '#06b6d4',
                    fontSize: '12px'
                  }}>
                    Digital exports
                  </span>
                </div>
              </>
            )}
          </div>

          <input
            id="file-input"
            type="file"
            accept="image/png,image/jpeg,image/jpg,application/pdf"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '20px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#fca5a5',
              marginBottom: '30px'
            }}>
              {error}
            </div>
          )}

          {/* Features Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '40px'
          }}>
            {[
              { icon: '🔍', title: 'Image Recognition', desc: 'AI detects components and connections' },
              { icon: '⚡', title: 'Auto Synthesis', desc: 'Generate Verilog and SPICE code' },
              { icon: '📊', title: 'Simulation', desc: 'Run circuit analysis and waveforms' },
              { icon: '📄', title: 'Documentation', desc: 'Export professional reports' }
            ].map((feature, i) => (
              <div key={i} style={{
                padding: '25px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                borderRadius: '10px',
                transition: 'all 0.3s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                e.currentTarget.style.transform = 'translateY(-5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>{feature.icon}</div>
                <h4 style={{ color: '#fff', marginBottom: '8px', fontSize: '16px', fontWeight: '600' }}>
                  {feature.title}
                </h4>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => document.getElementById('file-input')?.click()}
              style={{
                padding: '14px 30px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(6, 182, 212, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Upload size={18} /> Upload Schematic
            </button>
            <Link to="/editor" style={{
              padding: '14px 30px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(6, 182, 212, 0.5)',
              borderRadius: '8px',
              color: '#06b6d4',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <FileText size={18} /> Create New Circuit
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '20px 40px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.5)',
        fontSize: '13px'
      }}>
        © 2025 Synthra - AI-Powered Circuit Design Platform
      </footer>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Home;
