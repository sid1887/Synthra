#!/usr/bin/env python3
"""
YOLOV8 TRAINING SCRIPT - SIMPLIFIED
Trains YOLOv8 Small on unified circuit detection dataset
CPU-optimized with checkpointing
"""

import os
import json
from pathlib import Path
import time
import sys

# Import required packages (should be pre-installed)
try:
    import torch
    from ultralytics import YOLO
except ImportError as e:
    print(f"Error: Required package not installed: {e}")
    print("Please run: pip install torch torchvision ultralytics")
    sys.exit(1)

print("=" * 80)
print("🚀 YOLOV8 TRAINING - CIRCUITS DETECTION")
print("=" * 80)

print(f"\nPyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"Device: {'GPU' if torch.cuda.is_available() else 'CPU'}")

# Setup paths
DATASET_DIR = Path(r"c:\Synthra\training_data\unified")
DATA_YAML = DATASET_DIR / "data.yaml"
OUTPUT_DIR = Path(r"c:\Synthra\models")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print(f"\nDataset: {DATASET_DIR}")
print(f"Output: {OUTPUT_DIR}")

# Verify dataset
if not DATA_YAML.exists():
    print(f"Error: {DATA_YAML} not found!")
    sys.exit(1)

print("\n✓ Dataset verified!")

# Determine device
device = 0 if torch.cuda.is_available() else "cpu"

print("\n" + "=" * 80)
print("📋 TRAINING CONFIGURATION")
print("=" * 80)

config = {
    "model": "yolov8s",
    "epochs": 50,
    "imgsz": 416,
    "batch": 4,
    "device": device,
    "workers": 0,
    "optimizer": "SGD",
    "lr0": 0.01,
    "momentum": 0.937,
}

print(f"\nModel: {config['model']}")
print(f"Epochs: {config['epochs']}")
print(f"Batch size: {config['batch']}")
print(f"Image size: {config['imgsz']}")
print(f"Device: {device}")
print(f"Learning rate: {config['lr0']}")

# Save config
with open(OUTPUT_DIR / "config.json", 'w') as f:
    json.dump(config, f, indent=2)

print("\n" + "=" * 80)
print("🔥 LOADING MODEL")
print("=" * 80)

try:
    model = YOLO(f"{config['model']}.pt")
    print(f"\n✓ Model loaded successfully!")
    print(f"  Model size params: {sum(p.numel() for p in model.model.parameters()):,}")
except Exception as e:
    print(f"\n✗ Error loading model: {e}")
    sys.exit(1)

print("\n" + "=" * 80)
print("🎯 STARTING TRAINING")
print("=" * 80)
print(f"\nStarted: {time.strftime('%Y-%m-%d %H:%M:%S')}")
print("Training will run for 50 epochs...")
print("Checkpoints saved every epoch")

try:
    # Train the model
    results = model.train(
        data=str(DATA_YAML),
        epochs=config['epochs'],
        imgsz=config['imgsz'],
        batch=config['batch'],
        device=device,
        workers=config['workers'],
        patience=20,
        optimizer=config['optimizer'],
        lr0=config['lr0'],
        momentum=config['momentum'],
        weight_decay=0.0005,
        warmup_epochs=3,
        warmup_momentum=0.8,
        warmup_bias_lr=0.1,
        box=7.5,
        cls=0.5,
        dfl=1.5,
        mosaic=1.0,
        mixup=0.1,
        fliplr=0.5,
        flipud=0.5,
        degrees=10,
        translate=0.1,
        scale=0.5,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        save=True,
        save_period=1,
        project=str(OUTPUT_DIR),
        name="circuit_detection_yolov8s",
        exist_ok=True,
        verbose=True,
        seed=42,
    )
    
    print("\n" + "=" * 80)
    print("✅ TRAINING COMPLETED!")
    print("=" * 80)
    
    best_model_path = OUTPUT_DIR / "circuit_detection_yolov8s" / "weights" / "best.pt"
    print(f"\nBest model: {best_model_path}")
    print(f"Last model: {OUTPUT_DIR / 'circuit_detection_yolov8s' / 'weights' / 'last.pt'}")
    
    if best_model_path.exists():
        print(f"✓ Model size: {best_model_path.stat().st_size / 1024 / 1024:.1f} MB")
    
    print("\n" + "=" * 80)
    
except KeyboardInterrupt:
    print("\n⚠️  Training interrupted by user")
except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Setup paths
DATASET_DIR = Path(r"c:\Synthra\training_data\unified")
DATA_YAML = DATASET_DIR / "data.yaml"
OUTPUT_DIR = Path(r"c:\Synthra\models")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print("\n" + "=" * 80)
print("🎯 TRAINING CONFIGURATION")
print("=" * 80)

print(f"\nDataset: {DATASET_DIR}")
print(f"Data YAML: {DATA_YAML}")
print(f"Output: {OUTPUT_DIR}")

# Verify dataset
if not DATA_YAML.exists():
    print(f"✗ Data YAML not found: {DATA_YAML}")
    print("  Run scripts 1-4 first to prepare dataset!")
    sys.exit(1)

print(f"✓ Dataset ready!")

# Training configuration (CPU-optimized)
config = {
    "model": "yolov8s",  # Small model for CPU
    "data": str(DATA_YAML),
    "epochs": 50,  # Start with 50, can extend
    "imgsz": 416,  # Input image size
    "batch": 4,  # Small batch for 16GB RAM
    "device": 0 if torch.cuda.is_available() else "cpu",  # GPU if available, else CPU
    "workers": 0,  # Disable workers for CPU
    "patience": 20,  # Early stopping patience
    "save": True,
    "save_period": 1,  # Save every epoch
    "optimizer": "SGD",
    "lr0": 0.01,
    "lrf": 0.01,
    "momentum": 0.937,
    "weight_decay": 0.0005,
    "warmup_epochs": 3.0,
    "warmup_momentum": 0.8,
    "warmup_bias_lr": 0.1,
    "box": 7.5,
    "cls": 0.5,
    "dfl": 1.5,
    "fl_gamma": 0.0,
    "label_smoothing": 0.0,
    "nbs": 64,  # Nominal batch size
    
    # Augmentation (aggressive for small dataset)
    "augment": True,
    "mosaic": 1.0,
    "mixup": 0.1,
    "fliplr": 0.5,
    "flipud": 0.5,
    "degrees": 10,
    "translate": 0.1,
    "scale": 0.5,
    "hsv_h": 0.015,
    "hsv_s": 0.7,
    "hsv_v": 0.4,
    "perspective": 0.0,
    "flipud": 0.5,
    "copy_paste": 0.0,
    
    # Validation
    "val": True,
    "split": 0.1,
    "plots": False,  # Disable plots to save memory
    "verbose": True,
    "seed": 42,
}

print(f"\n📋 Training parameters:")
print(f"  Model: {config['model']}")
print(f"  Device: {'GPU' if torch.cuda.is_available() else 'CPU'}")
print(f"  Epochs: {config['epochs']}")
print(f"  Batch size: {config['batch']}")
print(f"  Image size: {config['imgsz']}")
print(f"  Learning rate: {config['lr0']}")
print(f"  Optimizer: {config['optimizer']}")

# Save configuration
config_file = OUTPUT_DIR / "training_config.json"
with open(config_file, 'w') as f:
    json.dump(config, f, indent=2)

print(f"\n✓ Configuration saved to: {config_file}")

# Start training
print("\n" + "=" * 80)
print("🔥 STARTING MODEL TRAINING")
print("=" * 80)

print(f"\nLoading YOLOv8 {config['model']} model...")
model = YOLO(f"{config['model']}.pt")

print(f"Model loaded! Features:")
print(f"  Parameters: {sum(p.numel() for p in model.model.parameters()):,}")

print(f"\nStarting training with the following:")
print(f"  Data: {config['data']}")
print(f"  Epochs: {config['epochs']}")
print(f"  Batch: {config['batch']}")
print(f"  Workers: {config['workers']}")
print(f"  Device: {config['device']}")

# Training parameters
training_params = {
    k: v for k, v in config.items() 
    if k not in ['model', 'data', 'device', 'workers']
}

# Add paths
training_params['project'] = str(OUTPUT_DIR)
training_params['name'] = 'training_run'
training_params['exist_ok'] = True

print(f"\nTraining started at {time.strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 80)

try:
    # Train with CPU optimization
    results = model.train(
        data=config['data'],
        epochs=config['epochs'],
        imgsz=config['imgsz'],
        batch=config['batch'],
        device=config['device'],
        workers=config['workers'],
        patience=config['patience'],
        optimizer=config['optimizer'],
        lr0=config['lr0'],
        lrf=config['lrf'],
        momentum=config['momentum'],
        weight_decay=config['weight_decay'],
        warmup_epochs=3,
        warmup_momentum=0.8,
        warmup_bias_lr=0.1,
        box=7.5,
        cls=0.5,
        dfl=1.5,
        mosaic=1.0,
        mixup=0.1,
        fliplr=0.5,
        flipud=0.5,
        degrees=10,
        translate=0.1,
        scale=0.5,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        save=True,
        save_period=1,
        project=str(OUTPUT_DIR),
        name='training_run',
        exist_ok=True,
        verbose=True,
        seed=42,
    )
    
    print("\n" + "=" * 80)
    print("✅ TRAINING COMPLETED SUCCESSFULLY!")
    print("=" * 80)
    
    print(f"\nResults:")
    print(f"  Best mAP@0.5: {results.box.map50 if hasattr(results, 'box') else 'N/A'}")
    print(f"  Final epoch: {config['epochs']}")
    
    # Save final results
    final_results = {
        "status": "completed",
        "completed_at": time.strftime('%Y-%m-%d %H:%M:%S'),
        "epochs": config['epochs'],
        "best_model": str(OUTPUT_DIR / "training_run" / "weights" / "best.pt"),
        "last_model": str(OUTPUT_DIR / "training_run" / "weights" / "last.pt"),
    }
    
    with open(OUTPUT_DIR / "training_results.json", 'w') as f:
        json.dump(final_results, f, indent=2)
    
    print(f"\n✓ Best model saved to: {OUTPUT_DIR / 'training_run' / 'weights' / 'best.pt'}")
    print(f"✓ Training results saved to: {OUTPUT_DIR / 'training_results.json'}")
    
except KeyboardInterrupt:
    print("\n\n⚠️  Training interrupted by user")
    print("  Checkpoint saved - can resume training later")
except Exception as e:
    print(f"\n✗ Training Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 80)
print("🎯 NEXT STEPS:")
print("  1. Monitor training progress in: " + str(OUTPUT_DIR / "training_run"))
print("  2. Best model: " + str(OUTPUT_DIR / "training_run" / "weights" / "best.pt"))
print("  3. Export model for inference")
print("=" * 80)
