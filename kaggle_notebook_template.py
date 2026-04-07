"""
KAGGLE NOTEBOOK TEMPLATE - Circuit Detection Training
Copy-paste cells into Kaggle Notebook

Cell 1: Install Dependencies (Run this first)
Cell 2: Setup Path & Check GPU
Cell 3: Training Script (Full implementation)
Cell 4: Run Training
"""

# ============================================================================
# CELL 1: INSTALL DEPENDENCIES
# ============================================================================
"""
!pip install -q torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
!pip install -q pillow tqdm

# Note: This may take 2-3 minutes. Wait for completion.
"""


# ============================================================================
# CELL 2: SETUP PATHS & CHECK GPU
# ============================================================================
"""
import os
import torch
from pathlib import Path

# Kaggle paths
INPUT_PATH = "/kaggle/input"
OUTPUT_PATH = "/kaggle/working"

# Create output directory if needed
os.makedirs(OUTPUT_PATH, exist_ok=True)

# Check GPU availability
print("=" * 70)
print("ENVIRONMENT CHECK")
print("=" * 70)
print(f"PyTorch Version: {torch.__version__}")
print(f"CUDA Available: {torch.cuda.is_available()}")

if torch.cuda.is_available():
    print(f"GPU Name: {torch.cuda.get_device_name(0)}")
    print(f"GPU VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
else:
    print("⚠ No GPU detected. Training will use CPU (slower but works)")

# List available datasets
datasets = [d.name for d in Path(INPUT_PATH).iterdir() if d.is_dir()]
print(f"\nAvailable Datasets: {datasets}")

# Verify dataset structure
if datasets:
    dataset_path = Path(INPUT_PATH) / datasets[0]
    images = list((dataset_path / "images").glob("*")) if (dataset_path / "images").exists() else []
    labels = list((dataset_path / "labels").glob("*")) if (dataset_path / "labels").exists() else []
    print(f"  Images: {len(images)}")
    print(f"  Labels: {len(labels)}")
"""


