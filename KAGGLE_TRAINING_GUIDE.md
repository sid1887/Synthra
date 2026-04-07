# Kaggle Training Setup Guide

This guide explains how to set up and run training on Kaggle for the circuit detection model.

## Prerequisites

### 1. Prepare Your Dataset on Kaggle
Before running training, you need to upload your dataset to Kaggle Datasets:

- **Dataset Structure:**
  ```
  circuit-detection-dataset/
  ├── images/
  │   ├── img_001.jpg
  │   ├── img_002.jpg
  │   └── ... (all training images)
  └── labels/
      ├── img_001.txt  (YOLO format: class_id x_center y_center width height)
      ├── img_002.txt
      └── ... (corresponding labels)
  ```

- **Upload to Kaggle:**
  1. Go to https://www.kaggle.com/datasets
  2. Click "Create" → "New Dataset"
  3. Upload your images and labels folders
  4. Make the dataset public (or private if preferred)
  5. Note the dataset name (you'll need this in the notebook)

### 2. Create Kaggle Notebook

1. Go to https://www.kaggle.com/code
2. Click "New Notebook"
3. Name it: "Circuit Detection Training"
4. Copy the notebook content from `kaggle_notebook_template.py` below

## File Structure

```
Your Kaggle Notebook:
├── Cell 1: Install dependencies (pip packages)
├── Cell 2: Import libraries and define paths
├── Cell 3: Load training script
├── Cell 4: Run training (auto-resumes from checkpoint)
```

## Step-by-Step Usage

### Cell 1: Install Dependencies
```python
!pip install -q torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
!pip install -q pillow tqdm
```

### Cell 2: Add Dataset to Notebook
In Kaggle Notebook UI:
1. Click "+ Add Input" 
2. Select your circuit detection dataset
3. It will be mounted at `/kaggle/input/<dataset-name>/`

### Cell 3: Run Training Script
```python
# Copy the entire training script (kaggle_training_script.py) here
# Then call: main()
```

## Auto-Resume Mechanism (CRITICAL)

The training script is **restart-safe**:

### How It Works:
1. **Before training starts:**
   - Script checks for `/kaggle/working/checkpoint.pth`
   - If exists: Loads model + optimizer state → resumes training
   - If missing: Starts fresh training from epoch 0

2. **After each epoch:**
   - Saves checkpoint with: model weights, optimizer state, epoch number
   - Saves training log (train loss, validation loss per epoch)

3. **On Kaggle interruption:**
   - 12-hour session limit triggers → notebook auto-saves
   - Checkpoint is safely written to `/kaggle/working/`
   - Next session: Script auto-resumes from last completed epoch

4. **Final model:**
   - After all 50 epochs complete (or manually stop)
   - `final_model.pth` is saved
   - Ready to download and deploy

### Example Timeline:
```
Session 1 (12 hours):
  Epoch 1-20 completes
  Checkpoint saved → interrupt (session limit)

Session 2 (12 hours):
  Script auto-resumes from epoch 21
  Epoch 21-40 completes
  Checkpoint saved again

Session 3 (2 hours):
  Script auto-resumes from epoch 41
  Epoch 41-50 completes
  final_model.pth saved
  Training complete ✓
```

## Outputs

All outputs are saved to `/kaggle/working/`:

| File | Purpose | When Available |
|------|---------|-----------------|
| `checkpoint.pth` | Resume checkpoint (model + optimizer) | After each epoch |
| `final_model.pth` | Production-ready model | After all epochs |
| `training_log.json` | Loss history (train & validation) | After each epoch |

### Download Your Model

In Kaggle Notebook:
1. Go to "Output" section (bottom right)
2. All files in `/kaggle/working/` visible for download
3. Download `final_model.pth` to use locally

## Monitoring Training

### View Progress in Real-Time

The script prints progress every 50 batches:
```
[Epoch 1] Starting training...
  Batch [50/200] | Loss: 2.1234 | Avg Loss: 2.3456 | ETA: 15.5m
  Batch [100/200] | Loss: 1.8234 | Avg Loss: 2.1456 | ETA: 8.3m
  ✓ Training loss: 2.0456 | Time: 12.3m
  ✓ Validation loss: 1.9234
```

### Check Training History

```python
import json

with open("/kaggle/working/training_log.json", "r") as f:
    history = json.load(f)

print(f"Epochs completed: {len(history['epochs'])}")
print(f"Latest train loss: {history['train_loss'][-1]:.4f}")
print(f"Latest val loss: {history['val_loss'][-1]:.4f}")
```

### Plot Training Curves

```python
import matplotlib.pyplot as plt
import json

with open("/kaggle/working/training_log.json", "r") as f:
    history = json.load(f)

plt.figure(figsize=(10, 6))
plt.plot(history["epochs"], history["train_loss"], label="Train Loss", marker="o")
plt.plot(history["epochs"], history["val_loss"], label="Val Loss", marker="s")
plt.xlabel("Epoch")
plt.ylabel("Loss")
plt.title("Training Progress")
plt.legend()
plt.grid(True)
plt.show()
```

## Troubleshooting

### Issue: "No dataset found in /kaggle/input/"
**Solution:** You haven't added the dataset to the notebook yet. Click "+ Add Input" in Kaggle UI and select your dataset.

### Issue: "CUDA out of memory"
**Solution:** Reduce `BATCH_SIZE` in the script:
```python
BATCH_SIZE = 16  # Instead of 32
```

### Issue: Training seems slow
**Solution:** This is normal on CPU. GPU is 10-20x faster. Check device:
```python
print(DEVICE)  # Should print "cuda" if GPU available
```

### Issue: Checkpoint not loading after session restart
**Solution:** Make sure checkpoint file exists:
```python
import os
print(os.path.exists("/kaggle/working/checkpoint.pth"))  # Should be True
```

## Advanced Configuration

### Change Hyperparameters

Edit these in the script:
```python
BATCH_SIZE = 32           # Adjust for memory constraints
LEARNING_RATE = 0.001    # Lower for fine-tuning, higher for fast training
NUM_EPOCHS = 50          # Total epochs to train
WEIGHT_DECAY = 1e-4      # L2 regularization
```

### Use Different Model Architecture

Replace `build_model()`:
```python
def build_model(num_classes=126):
    model = models.resnet34(pretrained=True)  # Lighter than ResNet50
    # ... rest of code
```

### Custom Loss Function

Replace in `train()`:
```python
criterion = nn.BCEWithLogitsLoss()  # For multi-label classification
# Instead of: criterion = nn.CrossEntropyLoss()
```

## Production Deployment

After training completes, use `circuit_inference.py`:

```python
from circuit_inference import CircuitDetector

# Load trained model
detector = CircuitDetector("/kaggle/working/final_model.pth")

# Detect circuits in images
result = detector.detect_image("/path/to/image.jpg")
print(result)
# Output:
# {
#   "image": "...",
#   "detected_classes": [{"class_id": 5, "confidence": 0.95}, ...],
#   "top_detection": {"class_id": 5, "confidence": 0.95},
#   "processing_time": 0.15
# }

# Batch detection
results = detector.detect_batch(image_paths_list)
```

## FAQ

**Q: Can I stop training and resume later?**
A: Yes! Any interruption auto-saves checkpoint. Next session auto-resumes.

**Q: How long does training take?**
A: On GPU: 8-12 hours for 50 epochs
   On CPU: 2-3 days for 50 epochs (use GPU if available)

**Q: What if I want to fine-tune after 50 epochs?**
A: Load `final_model.pth`, set `NUM_EPOCHS = 60` (or higher), and run again.

**Q: Can I train on my local machine instead?**
A: Yes, the script is device-agnostic. Just change:
   ```python
   INPUT_PATH = "/path/to/local/dataset"
   OUTPUT_PATH = "/path/to/local/output"
   ```

**Q: What's the checkpoint file size?**
A: ~400-500 MB (model + optimizer state). Well within Kaggle limits.

## Next Steps

1. ✓ Prepare your dataset (upload to Kaggle Datasets)
2. ✓ Create Kaggle Notebook
3. ✓ Copy training script to notebook
4. ✓ Run training (auto-resumes on restarts)
5. ✓ Download `final_model.pth`
6. ✓ Use `circuit_inference.py` for predictions
