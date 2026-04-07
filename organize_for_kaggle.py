"""
Dataset Organizer for Kaggle
Restructures unified dataset into proper Kaggle format

Usage:
    python organize_for_kaggle.py --input ./training_data/unified --output ./kaggle_dataset

The script creates:
    kaggle_dataset/
    ├── images/
    │   ├── img_0001.jpg
    │   ├── img_0002.jpg
    │   └── ...
    └── labels/
        ├── img_0001.txt
        ├── img_0002.txt
        └── ...
"""

import os
import shutil
import argparse
from pathlib import Path
from PIL import Image
import json


def organize_dataset(input_path, output_path):
    """
    Reorganize dataset from unified format to Kaggle format.
    
    Input structure:
        unified/
        ├── images/
        │   ├── train/
        │   ├── val/
        │   └── test/
        └── labels/
            ├── train/
            ├── val/
            └── test/
    
    Output structure:
        kaggle_dataset/
        ├── images/
        └── labels/
    """
    input_path = Path(input_path)
    output_path = Path(output_path)
    
    print("=" * 70)
    print("KAGGLE DATASET ORGANIZER")
    print("=" * 70)
    
    # Create output directories
    images_out = output_path / "images"
    labels_out = output_path / "labels"
    
    images_out.mkdir(parents=True, exist_ok=True)
    labels_out.mkdir(parents=True, exist_ok=True)
    print(f"\n✓ Created output directories:")
    print(f"  {images_out}")
    print(f"  {labels_out}")
    
    # Counter
    total_copied = 0
    
    # Copy images from all splits
    splits = ["train", "val", "test"]
    image_extensions = {".jpg", ".jpeg", ".png"}
    
    print(f"\nCopying images...")
    for split in splits:
        split_dir = input_path / "images" / split
        
        if not split_dir.exists():
            print(f"  ⚠ {split} images not found: {split_dir}")
            continue
        
        images = [
            f for f in split_dir.glob("*")
            if f.suffix.lower() in image_extensions
        ]
        
        for img_path in images:
            try:
                # Copy image
                dest_path = images_out / img_path.name
                shutil.copy2(img_path, dest_path)
                total_copied += 1
                
                if total_copied % 500 == 0:
                    print(f"  Progress: {total_copied} images copied")
            
            except Exception as e:
                print(f"  ⚠ Failed to copy {img_path.name}: {e}")
    
    print(f"✓ Copied {total_copied} images")
    
    # Copy labels from all splits
    labels_copied = 0
    print(f"\nCopying labels...")
    for split in splits:
        split_dir = input_path / "labels" / split
        
        if not split_dir.exists():
            print(f"  ⚠ {split} labels not found: {split_dir}")
            continue
        
        labels = list(split_dir.glob("*.txt"))
        
        for label_path in labels:
            try:
                # Copy label
                dest_path = labels_out / label_path.name
                shutil.copy2(label_path, dest_path)
                labels_copied += 1
                
                if labels_copied % 500 == 0:
                    print(f"  Progress: {labels_copied} labels copied")
            
            except Exception as e:
                print(f"  ⚠ Failed to copy {label_path.name}: {e}")
    
    print(f"✓ Copied {labels_copied} labels")
    
    # Verify matching
    print(f"\nVerifying image-label pairs...")
    image_stems = {f.stem for f in images_out.glob("*")}
    label_stems = {f.stem for f in labels_out.glob("*.txt")}
    
    matched = len(image_stems & label_stems)
    orphan_images = len(image_stems - label_stems)
    orphan_labels = len(label_stems - image_stems)
    
    print(f"  ✓ Matched pairs: {matched}")
    print(f"  ⚠ Orphan images (no label): {orphan_images}")
    print(f"  ⚠ Orphan labels (no image): {orphan_labels}")
    
    # Summary
    print(f"\n" + "=" * 70)
    print(f"READY FOR KAGGLE")
    print(f"=" * 70)
    print(f"Output location: {output_path}")
    print(f"Images: {len(list(images_out.glob('*')))}")
    print(f"Labels: {len(list(labels_out.glob('*.txt')))}")
    print(f"Matched pairs: {matched}")
    
    if orphan_images == 0 and orphan_labels == 0:
        print(f"\n✅ Dataset is valid and ready to upload to Kaggle!")
    else:
        print(f"\n⚠️  Fix orphan files before uploading:")
        print(f"   - Remove images without labels")
        print(f"   - Remove labels without images")
    print("=" * 70)
    
    return output_path


def main():
    parser = argparse.ArgumentParser(
        description="Reorganize dataset for Kaggle upload"
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Input dataset path (unified format)"
    )
    parser.add_argument(
        "--output",
        required=True,
        help="Output dataset path (Kaggle format)"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite output directory if exists"
    )
    
    args = parser.parse_args()
    
    input_path = Path(args.input)
    output_path = Path(args.output)
    
    # Validation
    if not input_path.exists():
        print(f"❌ Input path not found: {input_path}")
        return
    
    if output_path.exists() and not args.force:
        print(f"❌ Output path already exists: {output_path}")
        print(f"   Use --force to overwrite")
        return
    
    # Run organization
    organize_dataset(input_path, output_path)


if __name__ == "__main__":
    main()
