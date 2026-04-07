#!/usr/bin/env python3
"""
TRAINING MONITOR
Tracks and displays YOLOv8 training progress
"""

import json
import time
from pathlib import Path
import os

def monitor_training():
    """Monitor training progress"""
    
    models_dir = Path(r"c:\Synthra\models\circuit_detection_yolov8s")
    
    if not models_dir.exists():
        print("Training directory not found yet. Training may not have started.")
        return
    
    print("\n" + "=" * 80)
    print("📊 TRAINING MONITOR - CIRCUIT DETECTION YOLOV8S")
    print("=" * 80)
    
    while True:
        print(f"\n[{time.strftime('%H:%M:%S')}] Status Check:")
        
        # Check for training files
        weights_dir = models_dir / "weights"
        results_file = models_dir / "results.csv"
        args_file = models_dir / "args.yaml"
        
        # Count epochs trained
        if weights_dir.exists():
            last_pt = weights_dir / "last.pt"
            best_pt = weights_dir / "best.pt"
            
            if last_pt.exists():
                size_mb = last_pt.stat().st_size / 1024 / 1024
                print(f"  ✓ Last checkpoint: {size_mb:.1f} MB")
            
            if best_pt.exists():
                size_mb = best_pt.stat().st_size / 1024 / 1024
                print(f"  ✓ Best checkpoint: {size_mb:.1f} MB")
        
        # Check training results
        if results_file.exists():
            with open(results_file, 'r') as f:
                lines = f.readlines()
            
            recent_lines = lines[-3:] if len(lines) > 3 else lines
            
            print(f"  ✓ Training in progress: {len(lines)} epochs completed")
            
            if len(recent_lines) > 0:
                last_line = recent_lines[-1].strip()
                print(f"  Last result: {last_line[:80]}...")
        else:
            print(f"  Training initializing...")
        
        # Show disk usage
        total_size = 0
        for root, dirs, files in os.walk(models_dir):
            for file in files:
                total_size += os.path.getsize(os.path.join(root, file))
        
        size_gb = total_size / 1024 / 1024 / 1024
        print(f"  ✓ Total size: {size_gb:.2f} GB")
        
        # Check config
        if args_file.exists():
            with open(args_file, 'r') as f:
                print(f"  ✓ Config saved")
        
        print(f"\nNext check in 10 seconds (press Ctrl+C to exit)")
        try:
            time.sleep(10)
        except KeyboardInterrupt:
            print("\n\nMonitoring stopped.")
            break

if __name__ == "__main__":
    monitor_training()
