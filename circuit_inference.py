"""
Circuit Detection Inference Script
- Load trained model from checkpoint or final model
- Perform inference on single images or batches
- Output detections with confidence scores
- Ready for production deployment

Usage:
    from circuit_inference import CircuitDetector
    
    detector = CircuitDetector(model_path="/kaggle/working/final_model.pth")
    results = detector.detect_image("path/to/image.jpg")
"""

import os
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import json
from pathlib import Path
from typing import Dict, List, Any
import numpy as np


class CircuitDetector:
    """Production-ready inference wrapper for circuit detection model."""
    
    def __init__(self, model_path: str, num_classes: int = 126, device: str = None):
        """
        Initialize detector.
        
        Args:
            model_path: Path to saved model.pth file
            num_classes: Number of circuit component classes
            device: "cuda" or "cpu" (auto-detect if None)
        """
        self.num_classes = num_classes
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.device = torch.device(self.device)
        
        # Build and load model
        self.model = self._build_model()
        self._load_weights(model_path)
        
        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((416, 416)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                std=[0.229, 0.224, 0.225])
        ])
        
        print(f"✓ CircuitDetector initialized on {self.device}")
        print(f"  Model: {model_path}")
        print(f"  Classes: {num_classes}")
    
    def _build_model(self):
        """Build ResNet-50 model with custom head."""
        model = models.resnet50(pretrained=False)
        num_features = model.fc.in_features
        model.fc = nn.Sequential(
            nn.Linear(num_features, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, self.num_classes)
        )
        return model.to(self.device)
    
    def _load_weights(self, model_path: str):
        """Load model weights from file."""
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found: {model_path}")
        
        state_dict = torch.load(model_path, map_location=self.device)
        self.model.load_state_dict(state_dict)
        self.model.eval()
        print(f"✓ Model weights loaded from {model_path}")
    
    def detect_image(self, image_path: str, confidence_threshold: float = 0.5) -> Dict[str, Any]:
        """
        Detect circuits in a single image.
        
        Args:
            image_path: Path to input image
            confidence_threshold: Minimum confidence for detections
        
        Returns:
            {
                "image": str,
                "detected_classes": List[{"class_id": int, "confidence": float}],
                "top_detection": {"class_id": int, "confidence": float} or None,
                "processing_time": float
            }
        """
        import time
        start = time.time()
        
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")
        
        # Load and preprocess image
        image = Image.open(image_path).convert("RGB")
        tensor = self.transform(image).unsqueeze(0).to(self.device)
        
        # Inference
        with torch.no_grad():
            logits = self.model(tensor)
            probabilities = torch.softmax(logits, dim=1)[0].cpu().numpy()
        
        # Get detections above threshold
        detections = []
        for class_id, confidence in enumerate(probabilities):
            if confidence >= confidence_threshold:
                detections.append({
                    "class_id": int(class_id),
                    "confidence": float(confidence)
                })
        
        # Sort by confidence
        detections.sort(key=lambda x: x["confidence"], reverse=True)
        
        processing_time = time.time() - start
        
        return {
            "image": str(image_path),
            "detected_classes": detections,
            "top_detection": detections[0] if detections else None,
            "processing_time": processing_time
        }
    
    def detect_batch(self, image_paths: List[str], 
                    confidence_threshold: float = 0.5,
                    batch_size: int = 32) -> List[Dict[str, Any]]:
        """
        Detect circuits in multiple images.
        
        Args:
            image_paths: List of image paths
            confidence_threshold: Minimum confidence for detections
            batch_size: Batch size for processing
        
        Returns:
            List of detection results
        """
        results = []
        
        for i in range(0, len(image_paths), batch_size):
            batch_paths = image_paths[i:i+batch_size]
            
            # Load batch
            batch_tensors = []
            valid_paths = []
            
            for path in batch_paths:
                try:
                    image = Image.open(path).convert("RGB")
                    tensor = self.transform(image)
                    batch_tensors.append(tensor)
                    valid_paths.append(path)
                except Exception as e:
                    print(f"⚠ Failed to load {path}: {e}")
            
            if not batch_tensors:
                continue
            
            # Batch inference
            batch = torch.stack(batch_tensors).to(self.device)
            import time
            start = time.time()
            
            with torch.no_grad():
                logits = self.model(batch)
                probabilities = torch.softmax(logits, dim=1).cpu().numpy()
            
            processing_time = time.time() - start
            
            # Process results
            for img_path, probs in zip(valid_paths, probabilities):
                detections = []
                for class_id, confidence in enumerate(probs):
                    if confidence >= confidence_threshold:
                        detections.append({
                            "class_id": int(class_id),
                            "confidence": float(confidence)
                        })
                
                detections.sort(key=lambda x: x["confidence"], reverse=True)
                
                results.append({
                    "image": str(img_path),
                    "detected_classes": detections,
                    "top_detection": detections[0] if detections else None,
                    "processing_time": processing_time / len(batch_tensors)
                })
        
        return results
    
    def export_results(self, results: List[Dict], output_path: str):
        """Save detection results to JSON."""
        with open(output_path, "w") as f:
            json.dump(results, f, indent=2)
        print(f"✓ Results saved to {output_path}")


# ============================================================================
# USAGE EXAMPLES
# ============================================================================

if __name__ == "__main__":
    """
    Example usage (run in Kaggle):
    
    1. Single image detection:
        detector = CircuitDetector("/kaggle/working/final_model.pth")
        result = detector.detect_image("/path/to/image.jpg")
        print(result)
    
    2. Batch detection:
        detector = CircuitDetector("/kaggle/working/final_model.pth")
        image_paths = ["/path/to/img1.jpg", "/path/to/img2.jpg"]
        results = detector.detect_batch(image_paths)
        detector.export_results(results, "/kaggle/working/detections.json")
    
    3. From checkpoint (if training incomplete):
        import torch
        checkpoint = torch.load("/kaggle/working/checkpoint.pth")
        state_dict = checkpoint["model_state_dict"]
        # Load state_dict into model before creating detector
    """
    
    print("CircuitDetector utility loaded successfully")
    print("See docstrings for usage examples")
