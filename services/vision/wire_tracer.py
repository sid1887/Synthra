"""
Wire tracing and topology extraction
Converts wire pixels into graph structure (nodes and edges)
"""

import cv2
import numpy as np
from typing import List, Tuple, Dict, Set
from scipy import ndimage
import sys

sys.path.append('/shared')
from schemas import DetectedComponent, WireSegment


def trace_wires(
    image: np.ndarray,
    components: List[DetectedComponent]
) -> List[WireSegment]:
    """
    Extract wire paths from preprocessed image
    
    Steps:
    1. Remove component bounding boxes from image
    2. Skeletonize remaining wire pixels
    3. Extract line segments using Hough transform
    4. Connect segments into polylines
    5. Detect junctions (nodes where 3+ wires meet)
    
    Args:
        image: Preprocessed binary image
        components: Detected components (to mask out)
        
    Returns:
        List of wire segments (polylines)
    """
    # Create a copy and mask out components
    wire_image = image.copy()
    
    for comp in components:
        x1, y1, x2, y2 = [int(c) for c in comp.bounding_box]
        # Dilate slightly to ensure complete masking
        padding = 5
        x1 = max(0, x1 - padding)
        y1 = max(0, y1 - padding)
        x2 = min(wire_image.shape[1], x2 + padding)
        y2 = min(wire_image.shape[0], y2 + padding)
        
        wire_image[y1:y2, x1:x2] = 0
    
    # Skeletonize to get thin wires
    from skimage.morphology import skeletonize
    skeleton = skeletonize(wire_image > 0).astype(np.uint8) * 255
    
    # Detect lines using probabilistic Hough transform
    lines = cv2.HoughLinesP(
        skeleton,
        rho=1,
        theta=np.pi/180,
        threshold=20,
        minLineLength=10,
        maxLineGap=5
    )
    
    if lines is None:
        return []
    
    # Convert lines to wire segments
    wire_segments = []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        wire_segments.append(WireSegment(
            points=[(float(x1), float(y1)), (float(x2), float(y2))],
            confidence=0.9  # High confidence for detected lines
        ))
    
    # Merge nearby segments into polylines
    merged_segments = merge_wire_segments(wire_segments)
    
    return merged_segments


def merge_wire_segments(segments: List[WireSegment], threshold: float = 5.0) -> List[WireSegment]:
    """
    Merge connected line segments into continuous polylines
    
    Args:
        segments: List of individual line segments
        threshold: Distance threshold for merging endpoints
        
    Returns:
        List of merged polylines
    """
    if not segments:
        return []
    
    # Build adjacency graph
    adjacency = build_adjacency_graph(segments, threshold)
    
    # Find connected components
    visited = set()
    polylines = []
    
    for i in range(len(segments)):
        if i in visited:
            continue
        
        # BFS to find connected segments
        polyline_points = []
        queue = [i]
        visited.add(i)
        
        while queue:
            current = queue.pop(0)
            polyline_points.extend(segments[current].points)
            
            for neighbor in adjacency.get(current, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        
        # Remove duplicate consecutive points
        unique_points = []
        for point in polyline_points:
            if not unique_points or point != unique_points[-1]:
                unique_points.append(point)
        
        if len(unique_points) >= 2:
            polylines.append(WireSegment(
                points=unique_points,
                confidence=0.9
            ))
    
    return polylines


def build_adjacency_graph(segments: List[WireSegment], threshold: float) -> Dict[int, List[int]]:
    """
    Build adjacency graph of wire segments based on endpoint proximity
    """
    adjacency = {i: [] for i in range(len(segments))}
    
    for i in range(len(segments)):
        for j in range(i + 1, len(segments)):
            # Check if endpoints are close
            seg_i = segments[i].points
            seg_j = segments[j].points
            
            # Check all endpoint combinations
            endpoints_i = [seg_i[0], seg_i[-1]]
            endpoints_j = [seg_j[0], seg_j[-1]]
            
            for pi in endpoints_i:
                for pj in endpoints_j:
                    dist = np.sqrt((pi[0] - pj[0])**2 + (pi[1] - pj[1])**2)
                    if dist <= threshold:
                        adjacency[i].append(j)
                        adjacency[j].append(i)
                        break
    
    return adjacency


def detect_junctions(wire_image: np.ndarray) -> List[Tuple[int, int]]:
    """
    Detect junction points where 3 or more wires meet
    
    Args:
        wire_image: Skeletonized wire image
        
    Returns:
        List of (x, y) junction coordinates
    """
    # Convolve with 3x3 kernel to count neighbors
    kernel = np.ones((3, 3), dtype=np.uint8)
    kernel[1, 1] = 0  # Don't count center pixel
    
    neighbor_count = cv2.filter2D(wire_image, -1, kernel)
    
    # Junctions have 3+ neighbors
    junctions = np.where((wire_image > 0) & (neighbor_count >= 3 * 255))
    
    return list(zip(junctions[1], junctions[0]))  # (x, y) format


def attach_pins_to_wires(
    components: List[DetectedComponent],
    wire_segments: List[WireSegment],
    threshold: float = 10.0
) -> Dict[str, str]:
    """
    Map component pins to nearest wire segments (assign net IDs)
    
    Args:
        components: Detected components with pin positions
        wire_segments: Extracted wire polylines
        threshold: Maximum distance for pin-to-wire attachment
        
    Returns:
        Dictionary mapping pin_id -> net_id
    """
    pin_to_net = {}
    
    # For each component pin, find nearest wire point
    for comp_idx, comp in enumerate(components):
        # Assuming pins are at component edges
        # TODO: Use actual pin positions from component library
        pass
    
    return pin_to_net
