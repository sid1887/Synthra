#!/usr/bin/env python3
"""
CIRCUIT DETECTION INFERENCE WRAPPER
Wrapper for trained YOLOv8 model inference
Used by backend API for circuit detection
"""

import cv2
import numpy as np
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import json
import time

try:
    from ultralytics import YOLO
except ImportError:
    print("Error: ultralytics not installed")
    YOLO = None

class CircuitDetector:
    """Wrapper for YOLOv8 circuit detection model"""
    
    def __init__(self, model_path: str = None):
        """
        Initialize detector with trained model
        
        Args:
            model_path: Path to trained YOLOv8 model (best.pt)
        """
        if YOLO is None:
            raise ImportError("ultralytics not installed")
        
        # Use default path if not specified
        if model_path is None:
            default_path = Path(r"c:\Synthra\models\circuit_detection_yolov8s\weights\best.pt")
            if default_path.exists():
                model_path = str(default_path)
            else:
                raise FileNotFoundError(f"Model not found at {default_path}")
        
        print(f"Loading model from: {model_path}")
        self.model = YOLO(model_path)
        self.device = "cpu"
        self.confidence_threshold = 0.5
        print("✓ Model loaded successfully")
    
    def detect(
        self, 
        image_path: str,
        confidence: float = 0.5,
        iou_threshold: float = 0.45
    ) -> Dict:
        """
        Detect components in an image
        
        Args:
            image_path: Path to image file
            confidence: Confidence threshold for detections
            iou_threshold: IoU threshold for NMS
            
        Returns:
            Dict with detected components:
            {
                "success": bool,
                "detections": [
                    {
                        "class_id": int,
                        "class_name": str,
                        "confidence": float,
                        "bbox": [x_min, y_min, x_max, y_max],
                        "center": [x_center, y_center]
                    }
                ],
                "image_size": [width, height],
                "processing_time": float
            }
        """
        start_time = time.time()
        
        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                return {
                    "success": False,
                    "error": f"Could not read image: {image_path}"
                }
            
            height, width = image.shape[:2]
            
            # Run inference
            results = self.model.predict(
                image_path,
                conf=confidence,
                iou=iou_threshold,
                device=self.device,
                verbose=False
            )
            
            # Parse results
            detections = []
            if results and len(results) > 0:
                result = results[0]
                if result.boxes is not None:
                    for box in result.boxes:
                        # Get box coordinates (xyxy format)
                        bbox_xyxy = box.xyxy[0].cpu().numpy()
                        x_min, y_min, x_max, y_max = bbox_xyxy
                        
                        # Calculate center
                        x_center = (x_min + x_max) / 2
                        y_center = (y_min + y_max) / 2
                        
                        # Get class info
                        class_id = int(box.cls[0])
                        confidence_score = float(box.conf[0])
                        class_name = self.model.names.get(class_id, f"class_{class_id}")
                        
                        detection = {
                            "class_id": class_id,
                            "class_name": class_name,
                            "confidence": round(confidence_score, 3),
                            "bbox": [
                                int(x_min), int(y_min),
                                int(x_max), int(y_max)
                            ],
                            "center": [
                                int(x_center), int(y_center)
                            ]
                        }
                        detections.append(detection)
            
            processing_time = time.time() - start_time
            
            return {
                "success": True,
                "detections": detections,
                "image_size": [width, height],
                "num_detections": len(detections),
                "processing_time": round(processing_time, 3),
                "device": self.device
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "processing_time": time.time() - start_time
            }
    
    def detect_batch(
        self,
        image_paths: List[str],
        confidence: float = 0.5
    ) -> List[Dict]:
        """
        Detect in multiple images
        
        Args:
            image_paths: List of image file paths
            confidence: Confidence threshold
            
        Returns:
            List of detection results
        """
        results = []
        for image_path in image_paths:
            result = self.detect(image_path, confidence=confidence)
            results.append(result)
        return results
    
    def get_class_names(self) -> Dict[int, str]:
        """Get all class names from model"""
        return self.model.names

if __name__ == "__main__":
    # Test inference
    print("\n" + "=" * 80)
    print("🧪 TESTING CIRCUIT DETECTOR")
    print("=" * 80)
    
    try:
        detector = CircuitDetector()
        print("\n✓ Detector initialized")
        
        # Print available classes
        classes = detector.get_class_names()
        print(f"\nAvailable classes: {len(classes)}")
        print(f"Sample classes:")
        for class_id in sorted(list(classes.keys())[:10]):
            print(f"  {class_id}: {classes[class_id]}")
        
        print("\n✓ Inference module ready!")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
