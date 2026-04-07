#!/usr/bin/env python3
"""
SCRIPT 1: YOLO DATASET MERGER
Merges 4 YOLOv8 datasets with unified class mapping
Input: 4 separate YOLO datasets
Output: Single merged dataset with consistent class IDs
"""

import os
import json
import shutil
from pathlib import Path
from collections import defaultdict
import hashlib
import time

BASE_DATASETS_PATH = Path(r"c:\Synthra\Datasets")
OUTPUT_PATH = Path(r"c:\Synthra\training_data\merged_yolo")

def get_file_hash(filepath):
    """Compute MD5 hash of file"""
    hash_md5 = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def load_yolo_dataset(dataset_path, dataset_name):
    """Load YOLO dataset structure"""
    dataset_path = Path(dataset_path)
    result = {
        "name": dataset_name,
        "splits": {},
        "classes": set(),
        "images_by_split": defaultdict(list),
        "labels_by_split": defaultdict(list),
        "total_objects": 0,
        "class_distribution": defaultdict(int),
    }
    
    for split in ["train", "val", "test"]:
        split_path = dataset_path / split
        if not split_path.exists():
            continue
        
        images_path = split_path / "images"
        labels_path = split_path / "labels"
        
        if images_path.exists():
            images = sorted([f for f in images_path.iterdir() if f.suffix.lower() in ['.jpg', '.png', '.jpeg']])
            result["images_by_split"][split] = images
            result["splits"][split] = {"images": len(images)}
        
        if labels_path.exists():
            labels = sorted([f for f in labels_path.iterdir() if f.suffix == ".txt"])
            result["labels_by_split"][split] = labels
            
            # Analyze class distribution
            for label_file in labels:
                try:
                    with open(label_file, 'r') as f:
                        for line in f:
                            parts = line.strip().split()
                            if parts:
                                class_id = parts[0]
                                result["classes"].add(class_id)
                                result["class_distribution"][class_id] += 1
                                result["total_objects"] += 1
                except:
                    pass
    
    return result

def map_classes(datasets_info):
    """Create unified class mapping"""
    mapping = {}
    unified_id = 0
    
    # Sort datasets by name for consistent ordering
    sorted_datasets = sorted(datasets_info.items())
    
    print("\n📋 CLASS MAPPING STRATEGY")
    print("=" * 80)
    
    for dataset_name, info in sorted_datasets:
        print(f"\n{dataset_name}:")
        unique_classes = sorted(info["classes"], key=lambda x: int(x))
        
        for old_id in unique_classes:
            key = (dataset_name, old_id)
            mapping[key] = unified_id
            print(f"  {dataset_name} class {old_id:2s} → unified class {unified_id:3d}")
            unified_id += 1
    
    print(f"\n✅ Total unified classes: {unified_id}")
    return mapping, unified_id

def copy_and_remap_labels(source_label, target_label, dataset_name, old_class_mapping, unified_mapping):
    """Copy label file with remapped class IDs"""
    with open(source_label, 'r') as f:
        lines = f.readlines()
    
    new_lines = []
    for line in lines:
        parts = line.strip().split()
        if parts:
            old_class_id = parts[0]
            # Map old class to unified class
            key = (dataset_name, old_class_id)
            new_class_id = unified_mapping[key]
            # Reconstruct line with new class ID
            new_line = f"{new_class_id} " + " ".join(parts[1:]) + "\n"
            new_lines.append(new_line)
    
    with open(target_label, 'w') as f:
        f.writelines(new_lines)

