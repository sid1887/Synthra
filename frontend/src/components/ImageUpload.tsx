import React, { useRef, useState } from 'react';
import { usePhaseCStore } from '../store/phaseC.store';

interface ImageUploadProps {
  onAnalyze?: (file: File) => void;
}

export default function ImageUpload({ onAnalyze }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useCamera, setUseCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // @ts-ignore
  const store = usePhaseCStore();

  const analyzeWithBackend = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('http://localhost:3000/api/circuit/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
      }

      const result = await response.json();

      // Store results in Zustand store
      if (result.components && result.connections) {
        // @ts-ignore
        store.addAnalysisResult({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          imageFile: file.name,
          components: result.components,
          connections: result.connections,
          confidence: result.confidence || 0.85,
          warnings: result.warnings || [],
        });
      }

      if (onAnalyze) onAnalyze(file);
    } catch (err) {
      setError(String(err));
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('image/')) {
      analyzeWithBackend(file);
    } else {
      setError('Please select a valid image file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    if (context) {
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          handleFileSelect(file);
          setUseCamera(false);
          // Stop camera stream
          if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
          }
        }
      });
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setUseCamera(true);
      }
    } catch (err) {
      alert('Could not access camera');
    }
  };

  if (useCamera) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Capture Circuit Photo</h2>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full rounded-lg mb-4"
          width={640}
          height={480}
        ></video>
        <canvas ref={canvasRef} className="hidden" width={640} height={480}></canvas>
        <div className="flex gap-3">
          <button
            onClick={handleCapture}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            📸 Capture Photo
          </button>
          <button
            onClick={() => {
              setUseCamera(false);
              if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
              }
            }}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="bg-white rounded-lg shadow-lg p-8 border-2 border-dashed border-synthra-300 text-center cursor-pointer hover:border-synthra-600 transition"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-5xl mb-3">📷</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload Circuit Photo</h2>
        <p className="text-gray-600 mb-4">Drag and drop or click to select</p>
        <p className="text-sm text-gray-500">Supports JPG, PNG, WebP (max 10 MB)</p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
      </div>

      <button
        onClick={startCamera}
        disabled={loading}
        className="w-full mt-4 px-6 py-3 bg-synthra-600 text-white rounded-lg hover:bg-synthra-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        📱 {loading ? 'Uploading...' : 'Capture from Camera'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded-lg text-red-800">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div className="mt-4 p-4 bg-blue-100 border border-blue-400 rounded-lg text-blue-800">
          <strong>Processing:</strong> Please wait while we analyze your image...
        </div>
      )}
    </div>
  );
}
