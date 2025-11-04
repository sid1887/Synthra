"""
OCR and value extraction for component labels
"""

import cv2
import numpy as np
import pytesseract
import re
from typing import List, Dict, Any, Optional, Tuple
import sys

sys.path.append('/shared')
from schemas import DetectedComponent


def extract_text_values(
    image: np.ndarray,
    components: List[DetectedComponent]
) -> List[DetectedComponent]:
    """
    Extract text labels and values near detected components
    
    Args:
        image: Preprocessed image
        components: List of detected components
        
    Returns:
        Components with detected_text and text_confidence fields populated
    """
    for component in components:
        # Expand bounding box to capture nearby text
        x1, y1, x2, y2 = component.bounding_box
        
        # Expand by 20% in each direction
        h, w = y2 - y1, x2 - x1
        x1_exp = max(0, int(x1 - w * 0.2))
        y1_exp = max(0, int(y1 - h * 0.2))
        x2_exp = min(image.shape[1], int(x2 + w * 0.2))
        y2_exp = min(image.shape[0], int(y2 + h * 0.2))
        
        # Extract ROI
        roi = image[y1_exp:y2_exp, x1_exp:x2_exp]
        
        if roi.size == 0:
            continue
        
        # OCR
        try:
            text = pytesseract.image_to_string(
                roi,
                config='--psm 6'  # Assume uniform block of text
            ).strip()
            
            # Parse value from text
            value, confidence = parse_component_value(text, component.component_type)
            
            if value:
                component.detected_text = value
                component.text_confidence = confidence
                
        except Exception as e:
            print(f"OCR error for component: {e}")
            continue
    
    return components


def parse_component_value(text: str, component_type: Any) -> Tuple[Optional[str], float]:
    """
    Parse component value from OCR text
    
    Examples:
        "10k" -> "10k"
        "100nF" -> "100nF"
        "R1 10k" -> "10k"
        "C1=100nF" -> "100nF"
        "5V" -> "5V"
    
    Returns:
        Tuple of (parsed_value, confidence)
    """
    if not text:
        return None, 0.0
    
    text = text.strip()
    confidence = 0.8  # Base confidence
    
    # Resistance patterns (10k, 1M, 100R, 4.7k)
    resistance_pattern = r'(\d+\.?\d*)\s*([kKmMrRΩ]|ohm)?'
    
    # Capacitance patterns (100nF, 10uF, 1pF)
    capacitance_pattern = r'(\d+\.?\d*)\s*([pnuμ]?F)'
    
    # Voltage patterns (5V, 3.3V, 12V)
    voltage_pattern = r'(\d+\.?\d*)\s*V'
    
    # Try different patterns based on component type
    from schemas import ComponentType
    
    if component_type in [ComponentType.RESISTOR]:
        match = re.search(resistance_pattern, text, re.IGNORECASE)
        if match:
            value = match.group(1)
            unit = match.group(2) or 'R'
            return f"{value}{unit.lower()}", confidence
    
    elif component_type in [ComponentType.CAPACITOR]:
        match = re.search(capacitance_pattern, text, re.IGNORECASE)
        if match:
            value = match.group(1)
            unit = match.group(2)
            return f"{value}{unit}", confidence
    
    elif component_type in [ComponentType.VOLTAGE_SOURCE, ComponentType.VCC]:
        match = re.search(voltage_pattern, text, re.IGNORECASE)
        if match:
            value = match.group(1)
            return f"{value}V", confidence
    
    # Fallback: return cleaned text if it looks like a value
    cleaned = re.sub(r'[^0-9.kKmMnNuUpPfFvVrRΩ]', '', text)
    if cleaned and len(cleaned) > 1:
        return cleaned, confidence * 0.5
    
    return None, 0.0


def normalize_value(value: str) -> Tuple[float, str]:
    """
    Normalize component value to base units
    
    Examples:
        "10k" -> (10000, "Ω")
        "100nF" -> (1e-7, "F")
        "5V" -> (5.0, "V")
    
    Returns:
        Tuple of (numeric_value, unit)
    """
    if not value:
        return 0.0, ""
    
    # Multiplier mapping
    multipliers = {
        'p': 1e-12,
        'n': 1e-9,
        'u': 1e-6,
        'μ': 1e-6,
        'm': 1e-3,
        'k': 1e3,
        'M': 1e6,
        'G': 1e9,
    }
    
    # Extract numeric part and unit
    match = re.match(r'([\d.]+)([a-zA-Zμ]+)', value)
    if not match:
        try:
            return float(value), ""
        except:
            return 0.0, ""
    
    numeric_str = match.group(1)
    unit_str = match.group(2)
    
    # Parse numeric value
    try:
        numeric = float(numeric_str)
    except:
        return 0.0, ""
    
    # Apply multiplier if present
    if unit_str and unit_str[0] in multipliers:
        numeric *= multipliers[unit_str[0]]
        unit = unit_str[1:] if len(unit_str) > 1 else ""
    else:
        unit = unit_str
    
    return numeric, unit
