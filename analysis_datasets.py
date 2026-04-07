#!/usr/bin/env python3
"""
COMPREHENSIVE DATASET ANALYSIS FOR SYNTHRA ML TRAINING
========================================================
Analyzes all available datasets:
- YOLOv8 formatted datasets (3 sources)
- 3D model data (OBJ, STL, OFF formats)
- Component category images
- Archive contents (pending extraction)
"""

import os
import json
from pathlib import Path
from collections import defaultdict
import statistics

BASE_DATASET_PATH = r"c:\Synthra\Datasets"

def analyze_yolov8_dataset(dataset_name, path):
    """Analyze YOLOv8 formatted dataset structure"""
    results = {
        'name': dataset_name,
        'path': path,
        'splits': {}
    }
    
    try:
        for split in ['train', 'val', 'test']:
            split_path = Path(path) / split
            if not split_path.exists():
                continue
            
            images_path = split_path / 'images'
            labels_path = split_path / 'labels'
            
            image_files = list(images_path.glob('*')) if images_path.exists() else []
            label_files = list(labels_path.glob('*')) if labels_path.exists() else []
            
            # Sample a label to understand class distribution
            class_counts = defaultdict(int)
            if label_files:
                for label_file in label_files[:min(100, len(label_files))]:
                    try:
                        with open(label_file, 'r') as f:
                            for line in f:
                                parts = line.strip().split()
                                if parts:
                                    class_id = parts[0]
                                    class_counts[class_id] += 1
                    except:
                        pass
            
            results['splits'][split] = {
                'images_count': len(image_files),
                'labels_count': len(label_files),
                'class_distribution_sample': dict(class_counts),
                'image_formats': list(set([f.suffix.lower() for f in image_files]))
            }
    except Exception as e:
        results['error'] = str(e)
    
    return results

def analyze_3d_models(base_path):
    """Analyze 3D model datasets"""
    results = {
        'path': base_path,
        'formats': {}
    }
    
    try:
        for split in ['train', 'val', 'test']:
            split_path = Path(base_path) / split
            if not split_path.exists():
                continue
            
            results['formats'][split] = {}
            for fmt in ['obj', 'stl', 'off', 'txt']:
                fmt_path = split_path / fmt
                if fmt_path.exists():
                    files = list(fmt_path.glob('*'))
                    results['formats'][split][fmt] = {
                        'count': len(files),
                        'sample_files': [f.name for f in files[:3]]
                    }
    except Exception as e:
        results['error'] = str(e)
    
    return results

def analyze_component_categories(base_path):
    """Analyze component image categories"""
    results = {
        'path': base_path,
        'categories': {}
    }
    
    try:
        images_path = Path(base_path) / 'images'
        if images_path.exists():
            for category_dir in images_path.iterdir():
                if category_dir.is_dir():
                    # Count files recursively
                    all_files = list(category_dir.rglob('*'))
                    image_files = [f for f in all_files if f.suffix.lower() in ['.jpg', '.png', '.jpeg']]
                    
                    results['categories'][category_dir.name] = {
                        'image_count': len(image_files),
                        'subdirs': len([d for d in category_dir.iterdir() if d.is_dir()])
                    }
    except Exception as e:
        results['error'] = str(e)
    
    return results

def get_directory_stats(path):
    """Get overall directory stats"""
    try:
        total_size = 0
        total_files = 0
        for dirpath, dirnames, filenames in os.walk(path):
            total_files += len(filenames)
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                try:
                    total_size += os.path.getsize(filepath)
                except:
                    pass
        return {
            'total_files': total_files,
            'total_size_mb': round(total_size / (1024 * 1024), 2),
            'total_size_gb': round(total_size / (1024 * 1024 * 1024), 2)
        }
    except Exception as e:
        return {'error': str(e)}

