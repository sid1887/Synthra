"""
Image preprocessing pipeline
Handles: deskew, perspective correction, denoising, thresholding, morphological operations
"""

import cv2
import numpy as np
from typing import Tuple, List, Dict, Any
from scipy import ndimage


def preprocess_image(
    image_path: str,
    options: Dict[str, Any] = None
) -> Tuple[np.ndarray, List[str]]:
    """
    Preprocess circuit schematic image
    
    Args:
        image_path: Path to input image
        options: Preprocessing options
        
    Returns:
        Tuple of (preprocessed image array, list of applied steps)
    """
    options = options or {}
    applied_steps = []
    
    # Load image
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Could not load image: {image_path}")
    
    # Convert to grayscale
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        applied_steps.append("grayscale")
    else:
        gray = image
    
    # Deskew (correct rotation)
    if options.get("deskew", True):
        gray = deskew(gray)
        applied_steps.append("deskew")
    
    # Perspective correction (if needed)
    if options.get("perspective_correction", True):
        gray = correct_perspective(gray)
        applied_steps.append("perspective_correction")
    
    # Denoise
    if options.get("denoise", True):
        gray = cv2.fastNlMeansDenoising(gray, h=10)
        applied_steps.append("denoise")
    
    # Adaptive thresholding
    if options.get("threshold", True):
        binary = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV, 11, 2
        )
        applied_steps.append("adaptive_threshold")
    else:
        binary = gray
    
    # Morphological cleaning (remove noise)
    if options.get("morphological_clean", True):
        kernel = np.ones((2, 2), np.uint8)
        binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
        applied_steps.append("morphological_open")
    
    # Skeletonization (for wire tracing)
    if options.get("skeletonize", False):
        skeleton = skeletonize(binary)
        applied_steps.append("skeletonize")
        return skeleton, applied_steps
    
    return binary, applied_steps


def deskew(image: np.ndarray) -> np.ndarray:
    """
    Detect and correct image rotation/skew
    """
    # Find contours
    coords = np.column_stack(np.where(image > 0))
    if len(coords) == 0:
        return image
    
    # Calculate rotation angle
    angle = cv2.minAreaRect(coords)[-1]
    
    # Adjust angle
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
    
    # Rotate image
    if abs(angle) > 0.5:  # Only rotate if significant skew
        (h, w) = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            image, M, (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE
        )
        return rotated
    
    return image


def correct_perspective(image: np.ndarray) -> np.ndarray:
    """
    Correct perspective distortion (if image is photographed at an angle)
    """
    # Detect edges
    edges = cv2.Canny(image, 50, 150, apertureSize=3)
    
    # Detect lines using Hough transform
    lines = cv2.HoughLines(edges, 1, np.pi/180, 200)
    
    if lines is None or len(lines) < 4:
        return image  # Not enough lines to determine perspective
    
    # TODO: Implement full perspective correction using detected lines
    # For now, return original image
    return image


def skeletonize(image: np.ndarray) -> np.ndarray:
    """
    Reduce binary image to single-pixel-wide skeleton
    Useful for wire tracing
    """
    from skimage.morphology import skeletonize as sk_skeletonize
    return sk_skeletonize(image > 0).astype(np.uint8) * 255


def enhance_contrast(image: np.ndarray) -> np.ndarray:
    """
    Enhance image contrast using CLAHE
    """
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(image)