# ============================================================================
# CELL 3: TRAINING SCRIPT
# ============================================================================
"""
# [COPY FULL CONTENT OF kaggle_training_script.py HERE]
# 
# Here's a minimal version to get started:
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
from PIL import Image

# ============================================================================
# CONFIGURATION
# ============================================================================
INPUT_PATH = "/kaggle/input"
OUTPUT_PATH = "/kaggle/working"
CHECKPOINT_PATH = os.path.join(OUTPUT_PATH, "checkpoint.pth")
FINAL_MODEL_PATH = os.path.join(OUTPUT_PATH, "final_model.pth")
TRAINING_LOG_PATH = os.path.join(OUTPUT_PATH, "training_log.json")

BATCH_SIZE = 32
LEARNING_RATE = 0.001
NUM_EPOCHS = 50
WEIGHT_DECAY = 1e-4

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {DEVICE}")

# ============================================================================
# DATASET
# ============================================================================
class CircuitDataset(Dataset):
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
        
        self.image_files = sorted([
            f for f in self.image_dir.glob("*") 
            if f.suffix.lower() in {".jpg", ".jpeg", ".png"}
        ])
        print(f"Loaded {len(self.image_files)} images from {image_dir}")
    
    def __len__(self):
        return len(self.image_files)
    
    def __getitem__(self, idx):
        try:
            img_path = self.image_files[idx]
            label_path = self.label_dir / (img_path.stem + ".txt")
            
            image = Image.open(img_path).convert("RGB")
            if self.transform:
                image = self.transform(image)
            
            label = torch.zeros(self.num_classes)
            if label_path.exists():
                with open(label_path, "r") as f:
                    class_id = int(f.readline().split()[0])
                    if 0 <= class_id < self.num_classes:
                        label[class_id] = 1
            
            return image, label
        except Exception as e:
            print(f"Error loading {img_path}: {e}")
            return torch.randn(3, 416, 416), torch.zeros(self.num_classes)

def load_data(batch_size=BATCH_SIZE):
    print("\nLoading Dataset...")
    dataset_dirs = [d for d in Path(INPUT_PATH).iterdir() if d.is_dir()]
    if not dataset_dirs:
        raise FileNotFoundError(f"No dataset in {INPUT_PATH}")
    
    dataset_dir = dataset_dirs[0]
    print(f"Dataset: {dataset_dir.name}")
    
    images_dir = dataset_dir / "images"
    labels_dir = dataset_dir / "labels"
    
    dataset = CircuitDataset(images_dir, labels_dir)
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = random_split(dataset, [train_size, val_size])
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    
    print(f"Train: {len(train_dataset)}, Val: {len(val_dataset)}")
    return train_loader, val_loader

# ============================================================================
# MODEL
# ============================================================================
def build_model(num_classes=126):
    model = models.resnet50(pretrained=True)
    num_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Linear(num_features, 512),
        nn.ReLU(),
        nn.Dropout(0.5),
        nn.Linear(512, num_classes)
    )
    model = model.to(DEVICE)
    print(f"Model built with {sum(p.numel() for p in model.parameters()):,} parameters")
    return model

# ============================================================================
# CHECKPOINT
# ============================================================================
def save_checkpoint(model, optimizer, epoch, loss):
    checkpoint = {
        "epoch": epoch,
        "model_state_dict": model.state_dict(),
        "optimizer_state_dict": optimizer.state_dict(),
        "loss": loss,
        "timestamp": datetime.now().isoformat()
    }
    torch.save(checkpoint, CHECKPOINT_PATH)
    print(f"✓ Checkpoint saved")

def load_checkpoint(model, optimizer):
    if not os.path.exists(CHECKPOINT_PATH):
        print(f"Starting fresh training...")
        return 0
    
    try:
        checkpoint = torch.load(CHECKPOINT_PATH, map_location=DEVICE)
        model.load_state_dict(checkpoint["model_state_dict"])
        optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
        start_epoch = checkpoint["epoch"] + 1
        print(f"✓ Resumed from epoch {start_epoch} (loss: {checkpoint['loss']:.4f})")
        return start_epoch
    except Exception as e:
        print(f"Failed to load checkpoint: {e}")
        return 0

# ============================================================================
# TRAINING
# ============================================================================
def train_epoch(model, train_loader, optimizer, criterion, epoch, log_interval=50):
    model.train()
    total_loss = 0
    
    print(f"\n[Epoch {epoch}] Training...")
    for batch_idx, (images, labels) in enumerate(train_loader):
        images = images.to(DEVICE)
        labels = labels.to(DEVICE)
        
        outputs = model(images)
        loss = criterion(outputs, labels)
        
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
        
        if (batch_idx + 1) % log_interval == 0:
            avg_loss = total_loss / (batch_idx + 1)
            print(f"  Batch [{batch_idx+1}/{len(train_loader)}] Loss: {loss.item():.4f} | Avg: {avg_loss:.4f}")
    
    return total_loss / len(train_loader)

def validate(model, val_loader, criterion, epoch):
    model.eval()
    total_loss = 0
    with torch.no_grad():
        for images, labels in val_loader:
            images = images.to(DEVICE)
            labels = labels.to(DEVICE)
            outputs = model(images)
            loss = criterion(outputs, labels)
            total_loss += loss.item()
    
    avg_loss = total_loss / len(val_loader)
    print(f"  Validation Loss: {avg_loss:.4f}")
    return avg_loss

def train(model, train_loader, val_loader, start_epoch=0):
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    
    if start_epoch > 0:
        checkpoint = torch.load(CHECKPOINT_PATH, map_location=DEVICE)
        optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
    
    history = {"train_loss": [], "val_loss": [], "epochs": []}
    if os.path.exists(TRAINING_LOG_PATH):
        try:
            with open(TRAINING_LOG_PATH) as f:
                history = json.load(f)
            print(f"Loaded previous history ({len(history['epochs'])} epochs)")
        except:
            pass
    
    try:
        for epoch in range(start_epoch, NUM_EPOCHS):
            print(f"\n{'='*70}")
            print(f"EPOCH {epoch + 1}/{NUM_EPOCHS}")
            print(f"{'='*70}")
            
            train_loss = train_epoch(model, train_loader, optimizer, criterion, epoch + 1)
            val_loss = validate(model, val_loader, criterion, epoch + 1)
            
            history["train_loss"].append(train_loss)
            history["val_loss"].append(val_loss)
            history["epochs"].append(epoch + 1)
            
            save_checkpoint(model, optimizer, epoch, train_loss)
            
            with open(TRAINING_LOG_PATH, "w") as f:
                json.dump(history, f, indent=2)
    
    except KeyboardInterrupt:
        print("\n⚠ Training interrupted")
    except Exception as e:
        print(f"\n⚠ Error: {e}")
        traceback.print_exc()
    
    finally:
        torch.save(model.state_dict(), FINAL_MODEL_PATH)
        print(f"\n✓ Final model saved to {FINAL_MODEL_PATH}")

# ============================================================================
# MAIN
# ============================================================================
def main():
    print("="*70)
    print("CIRCUIT DETECTION MODEL TRAINING")
    print(f"Started: {datetime.now()}")
    print("="*70)
    
    try:
        # Load data
        train_loader, val_loader = load_data()
        
        # Build model
        model = build_model()
        
        # Setup optimizer
        optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
        
        # Auto-resume
        start_epoch = load_checkpoint(model, optimizer)
        
        # Train
        train(model, train_loader, val_loader, start_epoch)
        
        print(f"\n{'='*70}")
        print("TRAINING COMPLETE")
        print(f"Ended: {datetime.now()}")
        print(f"Output: {OUTPUT_PATH}")
        print(f"{'='*70}")
    
    except Exception as e:
        print(f"Fatal error: {e}")
        traceback.print_exc()


# ============================================================================
# CELL 4: RUN TRAINING
# ============================================================================
"""
# Run this cell to start training
main()
"""

# Uncomment below to run:
# main()
