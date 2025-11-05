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
    Uses contour detection to find document boundaries
    """
    # Detect edges
    edges = cv2.Canny(image, 50, 150, apertureSize=3)
    
    # Find contours
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return image
    
    # Find largest contour (document boundary)
    largest_contour = max(contours, key=cv2.contourArea)
    
    # Filter small contours
    if cv2.contourArea(largest_contour) < 1000:
        return image
    
    # Approximate to quadrilateral
    epsilon = 0.02 * cv2.arcLength(largest_contour, True)
    approx = cv2.approxPolyDP(largest_contour, epsilon, True)
    
    if len(approx) == 4:
        # Order points: top-left, top-right, bottom-right, bottom-left
        pts = order_points(approx.reshape(4, 2))
        
        # Compute target dimensions
        width = max(
            np.linalg.norm(pts[0] - pts[1]),
            np.linalg.norm(pts[2] - pts[3])
        )
        height = max(
            np.linalg.norm(pts[0] - pts[3]),
            np.linalg.norm(pts[1] - pts[2])
        )
        
        dst = np.array([
            [0, 0],
            [width - 1, 0],
            [width - 1, height - 1],
            [0, height - 1]
        ], dtype=np.float32)
        
        # Perspective transform
        M = cv2.getPerspectiveTransform(pts.astype(np.float32), dst)
        warped = cv2.warpPerspective(image, M, (int(width), int(height)))
        return warped
    
    return image


def order_points(pts: np.ndarray) -> np.ndarray:
    """Order points as: top-left, top-right, bottom-right, bottom-left"""
    rect = np.zeros((4, 2), dtype=np.float32)
    
    # Sum: top-left has smallest sum, bottom-right has largest
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    
    # Diff: top-right has smallest diff, bottom-left has largest
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    
    return rect


def skeletonize(image: np.ndarray) -> np.ndarray:
    """
    Reduce binary image to single-pixel-wide skeleton
    Useful for wire tracing - uses Zhang-Suen thinning algorithm
    """
    # Ensure binary
    _, binary = cv2.threshold(image, 127, 255, cv2.THRESH_BINARY)
    
    # OpenCV thinning (Zhang-Suen algorithm)
    skeleton = cv2.ximgproc.thinning(binary, thinningType=cv2.ximgproc.THINNING_ZHANGSUEN)
    
    return skeleton


def extract_wire_segments(skeleton: np.ndarray) -> List[np.ndarray]:
    """
    Extract wire segments from skeletonized image
    Returns list of polylines representing wires
    """
    # Find contours in skeleton
    contours, _ = cv2.findContours(
        skeleton, 
        cv2.RETR_EXTERNAL, 
        cv2.CHAIN_APPROX_SIMPLE
    )
    
    # Filter and simplify contours to polylines
    wire_segments = []
    for contour in contours:
        if cv2.contourArea(contour) > 10:  # Filter tiny fragments
            # Approximate to polyline
            epsilon = 0.01 * cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, epsilon, True)
            wire_segments.append(approx)
    
    return wire_segments


def enhance_contrast(image: np.ndarray) -> np.ndarray:
    """
    Enhance image contrast using CLAHE
    """
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(image)
