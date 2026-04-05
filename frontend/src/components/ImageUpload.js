import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
export default function ImageUpload({ onAnalyze, loading, error }) {
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [useCamera, setUseCamera] = useState(false);
    const handleFileSelect = (file) => {
        if (file.type.startsWith('image/')) {
            onAnalyze(file);
        }
    };
    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file)
            handleFileSelect(file);
    };
    const handleCapture = async () => {
        if (!videoRef.current || !canvasRef.current)
            return;
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
                        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
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
        }
        catch (err) {
            alert('Could not access camera');
        }
    };
    if (useCamera) {
        return (_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Capture Circuit Photo" }), _jsx("video", { ref: videoRef, autoPlay: true, playsInline: true, className: "w-full rounded-lg mb-4", width: 640, height: 480 }), _jsx("canvas", { ref: canvasRef, className: "hidden", width: 640, height: 480 }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: handleCapture, className: "flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition", children: "\uD83D\uDCF8 Capture Photo" }), _jsx("button", { onClick: () => {
                                setUseCamera(false);
                                if (videoRef.current?.srcObject) {
                                    videoRef.current.srcObject.getTracks().forEach(t => t.stop());
                                }
                            }, className: "flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition", children: "Cancel" })] })] }));
    }
    return (_jsxs("div", { children: [_jsxs("div", { onDrop: handleDrop, onDragOver: (e) => e.preventDefault(), className: "bg-white rounded-lg shadow-lg p-8 border-2 border-dashed border-synthra-300 text-center cursor-pointer hover:border-synthra-600 transition", onClick: () => fileInputRef.current?.click(), children: [_jsx("div", { className: "text-5xl mb-3", children: "\uD83D\uDCF7" }), _jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-2", children: "Upload Circuit Photo" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Drag and drop or click to select" }), _jsx("p", { className: "text-sm text-gray-500", children: "Supports JPG, PNG, WebP (max 10 MB)" }), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", className: "hidden", onChange: (e) => {
                            const file = e.target.files?.[0];
                            if (file)
                                handleFileSelect(file);
                        } })] }), _jsxs("button", { onClick: startCamera, disabled: loading, className: "w-full mt-4 px-6 py-3 bg-synthra-600 text-white rounded-lg hover:bg-synthra-700 transition disabled:opacity-50 disabled:cursor-not-allowed", children: ["\uD83D\uDCF1 ", loading ? 'Uploading...' : 'Capture from Camera'] }), error && (_jsxs("div", { className: "mt-4 p-4 bg-red-100 border border-red-400 rounded-lg text-red-800", children: [_jsx("strong", { children: "Error:" }), " ", error] })), loading && (_jsxs("div", { className: "mt-4 p-4 bg-blue-100 border border-blue-400 rounded-lg text-blue-800", children: [_jsx("strong", { children: "Processing:" }), " Please wait while we analyze your image..."] }))] }));
}
