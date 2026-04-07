"""
Dataset Verification Script
Validates dataset structure before uploading to Kaggle

Usage:
    python verify_dataset.py --dataset-path ./training_data/unified
"""

import os
import sys
import argparse
from pathlib import Path
from PIL import Image
import json
from collections import defaultdict


class DatasetValidator:
    """Verify dataset integrity for Kaggle training."""
    
    def __init__(self, dataset_path):
        self.dataset_path = Path(dataset_path)
        self.images_dir = self.dataset_path / "images"
        self.labels_dir = self.dataset_path / "labels"
        self.issues = []
        self.warnings = []
        self.stats = {
            "total_images": 0,
            "total_labels": 0,
            "matched_pairs": 0,
            "orphan_images": 0,
            "orphan_labels": 0,
            "invalid_labels": 0,
            "invalid_images": 0,
            "image_formats": defaultdict(int),
            "class_ids": set(),
            "total_classes": 0
        }
    
    def validate(self):
        """Run all validation checks."""
        print("=" * 70)
        print("DATASET VALIDATION FOR KAGGLE")
        print("=" * 70)
        
        # Check directory structure
        print("\n[1/5] Checking directory structure...")
        self._check_directories()
        
        # Count files
        print("[2/5] Scanning files...")
        self._scan_files()
        
        # Validate images
        print("[3/5] Validating images...")
        self._validate_images()
        
        # Validate labels
        print("[4/5] Validating labels...")
        self._validate_labels()
        
        # Generate report
        print("[5/5] Generating report...")
        self._generate_report()
    
    def _check_directories(self):
        """Check if required directories exist."""
        if not self.dataset_path.exists():
            self.issues.append(f"Dataset path not found: {self.dataset_path}")
            return
        
        if not self.images_dir.exists():
            self.issues.append(f"Images directory not found: {self.images_dir}")
        else:
            print(f"  ✓ Images directory exists")
        
        if not self.labels_dir.exists():
            self.issues.append(f"Labels directory not found: {self.labels_dir}")
        else:
            print(f"  ✓ Labels directory exists")
    
    def _scan_files(self):
        """Count and categorize files."""
        # Image files
        image_extensions = {".jpg", ".jpeg", ".png", ".gif", ".bmp"}
        self.images = [
            f for f in self.images_dir.glob("*")
            if f.is_file() and f.suffix.lower() in image_extensions
        ]
        self.stats["total_images"] = len(self.images)
        
        # Label files
        self.labels = [
            f for f in self.labels_dir.glob("*.txt")
            if f.is_file()
        ]
        self.stats["total_labels"] = len(self.labels)
        
        print(f"  ✓ Found {len(self.images)} images")
        print(f"  ✓ Found {len(self.labels)} label files")
    
    def _validate_images(self):
        """Validate all images."""
        print(f"  Checking {len(self.images)} images...")
        
        for img_path in self.images:
            # Check if image can be opened
            try:
                with Image.open(img_path) as img:
                    self.stats["image_formats"][img.format] += 1
                    
                    # Check minimum size
                    if img.size[0] < 50 or img.size[1] < 50:
                        self.warnings.append(
                            f"Very small image: {img_path.name} ({img.size})"
                        )
            
            except Exception as e:
                self.stats["invalid_images"] += 1
                self.issues.append(f"Cannot open image {img_path.name}: {e}")
            
            # Check for matching label
            label_path = self.labels_dir / (img_path.stem + ".txt")
            if label_path.exists():
                self.stats["matched_pairs"] += 1
            else:
                self.stats["orphan_images"] += 1
                self.warnings.append(f"No label for: {img_path.name}")
        
        if self.stats["invalid_images"] > 0:
            print(f"  ⚠ {self.stats['invalid_images']} invalid images")
        else:
            print(f"  ✓ All images valid")
    
    def _validate_labels(self):
        """Validate all label files."""
        print(f"  Checking {len(self.labels)} labels...")
        
        for label_path in self.labels:
            img_path = None
            for ext in [".jpg", ".jpeg", ".png", ".gif", ".bmp"]:
                candidate = self.images_dir / (label_path.stem + ext)
                if candidate.exists():
                    img_path = candidate
                    break
            
            if not img_path:
                self.stats["orphan_labels"] += 1
                self.warnings.append(f"No image for label: {label_path.name}")
                continue
            
            # Validate label format
            try:
                with open(label_path, "r") as f:
                    lines = f.readlines()
                    if not lines:
                        self.warnings.append(f"Empty label: {label_path.name}")
                        continue
                    
                    for line_num, line in enumerate(lines, 1):
                        parts = line.strip().split()
                        
                        if len(parts) < 1:
                            self.stats["invalid_labels"] += 1
                            self.issues.append(
                                f"Invalid format in {label_path.name}:{line_num} - empty line"
                            )
                            continue
                        
                        try:
                            class_id = int(parts[0])
                            self.stats["class_ids"].add(class_id)
                            
                            # For YOLO format, check 4 more values
                            if len(parts) >= 5:
                                x, y, w, h = map(float, parts[1:5])
                                if not (0 <= x <= 1 and 0 <= y <= 1 and 
                                       0 <= w <= 1 and 0 <= h <= 1):
                                    self.warnings.append(
                                        f"Out-of-range coords in {label_path.name}:{line_num}"
                                    )
                        
                        except (ValueError, IndexError) as e:
                            self.stats["invalid_labels"] += 1
                            self.issues.append(
                                f"Cannot parse {label_path.name}:{line_num} - {e}"
                            )
            
            except Exception as e:
                self.stats["invalid_labels"] += 1
                self.issues.append(f"Error reading {label_path.name}: {e}")
        
        self.stats["total_classes"] = len(self.stats["class_ids"])
        
        if self.stats["invalid_labels"] > 0:
            print(f"  ⚠ {self.stats['invalid_labels']} invalid labels")
        else:
            print(f"  ✓ All labels valid")
    
    def _generate_report(self):
        """Print validation report."""
        print("\n" + "=" * 70)
        print("VALIDATION REPORT")
        print("=" * 70)
        
        # Summary
        print(f"\n📊 SUMMARY")
        print(f"  Total Images: {self.stats['total_images']}")
        print(f"  Total Labels: {self.stats['total_labels']}")
        print(f"  Matched Pairs: {self.stats['matched_pairs']}")
        print(f"  Orphan Images: {self.stats['orphan_images']}")
        print(f"  Orphan Labels: {self.stats['orphan_labels']}")
        print(f"  Invalid Images: {self.stats['invalid_images']}")
        print(f"  Invalid Labels: {self.stats['invalid_labels']}")
        print(f"  Unique Classes: {self.stats['total_classes']}")
        print(f"  Class IDs: {sorted(self.stats['class_ids'])}")
        
        # Image formats
        if self.stats["image_formats"]:
            print(f"\n📷 IMAGE FORMATS")
            for fmt, count in sorted(self.stats["image_formats"].items()):
                print(f"  {fmt}: {count}")
        
        # Issues
        if self.issues:
            print(f"\n❌ CRITICAL ISSUES ({len(self.issues)})")
            for issue in self.issues[:10]:  # Show first 10
                print(f"  - {issue}")
            if len(self.issues) > 10:
                print(f"  ... and {len(self.issues) - 10} more")
        
        # Warnings
        if self.warnings:
            print(f"\n⚠️  WARNINGS ({len(self.warnings)})")
            for warning in self.warnings[:10]:  # Show first 10
                print(f"  - {warning}")
            if len(self.warnings) > 10:
                print(f"  ... and {len(self.warnings) - 10} more")
        
        # Ready for Kaggle?
        print(f"\n" + "=" * 70)
        if not self.issues and self.stats["matched_pairs"] > 0:
            print("✅ READY FOR KAGGLE!")
            print(f"   Upload {self.stats['matched_pairs']} image-label pairs")
            
            # Estimate
            avg_size_mb = 2  # Average image size
            total_size_gb = (self.stats["matched_pairs"] * avg_size_mb) / 1024
            print(f"   Estimated size: ~{total_size_gb:.1f} GB")
        else:
            print("❌ NOT READY FOR KAGGLE")
            print(f"   Fix {len(self.issues)} critical issues first")
        
        print("=" * 70)
        
        return len(self.issues) == 0
    
    def get_stats(self):
        """Return statistics as dictionary."""
        return {
            "images": self.stats["total_images"],
            "labels": self.stats["total_labels"],
            "matched_pairs": self.stats["matched_pairs"],
            "classes": self.stats["total_classes"],
            "issues": len(self.issues),
            "warnings": len(self.warnings),
            "valid": len(self.issues) == 0
        }


def main():
    parser = argparse.ArgumentParser(description="Validate dataset for Kaggle training")
    parser.add_argument("--dataset-path", required=True, help="Path to dataset directory")
    parser.add_argument("--json", action="store_true", help="Output stats as JSON")
    args = parser.parse_args()
    
    validator = DatasetValidator(args.dataset_path)
    validator.validate()
    
    if args.json:
        print("\n" + json.dumps(validator.get_stats(), indent=2))
    
    # Exit code
    sys.exit(0 if len(validator.issues) == 0 else 1)


if __name__ == "__main__":
    main()