def merge_datasets():
    """Main merge function"""
    print("\n" + "=" * 80)
    print("🚀 MERGING YOLOV8 DATASETS")
    print("=" * 80)
    
    # Define datasets to merge
    datasets_to_merge = [
        ("circuit elements", BASE_DATASETS_PATH / "circuit elements.yolov8"),
        ("Circuit Schematic Detection", BASE_DATASETS_PATH / "Circuit Schematic Detection.yolov8"),
        ("Electronic Components", BASE_DATASETS_PATH / "Electronic Components.yolov8"),
        ("archive (2)", BASE_DATASETS_PATH / "archive (2)"),
    ]
    
    # Load all datasets
    print("\n📂 LOADING DATASETS...")
    datasets_info = {}
    for name, path in datasets_to_merge:
        if Path(path).exists():
            print(f"  ✓ Loading {name}...")
            datasets_info[name] = load_yolo_dataset(path, name)
        else:
            print(f"  ✗ Not found: {name}")
    
    # Create class mapping
    unified_mapping, total_classes = map_classes(datasets_info)
    
    # Create output directory
    OUTPUT_PATH.mkdir(parents=True, exist_ok=True)
    for split in ["train", "val", "test"]:
        (OUTPUT_PATH / split / "images").mkdir(parents=True, exist_ok=True)
        (OUTPUT_PATH / split / "labels").mkdir(parents=True, exist_ok=True)
    
    # Merge datasets
    print("\n📥 MERGING DATASETS...")
    merge_stats = defaultdict(lambda: {"images": 0, "labels": 0})
    seen_images = {}  # Hash-based duplicate detection
    duplicates_found = 0
    
    for dataset_name, info in datasets_info.items():
        print(f"\n  Processing {dataset_name}...")
        
        for split in ["train", "val", "test"]:
            images = info["images_by_split"].get(split, [])
            labels = info["labels_by_split"].get(split, [])
            
            for img_src, label_src in zip(images, labels):
                # Check for duplicates
                try:
                    img_hash = get_file_hash(img_src)
                    if img_hash in seen_images:
                        duplicates_found += 1
                        continue
                    seen_images[img_hash] = str(img_src)
                except:
                    pass
                
                # Copy image
                img_dst = OUTPUT_PATH / split / "images" / img_src.name
                shutil.copy2(img_src, img_dst)
                
                # Copy and remap label
                label_dst = OUTPUT_PATH / split / "labels" / label_src.name
                copy_and_remap_labels(label_src, label_dst, dataset_name, {}, unified_mapping)
                
                merge_stats[split]["images"] += 1
                merge_stats[split]["labels"] += 1
            
            if images:
                print(f"    {split.upper()}: {len(images)} images copied")
    
    # Verify integrity
    print("\n✅ VERIFICATION...")
    total_images = 0
    for split in ["train", "val", "test"]:
        images_count = len(list((OUTPUT_PATH / split / "images").iterdir()))
        labels_count = len(list((OUTPUT_PATH / split / "labels").iterdir()))
        
        if images_count != labels_count:
            print(f"  ⚠️  {split.upper()}: Image/label mismatch! {images_count} vs {labels_count}")
        else:
            print(f"  ✓ {split.upper()}: {images_count} images, {labels_count} labels")
            total_images += images_count
    
    # Save statistics
    stats = {
        "total_images": total_images,
        "total_classes": total_classes,
        "duplicates_removed": duplicates_found,
        "splits": dict(merge_stats),
        "dataset_sources": list(datasets_info.keys()),
        "timestamp": time.time(),
    }
    
    with open(OUTPUT_PATH / "merge_stats.json", 'w') as f:
        json.dump(stats, f, indent=2)
    
    # Save class mapping
    class_mapping = {}
    for (dataset, old_id), new_id in sorted(unified_mapping.items(), key=lambda x: x[1]):
        if f"class_{new_id}" not in class_mapping:
            class_mapping[f"class_{new_id}"] = {
                "unified_id": new_id,
                "sources": []
            }
        class_mapping[f"class_{new_id}"]["sources"].append({
            "dataset": dataset,
            "original_id": old_id
        })
    
    with open(OUTPUT_PATH / "CLASS_MAPPING.json", 'w') as f:
        json.dump(class_mapping, f, indent=2)
    
    print("\n" + "=" * 80)
    print("✅ MERGE COMPLETE!")
    print("=" * 80)
    print(f"\n📊 RESULTS:")
    print(f"  Total images: {total_images}")
    print(f"  Total classes: {total_classes}")
    print(f"  Duplicates removed: {duplicates_found}")
    print(f"  Output directory: {OUTPUT_PATH}")
    print(f"  Stats saved to: {OUTPUT_PATH / 'merge_stats.json'}")
    print(f"  Class mapping saved to: {OUTPUT_PATH / 'CLASS_MAPPING.json'}")

if __name__ == "__main__":
    merge_datasets()