def main():
    print("=" * 80)
    print("COMPREHENSIVE DATASET ANALYSIS FOR SYNTHRA ML TRAINING")
    print("=" * 80)
    print()
    
    analysis_results = {}
    
    # 1. YOLOV8 DATASETS
    print("📊 ANALYZING YOLOV8 DATASETS...")
    print("-" * 80)
    yolov8_datasets = [
        ("circuit elements", r"c:\Synthra\Datasets\circuit elements.yolov8"),
        ("Circuit Schematic Detection", r"c:\Synthra\Datasets\Circuit Schematic Detection.yolov8"),
        ("Electronic Components", r"c:\Synthra\Datasets\Electronic Components.yolov8")
    ]
    
    total_yolo_images = 0
    for name, path in yolov8_datasets:
        if Path(path).exists():
            result = analyze_yolov8_dataset(name, path)
            analysis_results[f"yolov8_{name}"] = result
            
            print(f"\n✓ {name}")
            for split, data in result.get('splits', {}).items():
                print(f"  {split.upper()}: {data['images_count']} images, {data['labels_count']} labels")
                if data.get('class_distribution_sample'):
                    print(f"    Classes found (sample): {len(data['class_distribution_sample'])}")
                total_yolo_images += data['images_count']
        else:
            print(f"\n✗ {name} - NOT FOUND at {path}")
    
    print(f"\n📈 Total YOLOV8 images: {total_yolo_images}")
    
    # 2. 3D MODELS
    print("\n\n📊 ANALYZING 3D MODELS (Dataverse)...")
    print("-" * 80)
    dataverse_path = r"c:\Synthra\Datasets\dataverse_files"
    if Path(dataverse_path).exists():
        result_3d = analyze_3d_models(dataverse_path)
        analysis_results['3d_models'] = result_3d
        
        total_3d = 0
        for split, formats in result_3d.get('formats', {}).items():
            print(f"\n{split.upper()}:")
            for fmt, data in formats.items():
                print(f"  {fmt.upper()}: {data['count']} files")
                total_3d += data['count']
        
        print(f"\n📈 Total 3D models: {total_3d}")
    else:
        print(f"✗ Dataverse path not found: {dataverse_path}")
    
    # 3. COMPONENT CATEGORIES
    print("\n\n📊 ANALYZING COMPONENT CATEGORIES...")
    print("-" * 80)
    components_path = r"c:\Synthra\Datasets\components"
    if Path(components_path).exists():
        result_comp = analyze_component_categories(components_path)
        analysis_results['components'] = result_comp
        
        print(f"\nFound {len(result_comp['categories'])} categories:")
        total_comp_images = 0
        for category, data in sorted(result_comp['categories'].items()):
            print(f"  • {category}: {data['image_count']} images")
            total_comp_images += data['image_count']
        
        print(f"\n📈 Total component images: {total_comp_images}")
    else:
        print(f"✗ Components path not found: {components_path}")
    
    # 4. ARCHIVES
    print("\n\n📊 CHECKING ARCHIVES...")
    print("-" * 80)
    archive_paths = [
        r"c:\Synthra\Datasets\archive (1)",
        r"c:\Synthra\Datasets\archive (2)"
    ]
    for archive_path in archive_paths:
        if Path(archive_path).exists():
            stats = get_directory_stats(archive_path)
            print(f"\n✓ {Path(archive_path).name}")
            print(f"  Files: {stats.get('total_files', 'N/A')}")
            print(f"  Size: {stats.get('total_size_gb', 'N/A')} GB")
        else:
            print(f"\n✗ {Path(archive_path).name} - NOT FOUND")
    
    # 5. OVERALL STATS
    print("\n\n📊 OVERALL DATASET STATISTICS...")
    print("-" * 80)
    if Path(BASE_DATASET_PATH).exists():
        overall_stats = get_directory_stats(BASE_DATASET_PATH)
        print(f"\nTotal files in Datasets folder: {overall_stats.get('total_files', 'N/A')}")
        print(f"Total size: {overall_stats.get('total_size_gb', 'N/A')} GB")
        print(f"           ({overall_stats.get('total_size_mb', 'N/A')} MB)")
    
    # 6. SUMMARY AND RECOMMENDATIONS
    print("\n\n" + "=" * 80)
    print("SUMMARY AND RECOMMENDATIONS")
    print("=" * 80)
    
    print(f"""
AVAILABLE TRAINING DATA:
  • YOLOv8 ready-to-use images: {total_yolo_images}
  • 3D models (need 2D projection): {total_3d}
  • Component category images: {total_comp_images} (need annotation conversion)
  
TOTAL IMAGES AVAILABLE: ~{total_yolo_images + total_comp_images}

DATA SOURCES RANKED BY READINESS:
  1. ✅ YOLOv8 datasets - Ready immediately (3 sources, proper train/val/test splits)
  2. ⚠️  Component categories - Need label format conversion
  3. 🔄 3D models - Need projection to 2D + label generation

TRAINING STRATEGY:
  Phase 1: Merge 3 YOLOv8 datasets (immediate start)
  Phase 2: Process component images (convert to YOLOv8 format)
  Phase 3: Project 3D models to 2D with generated labels
  Phase 4: Combine all into single corpus
  Phase 5: Train CPU-optimized YOLOv8 small model
    - Batch size: 4-8 (16GB RAM constraint)
    - Epochs: 50-100 (can adjust based on performance)
    - Data augmentation: aggressive (rotation, scale, brightness)
    - Checkpoint every epoch (crash recovery)

HARDWARE UTILIZATION:
  • RAM: ~12-14GB for training loop + data loading
  • GPU: 2GB (optional, use if available, fallback to CPU)
  • Processing time: WEEKS (slow and steady, acceptable)
""")
    
    # Save results
    output_file = r"c:\Synthra\dataset_analysis_results.json"
    with open(output_file, 'w') as f:
        json.dump(analysis_results, f, indent=2, default=str)
    
    print(f"\n✅ Analysis complete! Results saved to: {output_file}\n")

if __name__ == "__main__":
    main()
