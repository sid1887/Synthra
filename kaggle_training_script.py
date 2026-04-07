"""
Kaggle Circuit Detection Model Training
- Restart-safe with checkpoint system
- Auto-resume across sessions (12-hour limits)
- Auto GPU detection
- Modular, clean architecture
- Ready for multiple training runs

Usage in Kaggle Notebook:
1. Upload this script as .py file in notebook
2. Run cells sequentially
3. Will auto-resume from checkpoint if interrupted
"""

import os
import sys
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset, random_split
from torchvision import transforms, models
import time
from pathlib import Path
from datetime import datetime
import traceback

# ============================================================================
# CONFIGURATION & CONSTANTS
# ============================================================================

# Kaggle paths
INPUT_PATH = "/kaggle/input"  # Where dataset will be located
OUTPUT_PATH = "/kaggle/working"  # Where to save checkpoints and model
CHECKPOINT_PATH = os.path.join(OUTPUT_PATH, "checkpoint.pth")
FINAL_MODEL_PATH = os.path.join(OUTPUT_PATH, "final_model.pth")
TRAINING_LOG_PATH = os.path.join(OUTPUT_PATH, "training_log.json")

# Training hyperparameters
BATCH_SIZE = 32
LEARNING_RATE = 0.001
NUM_EPOCHS = 50
WEIGHT_DECAY = 1e-4

# Device configuration
def get_device():
    """Auto-detect and return best available device"""
    if torch.cuda.is_available():
        device = torch.device("cuda")
        print(f"✓ GPU detected: {torch.cuda.get_device_name(0)}")
        print(f"  CUDA Version: {torch.version.cuda}")
        print(f"  GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
    else:
        device = torch.device("cpu")
        print("⚠ No GPU available. Using CPU (training will be slower)")
    return device

DEVICE = get_device()


# ============================================================================
# DATASET LOADER
# ============================================================================

class CircuitDataset(Dataset):
    """
    Custom dataset loader for circuit images and labels.
    Expects structure:
    dataset/
      ├── images/
      │   ├── img_001.jpg
      │   ├── img_002.jpg
      │   └── ...
      └── labels/
          ├── img_001.txt (YOLO format: class_id x_center y_center width height)
          ├── img_002.txt
          └── ...
    """
    
    def __init__(self, image_dir, label_dir, num_classes=126, transform=None):
        self.image_dir = Path(image_dir)
        self.label_dir = Path(label_dir)
        self.num_classes = num_classes
        self.transform = transform or transforms.Compose([
            transforms.Resize((416, 416)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                std=[0.229, 0.224, 0.225])
        ])
        
        # Get list of image files
        self.image_files = sorted([
            f for f in self.image_dir.glob("*") 
            if f.suffix.lower() in {".jpg", ".jpeg", ".png"}
        ])
        
        print(f"Loaded {len(self.image_files)} images from {image_dir}")
    
    def __len__(self):
        return len(self.image_files)
    
    def __getitem__(self, idx):
        try:
            from PIL import Image
            
            img_path = self.image_files[idx]
            label_path = self.label_dir / (img_path.stem + ".txt")
            
            # Load image
            image = Image.open(img_path).convert("RGB")
            if self.transform:
                image = self.transform(image)
            
            # Load label (YOLO format: class_id x_center y_center width height)
            label = torch.zeros(self.num_classes)
            if label_path.exists():
                with open(label_path, "r") as f:
                    class_id = int(f.readline().split()[0])
                    if 0 <= class_id < self.num_classes:
                        label[class_id] = 1
            
            return image, label
        
        except Exception as e:
            print(f"Error loading {img_path}: {e}")
            # Return dummy data on error
            return torch.randn(3, 416, 416), torch.zeros(self.num_classes)


def load_data(batch_size=BATCH_SIZE, num_workers=0):
    """
    Load training and validation datasets.
    
    Args:
        batch_size: Batch size for DataLoader
        num_workers: Number of worker threads (set to 0 for Kaggle stability)
    
    Returns:
        train_loader, val_loader
    """
    print("\n" + "="*70)
    print("LOADING DATASET")
    print("="*70)
    
    # Find dataset directory
    dataset_dirs = [d for d in Path(INPUT_PATH).iterdir() if d.is_dir()]
    if not dataset_dirs:
        raise FileNotFoundError(f"No dataset found in {INPUT_PATH}")
    
    dataset_dir = dataset_dirs[0]  # Use first dataset directory
    print(f"Using dataset: {dataset_dir.name}")
    
    images_dir = dataset_dir / "images"
    labels_dir = dataset_dir / "labels"
    
    if not images_dir.exists():
        raise FileNotFoundError(f"Images directory not found: {images_dir}")
    
    # Create dataset
    dataset = CircuitDataset(images_dir, labels_dir)
    
    # Split into train/val (80/20)
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = random_split(dataset, [train_size, val_size])
    
    # Create DataLoaders
    train_loader = DataLoader(
        train_dataset, 
        batch_size=batch_size, 
        shuffle=True,
        num_workers=num_workers,
        pin_memory=(DEVICE.type == "cuda")
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=(DEVICE.type == "cuda")
    )
    
    print(f"✓ Training samples: {len(train_dataset)}")
    print(f"✓ Validation samples: {len(val_dataset)}")
    
    return train_loader, val_loader


# ============================================================================
# MODEL BUILDING
# ============================================================================

def build_model(num_classes=126):
    """
    Build circuit detection model (ResNet-50 backbone with custom classification head).
    
    Args:
        num_classes: Number of circuit component classes
    
    Returns:
        model: PyTorch model ready for training
    """
    print("\n" + "="*70)
    print("BUILDING MODEL")
    print("="*70)
    
    # Use pretrained ResNet-50
    model = models.resnet50(pretrained=True)
    
    # Replace classification head for circuit detection
    num_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Linear(num_features, 512),
        nn.ReLU(),
        nn.Dropout(0.5),
        nn.Linear(512, num_classes)
    )
    
    model = model.to(DEVICE)
    
    # Count parameters
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    
    print(f"✓ Model: ResNet-50 with custom head")
    print(f"✓ Total parameters: {total_params:,}")
    print(f"✓ Trainable parameters: {trainable_params:,}")
    print(f"✓ Device: {DEVICE}")
    
    return model


