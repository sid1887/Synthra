"""
Component detection using YOLOv8 / Detectron2
"""

import cv2
import numpy as np
from typing import List, Dict, Any, Optional
import sys
import httpx
import os

sys.path.append('/shared')
from schemas import DetectedComponent, ComponentType


class ComponentDetector:
    """
    Circuit component detector using YOLOv8
    Detects: resistors, capacitors, transistors, ICs, logic gates, etc.
    """
    
    def __init__(self, model_path: str, sve_url: Optional[str] = None):
        self.model_path = model_path
        self.model = None
        self.sve_url = sve_url or os.getenv("SVE_SERVICE_URL", "http://sve:8000")
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
    
    async def generate_missing_symbol_via_sve(
        self, 
        component_type: ComponentType,
        confidence: float = 0.0
    ) -> Optional[Dict[str, Any]]:
        """
        Autonomously generate component symbol via SVE when not in database
        or confidence is low. This is the key autonomous invocation point.
        
        Args:
            component_type: Detected component type
            confidence: Detection confidence (0-1)
            
        Returns:
            SVE response with SVG symbol or None if failed
        """
        # Thresholds for autonomous generation
        LOW_CONFIDENCE_THRESHOLD = 0.6
        
        # Determine if we need SVE assistance
        needs_sve = (
            component_type == ComponentType.UNKNOWN or
            confidence < LOW_CONFIDENCE_THRESHOLD
        )
        
        if not needs_sve:
            return None
        
        try:
            # Map ComponentType to SVE component name
            component_name = self._component_type_to_sve_name(component_type)
            category = self._infer_category(component_type)
            
            print(f"🎨 Autonomous SVE invocation for: {component_name} (confidence: {confidence:.2f})")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.sve_url}/api/generate",
                    json={
                        "component_type": component_name,
                        "category": category,
                        "force_regenerate": False  # Use cache if available
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ SVE generated: {component_name} (from_cache: {data.get('from_cache', False)})")
                    return data
                else:
                    print(f"⚠️ SVE generation failed: {response.status_code}")
                    return None
                    
        except Exception as e:
            print(f"❌ SVE invocation error: {e}")
            return None
    
    def _component_type_to_sve_name(self, component_type: ComponentType) -> str:
        """Map ComponentType enum to SVE component name"""
        mapping = {
            ComponentType.RESISTOR: "resistor",
            ComponentType.CAPACITOR: "capacitor",
            ComponentType.INDUCTOR: "inductor",
            ComponentType.DIODE: "diode",
            ComponentType.LED: "led",
            ComponentType.BJT_NPN: "bjt_npn",
            ComponentType.BJT_PNP: "bjt_pnp",
            ComponentType.MOSFET_N: "mosfet_n_channel",
            ComponentType.MOSFET_P: "mosfet_p_channel",
            ComponentType.OPAMP: "opamp",
            ComponentType.VOLTAGE_SOURCE: "voltage_source",
            ComponentType.CURRENT_SOURCE: "current_source",
            ComponentType.GROUND: "ground",
            ComponentType.VCC: "vcc",
            ComponentType.LOGIC_AND: "and_gate",
            ComponentType.LOGIC_OR: "or_gate",
            ComponentType.LOGIC_NOT: "not_gate",
            ComponentType.LOGIC_NAND: "nand_gate",
            ComponentType.LOGIC_NOR: "nor_gate",
            ComponentType.LOGIC_XOR: "xor_gate",
            ComponentType.IC_GENERIC: "microcontroller_8pin",
            ComponentType.UNKNOWN: "generic_component",
        }
        return mapping.get(component_type, "unknown")
    
    def _infer_category(self, component_type: ComponentType) -> str:
        """Infer SVE category from ComponentType"""
        if component_type in [ComponentType.RESISTOR, ComponentType.CAPACITOR, ComponentType.INDUCTOR]:
            return "passive"
        elif component_type in [ComponentType.DIODE, ComponentType.LED, 
                               ComponentType.BJT_NPN, ComponentType.BJT_PNP,
                               ComponentType.MOSFET_N, ComponentType.MOSFET_P]:
            return "active"
        elif component_type in [ComponentType.LOGIC_AND, ComponentType.LOGIC_OR,
                               ComponentType.LOGIC_NOT, ComponentType.LOGIC_NAND,
                               ComponentType.LOGIC_NOR, ComponentType.LOGIC_XOR]:
            return "digital"
        elif component_type in [ComponentType.OPAMP]:
            return "analog"
        elif component_type in [ComponentType.VOLTAGE_SOURCE, ComponentType.CURRENT_SOURCE,
                               ComponentType.GROUND, ComponentType.VCC]:
            return "power"
        else:
            return "passive"  # Default fallback
    
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
