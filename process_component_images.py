#!/usr/bin/env python3
"""
SCRIPT 2: COMPONENT IMAGE PROCESSOR
Converts categorized component images to YOLO format
Input: components/images/ with category folders
Output: YOLO-formatted images + labels (full-image bbox per component)
"""

import os
import json
import shutil
from pathlib import Path
from collections import defaultdict
import hashlib
import time

BASE_COMPONENTS_PATH = Path(r"c:\Synthra\Datasets\components\images")
OUTPUT_PATH = Path(r"c:\Synthra\training_data\components")

def get_file_hash(filepath):
    """Compute MD5 hash of file"""
    hash_md5 = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def process_components():
    """Main component processing function"""
    print("\n" + "=" * 80)
    print("🚀 PROCESSING COMPONENT IMAGES")
    print("=" * 80)
    
    # Get all category directories (skip nested 'images' folder)
    categories = []
    for item in sorted(BASE_COMPONENTS_PATH.iterdir()):
        if item.is_dir() and item.name != "images":
            categories.append(item)
    
    print(f"\n📂 Found {len(categories)} component categories")
    
    # Create output directories
    OUTPUT_PATH.mkdir(parents=True, exist_ok=True)
    for split in ["train", "val", "test"]:
        (OUTPUT_PATH / split / "images").mkdir(parents=True, exist_ok=True)
        (OUTPUT_PATH / split / "labels").mkdir(parents=True, exist_ok=True)
    
    # Create class mapping (category name -> class ID)
    class_mapping = {}
    for idx, category_dir in enumerate(sorted(categories), start=89):  # Start after merged YOLO classes (0-88)
        class_mapping[category_dir.name] = idx
    
    print(f"\n📋 CLASS MAPPING ({len(class_mapping)} components):")
    for name, class_id in sorted(class_mapping.items()):
        print(f"  {name:35s} → class {class_id:3d}")
    
    # Process all images
    print(f"\n📥 PROCESSING IMAGES...")
    seen_images = {}  # Hash-based duplicate detection
    duplicates_found = 0
    total_images = 0
    stats = defaultdict(int)
    
    # Collect all images
    image_list = []
    for category_dir in sorted(categories):
        class_id = class_mapping[category_dir.name]
        
        # Find all images in category (recursively to handle any nested structure)
        for img_path in category_dir.rglob("*"):
            if img_path.suffix.lower() in [".jpg", ".png", ".jpeg"]:
                image_list.append((img_path, category_dir.name, class_id))
    
    print(f"  Total images to process: {len(image_list)}")
    
    # Check for nested images/images structure
    nested_images_path = BASE_COMPONENTS_PATH / "images"
    if nested_images_path.exists():
        print(f"\n⚠️  Found nested images/ directory, analyzing...")
        nested_count = len(list(nested_images_path.rglob("*.jpg"))) + len(list(nested_images_path.rglob("*.png")))
        print(f"   Contains {nested_count} additional images (checking for duplicates)")
    
    # Split ratio: 70% train, 15% val, 15% test
    total_to_process = len(image_list)
    train_count = int(total_to_process * 0.7)
    val_count = int(total_to_process * 0.15)
    
    # Process images
    for idx, (img_src, category_name, class_id) in enumerate(image_list):
        if (idx + 1) % 2000 == 0:
            print(f"  Processing {idx + 1}/{total_to_process}...")
        
        # Check for duplicates
        try:
            img_hash = get_file_hash(img_src)
            if img_hash in seen_images:
                duplicates_found += 1
                continue
            seen_images[img_hash] = str(img_src)
        except:
            pass
        
        # Determine split
        if idx < train_count:
            split = "train"
        elif idx < train_count + val_count:
            split = "val"
        else:
            split = "test"
        
        # Copy image
        img_dst = OUTPUT_PATH / split / "images" / img_src.name
        shutil.copy2(img_src, img_dst)
        
        # Generate YOLO label (full-image bounding box)
        # Class ID with center at (0.5, 0.5) and full width/height (1.0, 1.0)
        label_content = f"{class_id} 0.5 0.5 1.0 1.0\n"
        label_dst = OUTPUT_PATH / split / "labels" / (img_src.stem + ".txt")
        with open(label_dst, 'w') as f:
            f.write(label_content)
        
        stats[split] += 1
        total_images += 1
    
    # Verify integrity
    print(f"\n✅ VERIFICATION...")
    for split in ["train", "val", "test"]:
        images_count = len(list((OUTPUT_PATH / split / "images").iterdir()))
        labels_count = len(list((OUTPUT_PATH / split / "labels").iterdir()))
        
        if images_count != labels_count:
            print(f"  ⚠️  {split.upper()}: Image/label mismatch! {images_count} vs {labels_count}")
        else:
            print(f"  ✓ {split.upper()}: {images_count} images, {labels_count} labels")
    
    # Save statistics
    processing_stats = {
        "total_images_processed": total_images,
        "total_categories": len(class_mapping),
        "duplicates_removed": duplicates_found,
        "splits": dict(stats),
        "timestamp": time.time(),
    }
    
    with open(OUTPUT_PATH / "processing_stats.json", 'w') as f:
        json.dump(processing_stats, f, indent=2)
    
    # Save class mapping
    with open(OUTPUT_PATH / "COMPONENT_CLASS_MAPPING.json", 'w') as f:
        json.dump(class_mapping, f, indent=2)
    
    print("\n" + "=" * 80)
    print("✅ COMPONENT PROCESSING COMPLETE!")
    print("=" * 80)
    print(f"\n📊 RESULTS:")
    print(f"  Total images: {total_images}")
    print(f"  Total categories: {len(class_mapping)}")
    print(f"  Class IDs: 89-{88 + len(class_mapping)}")
    print(f"  Duplicates removed: {duplicates_found}")
    print(f"  Output directory: {OUTPUT_PATH}")
    print(f"  Stats saved to: {OUTPUT_PATH / 'processing_stats.json'}")

if __name__ == "__main__":
    process_components()