# ============================================================================
# CHECKPOINT MANAGEMENT
# ============================================================================

def save_checkpoint(model, optimizer, epoch, loss, filepath=CHECKPOINT_PATH):
    """
    Save training checkpoint (model, optimizer, epoch state).
    
    Args:
        model: PyTorch model
        optimizer: PyTorch optimizer
        epoch: Current epoch number
        loss: Current loss value
        filepath: Where to save checkpoint
    """
    checkpoint = {
        "epoch": epoch,
        "model_state_dict": model.state_dict(),
        "optimizer_state_dict": optimizer.state_dict(),
        "loss": loss,
        "timestamp": datetime.now().isoformat()
    }
    
    torch.save(checkpoint, filepath)
    print(f"✓ Checkpoint saved: {filepath}")


def load_checkpoint(model, optimizer, filepath=CHECKPOINT_PATH):
    """
    Load training checkpoint and resume from saved state.
    
    Args:
        model: PyTorch model
        optimizer: PyTorch optimizer
        filepath: Path to checkpoint file
    
    Returns:
        start_epoch: Epoch to resume from
    """
    if not os.path.exists(filepath):
        print(f"⚠ No checkpoint found at {filepath}. Starting from epoch 0.")
        return 0
    
    try:
        checkpoint = torch.load(filepath, map_location=DEVICE)
        model.load_state_dict(checkpoint["model_state_dict"])
        optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
        start_epoch = checkpoint["epoch"] + 1
        last_loss = checkpoint["loss"]
        
        print(f"✓ Checkpoint loaded successfully")
        print(f"  Last epoch: {checkpoint['epoch']}")
        print(f"  Last loss: {last_loss:.4f}")
        print(f"  Saved at: {checkpoint['timestamp']}")
        print(f"  Resuming from epoch {start_epoch}...")
        
        return start_epoch
    
    except Exception as e:
        print(f"⚠ Failed to load checkpoint: {e}")
        print(f"  Starting fresh training...")
        return 0


# ============================================================================
# TRAINING LOOP
# ============================================================================

def train_epoch(model, train_loader, optimizer, criterion, device, epoch, log_interval=50):
    """
    Train for one epoch.
    
    Args:
        model: PyTorch model
        train_loader: Training DataLoader
        optimizer: PyTorch optimizer
        criterion: Loss function
        device: torch.device
        epoch: Current epoch number
        log_interval: Print progress every N batches
    
    Returns:
        average_loss: Average loss for the epoch
    """
    model.train()
    total_loss = 0
    num_batches = len(train_loader)
    
    print(f"\n[Epoch {epoch}] Starting training...")
    start_time = time.time()
    
    for batch_idx, (images, labels) in enumerate(train_loader):
        try:
            images = images.to(device)
            labels = labels.to(device)
            
            # Forward pass
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            # Backward pass
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            
            # Log progress
            if (batch_idx + 1) % log_interval == 0:
                avg_loss = total_loss / (batch_idx + 1)
                elapsed = time.time() - start_time
                eta = (elapsed / (batch_idx + 1)) * (num_batches - batch_idx - 1)
                
                print(f"  Batch [{batch_idx+1}/{num_batches}] | "
                      f"Loss: {loss.item():.4f} | "
                      f"Avg Loss: {avg_loss:.4f} | "
                      f"ETA: {eta/60:.1f}m")
        
        except Exception as e:
            print(f"⚠ Error in batch {batch_idx}: {e}")
            continue
    
    epoch_loss = total_loss / num_batches
    elapsed = time.time() - start_time
    
    print(f"  ✓ Epoch complete | Total loss: {epoch_loss:.4f} | Time: {elapsed/60:.1f}m")
    
    return epoch_loss


