#!/usr/bin/env python3
"""
DEEP INSPECTION OF DATASET FORMATS AND STRUCTURES
==================================================
Examines:
1. YOLOv8 label formats (class IDs, bbox coordinates)
2. 3D model metadata (TXT files)
3. Component image directory structure
4. Archive contents
"""

import os
import json
from pathlib import Path
from collections import defaultdict

def inspect_yolov8_labels():
    """Inspect YOLOv8 label format and class structure"""
    print("=" * 80)
    print("YOLOV8 LABEL FORMAT INSPECTION")
    print("=" * 80)
    
    datasets = [
        ("circuit elements", r"c:\Synthra\Datasets\circuit elements.yolov8"),
        ("Circuit Schematic Detection", r"c:\Synthra\Datasets\Circuit Schematic Detection.yolov8"),
        ("Electronic Components", r"c:\Synthra\Datasets\Electronic Components.yolov8")
    ]
    
    for name, path in datasets:
        print(f"\n📋 {name}")
        labels_dir = Path(path) / "train" / "labels"
        
        if not labels_dir.exists():
            continue
        
        # Read first label file to understand format
        label_files = list(labels_dir.glob("*.txt"))
        if label_files:
            sample_file = label_files[0]
            print(f"   Sample label file: {sample_file.name}")
            
            with open(sample_file, 'r') as f:
                content = f.read()
                lines = content.strip().split('\n')
                print(f"   Lines in file: {len(lines)}")
                print(f"   First 3 lines (format):")
                for i, line in enumerate(lines[:3]):
                    print(f"      {i+1}: {line}")
            
            # Analyze all classes
            class_counts = defaultdict(int)
            total_objects = 0
            
            for label_file in label_files:
                try:
                    with open(label_file, 'r') as f:
                        for line in f:
                            parts = line.strip().split()
                            if parts:
                                class_id = parts[0]
                                class_counts[class_id] += 1
                                total_objects += 1
                except:
                    pass
            
            print(f"   Classes: {sorted(class_counts.keys())}")
            print(f"   Total objects: {total_objects}")
            print(f"   Avg objects per image: {total_objects / len(label_files):.2f}")

def inspect_3d_metadata():
    """Inspect 3D model metadata"""
    print("\n\n" + "=" * 80)
    print("3D MODEL METADATA INSPECTION")
    print("=" * 80)
    
    dataverse_path = Path(r"c:\Synthra\Datasets\dataverse_files")
    
    # Check TXT metadata files
    txt_files = list(dataverse_path.rglob("*.txt"))
    
    if txt_files:
        print(f"\nFound {len(txt_files)} TXT metadata files")
        sample_txt = txt_files[0]
        print(f"   Sample TXT file: {sample_txt.relative_to(dataverse_path)}")
        
        with open(sample_txt, 'r') as f:
            content = f.read()
            print(f"   Content preview:")
            for line in content.split('\n')[:10]:
                if line.strip():
                    print(f"      {line}")
    
    # Check 3D formats
    print(f"\n3D Model Formats:")
    for fmt in ['obj', 'stl', 'off']:
        files = list(dataverse_path.rglob(f"*.{fmt}"))
        if files:
            sample_file = files[0]
            print(f"\n   {fmt.upper()}: {len(files)} files")
            print(f"   Sample: {sample_file.relative_to(dataverse_path)}")
            
            # Show file size and first few lines
            size_kb = sample_file.stat().st_size / 1024
            print(f"   Size: {size_kb:.1f} KB")
            
            if fmt == 'obj':
                with open(sample_file, 'r', errors='ignore') as f:
                    lines = f.readlines()
                    print(f"   Lines: {len(lines)}")
                    print("   Preview:")
                    for line in lines[:5]:
                        print(f"      {line.rstrip()}")

def inspect_component_images():
    """Inspect component image structure"""
    print("\n\n" + "=" * 80)
    print("COMPONENT IMAGE STRUCTURE INSPECTION")
    print("=" * 80)
    
    components_path = Path(r"c:\Synthra\Datasets\components")
    images_path = components_path / "images"
    
    if not images_path.exists():
        print("   Components path not found")
        return
    
    print(f"\nComponent categories:")
    
    for category_dir in sorted(images_path.iterdir()):
        if not category_dir.is_dir():
            continue
        
        # Check for nested structure
        all_items = list(category_dir.iterdir())
        subdirs = [d for d in all_items if d.is_dir()]
        files = [f for f in all_items if f.is_file()]
        
        print(f"\n   📁 {category_dir.name}")
        print(f"      Direct files: {len(files)}")
        print(f"      Subdirectories: {len(subdirs)}")
        
        if subdirs:
            print(f"      Subdirs: {[d.name for d in subdirs[:5]]}")
            
            # Count files in subdirs
            total_in_subdirs = 0
            for subdir in subdirs:
                total_in_subdirs += len(list(subdir.glob("*.*")))
            print(f"      Files in subdirs: {total_in_subdirs}")
        
        # Show file formats
        all_img_files = list(category_dir.rglob("*.jpg")) + list(category_dir.rglob("*.png")) + list(category_dir.rglob("*.jpeg"))
        if all_img_files:
            sample = all_img_files[0]
            print(f"      Sample: {sample.name} ({sample.stat().st_size / 1024:.1f} KB)")

def inspect_archives():
    """Inspect archive contents"""
    print("\n\n" + "=" * 80)
    print("ARCHIVE CONTENTS INSPECTION")
    print("=" * 80)
    
    archives = [
        r"c:\Synthra\Datasets\archive (1)",
        r"c:\Synthra\Datasets\archive (2)"
    ]
    
    for archive_path in archives:
        archive_p = Path(archive_path)
        if not archive_p.exists():
            continue
        
        print(f"\n📦 {archive_p.name}")
        
        all_files = list(archive_p.rglob("*"))
        
        # Categorize by type
        dirs = [f for f in all_files if f.is_dir()]
        files = [f for f in all_files if f.is_file()]
        
        print(f"   Total items: {len(all_files)}")
        print(f"   Directories: {len(dirs)}")
        print(f"   Files: {len(files)}")
        
        if files:
            print(f"\n   File types:")
            file_types = defaultdict(int)
            for f in files:
                ext = f.suffix.lower() if f.suffix else "no_ext"
                file_types[ext] += 1
            
            for ext, count in sorted(file_types.items(), key=lambda x: -x[1]):
                print(f"      {ext}: {count}")
            
            # Show structure
            print(f"\n   Directory structure (top level):")
            if dirs:
                top_dirs = sorted(dirs)[:10]
                for d in top_dirs:
                    subfiles = len(list(d.rglob("*")))
                    print(f"      {d.relative_to(archive_p)}: {subfiles} items")
            
            print(f"\n   Sample files:")
            for f in sorted(files)[:5]:
                print(f"      {f.relative_to(archive_p)} ({f.stat().st_size / 1024:.1f} KB)")

def main():
    inspect_yolov8_labels()
    inspect_3d_metadata()
    inspect_component_images()
    inspect_archives()
    
    print("\n\n" + "=" * 80)
    print("✅ DEEP INSPECTION COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    main()
