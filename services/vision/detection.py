"""
Component detection using YOLOv8 / Detectron2
"""

import cv2
import numpy as np
from typing import List, Dict, Any, Optional
import sys

sys.path.append('/shared')
from schemas import DetectedComponent, ComponentType


class ComponentDetector:
    """
    Circuit component detector using YOLOv8
    Detects: resistors, capacitors, transistors, ICs, logic gates, etc.
    """
    
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load YOLOv8 model"""
        try:
            from ultralytics import YOLO
            # Check if model exists
            import os
            if os.path.exists(self.model_path):
                self.model = YOLO(self.model_path)
                print(f"✓ Model loaded: {self.model_path}")
            else:
                print(f"⚠ Model not found: {self.model_path}")
                print("Using default YOLOv8n for demo (not trained on circuits)")
                self.model = YOLO('yolov8n.pt')  # Fallback to pretrained
        except Exception as e:
            print(f"✗ Failed to load model: {e}")
            self.model = None
    
    def is_loaded(self) -> bool:
        """Check if model is loaded"""
        return self.model is not None
    
    def detect(self, image: np.ndarray) -> List[DetectedComponent]:
        """
        Detect components in preprocessed image
        
        Args:
            image: Preprocessed binary/grayscale image
            
        Returns:
            List of detected components with bounding boxes and confidence
        """
        if not self.is_loaded():
            print("⚠ Model not loaded, returning empty detections")
            return []
        
        try:
            # Run inference
            results = self.model(image, conf=0.25, iou=0.45)
            
            detected = []
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    # Extract detection info
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0].cpu().numpy())
                    class_id = int(box.cls[0].cpu().numpy())
                    
                    # Map class ID to ComponentType
                    # TODO: This mapping depends on your trained model's class order
                    component_type = self._map_class_to_type(class_id)
                    
                    detected.append(DetectedComponent(
                        component_type=component_type,
                        bounding_box=(float(x1), float(y1), float(x2), float(y2)),
                        confidence=confidence,
                        segmentation_mask=None  # TODO: Add if using instance segmentation
                    ))
            
            return detected
            
        except Exception as e:
            print(f"✗ Detection error: {e}")
            return []
    
    def _map_class_to_type(self, class_id: int) -> ComponentType:
        """
        Map YOLO class ID to ComponentType enum
        
        This mapping depends on your training dataset class order.
        Update this based on your data.yaml file.
        """
        # Example mapping (customize for your model):
        mapping = {
            0: ComponentType.RESISTOR,
            1: ComponentType.CAPACITOR,
            2: ComponentType.INDUCTOR,
            3: ComponentType.DIODE,
            4: ComponentType.BJT_NPN,
            5: ComponentType.BJT_PNP,
            6: ComponentType.MOSFET_N,
            7: ComponentType.MOSFET_P,
            8: ComponentType.OPAMP,
            9: ComponentType.VOLTAGE_SOURCE,
            10: ComponentType.GROUND,
            11: ComponentType.VCC,
            12: ComponentType.LOGIC_AND,
            13: ComponentType.LOGIC_OR,
            14: ComponentType.LOGIC_NOT,
            15: ComponentType.IC_GENERIC,
        }
        
        return mapping.get(class_id, ComponentType.UNKNOWN)
    
    def refine_with_sam(self, image: np.ndarray, detections: List[DetectedComponent]) -> List[DetectedComponent]:
        """
        Refine detection boundaries using Segment Anything Model (SAM)
        
        Args:
            image: Original image
            detections: Initial YOLO detections
            
        Returns:
            Detections with refined segmentation masks
        """
        # TODO: Implement SAM integration for mask refinement
        # This provides pixel-accurate component boundaries
        return detections