def validate(model, val_loader, criterion, device, epoch):
    """
    Validate model on validation set.
    
    Args:
        model: PyTorch model
        val_loader: Validation DataLoader
        criterion: Loss function
        device: torch.device
        epoch: Current epoch number
    
    Returns:
        average_loss: Average validation loss
    """
    model.eval()
    total_loss = 0
    
    with torch.no_grad():
        for images, labels in val_loader:
            images = images.to(device)
            labels = labels.to(device)
            
            outputs = model(images)
            loss = criterion(outputs, labels)
            total_loss += loss.item()
    
    avg_loss = total_loss / len(val_loader)
    print(f"  ✓ Validation loss: {avg_loss:.4f}")
    
    return avg_loss


def train(model, train_loader, val_loader, num_epochs=NUM_EPOCHS, 
          learning_rate=LEARNING_RATE, start_epoch=0):
    """
    Main training loop with checkpoint saving.
    
    Args:
        model: PyTorch model
        train_loader: Training DataLoader
        val_loader: Validation DataLoader
        num_epochs: Total epochs to train
        learning_rate: Learning rate
        start_epoch: Epoch to start from (for resuming)
    """
    print("\n" + "="*70)
    print("TRAINING LOOP")
    print("="*70)
    
    # Loss function and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=learning_rate, weight_decay=WEIGHT_DECAY)
    
    # Resume optimizer state if checkpoint was loaded
    if start_epoch > 0:
        checkpoint = torch.load(CHECKPOINT_PATH, map_location=DEVICE)
        optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
    
    # Training history
    history = {
        "train_loss": [],
        "val_loss": [],
        "epochs": []
    }
    
    # Load existing history if available
    if os.path.exists(TRAINING_LOG_PATH):
        try:
            with open(TRAINING_LOG_PATH, "r") as f:
                history = json.load(f)
            print(f"✓ Loaded existing training history ({len(history['epochs'])} epochs)")
        except:
            pass
    
    try:
        for epoch in range(start_epoch, num_epochs):
            print(f"\n{'='*70}")
            print(f"EPOCH {epoch + 1}/{num_epochs}")
            print(f"{'='*70}")
            
            # Train
            train_loss = train_epoch(model, train_loader, optimizer, criterion, DEVICE, epoch + 1)
            
            # Validate
            val_loss = validate(model, val_loader, criterion, DEVICE, epoch + 1)
            
            # Save history
            history["train_loss"].append(train_loss)
            history["val_loss"].append(val_loss)
            history["epochs"].append(epoch + 1)
            
            # Save checkpoint (CRITICAL for restart safety)
            save_checkpoint(model, optimizer, epoch, train_loss, CHECKPOINT_PATH)
            
            # Save training log
            with open(TRAINING_LOG_PATH, "w") as f:
                json.dump(history, f, indent=2)
            
            print(f"  Training log saved to {TRAINING_LOG_PATH}")
    
    except KeyboardInterrupt:
        print("\n⚠ Training interrupted by user!")
        print("  Checkpoint will be saved on next epoch.")
    
    except Exception as e:
        print(f"\n⚠ Training error: {e}")
        traceback.print_exc()
    
    finally:
        # Save final model
        print(f"\n{'='*70}")
        print("FINALIZING TRAINING")
        print(f"{'='*70}")
        torch.save(model.state_dict(), FINAL_MODEL_PATH)
        print(f"✓ Final model saved to {FINAL_MODEL_PATH}")
        print(f"✓ Training progress saved to {TRAINING_LOG_PATH}")


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """
    Main entry point - handles auto-resume and full training pipeline.
    """
    print("\n" + "="*70)
    print("KAGGLE CIRCUIT DETECTION MODEL TRAINING")
    print(f"Started at: {datetime.now()}")
    print("="*70)
    
    try:
        # 1. Load data
        train_loader, val_loader = load_data(batch_size=BATCH_SIZE)
        
        # 2. Build model
        model = build_model(num_classes=126)
        
        # 3. Setup optimizer
        optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
        
        # 4. Auto-resume or start fresh
        print("\n" + "="*70)
        print("CHECKPOINT MANAGEMENT")
        print("="*70)
        start_epoch = load_checkpoint(model, optimizer, CHECKPOINT_PATH)
        
        # 5. Train
        train(model, train_loader, val_loader, num_epochs=NUM_EPOCHS, 
              learning_rate=LEARNING_RATE, start_epoch=start_epoch)
        
        print("\n" + "="*70)
        print("TRAINING COMPLETE")
        print(f"Ended at: {datetime.now()}")
        print("="*70)
        print(f"\nOutputs saved to: {OUTPUT_PATH}")
        print(f"  - Checkpoint: {CHECKPOINT_PATH}")
        print(f"  - Final Model: {FINAL_MODEL_PATH}")
        print(f"  - Training Log: {TRAINING_LOG_PATH}")
    
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
