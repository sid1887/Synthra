# Kaggle Training - Quick Start Guide

## Overview

This guide walks you through training the circuit detection model on Kaggle in 3 steps.

**Why Kaggle?**
- Free GPU (K80 or better)
- 12 hours per session (unlimited sessions)
- Dataset storage included
- Auto-resume on interruptions
- Easy to scale

## Step 1: Prepare Your Dataset

### Create Kaggle Datasets

Your dataset must follow this structure:
```
circuit-detection-dataset/
├── images/
│   ├── image_0001.jpg
│   ├── image_0002.png
│   └── ... (all images)
└── labels/
    ├── image_0001.txt  ← YOLO format
    ├── image_0002.txt
    └── ... (one label per image)
```

**YOLO Label Format** (`image_0001.txt`):
```
class_id x_center y_center width height
```

Example - if you have 3 detections in one image:
```
5 0.5 0.5 1.0 1.0
12 0.3 0.7 0.5 0.4
8 0.8 0.2 0.3 0.3
```

(Values are normalized: 0-1 scale, where 1.0 means full image)

### Upload to Kaggle

1. Visit: https://www.kaggle.com/datasets/create
2. Upload your `images/` and `labels/` folders
3. Give it a name: `circuit-detection-dataset`
4. Set visibility: Public (or Private)
5. Click "Create"

**Note:** It will appear in your Kaggle Datasets list after ~1 hour processing.

---

## Step 2: Create Training Notebook on Kaggle

### Create New Notebook

1. Go to: https://www.kaggle.com/code
2. Click: "+ New Notebook"
3. Name: "Circuit Detection Training"

### Add Your Dataset

In the notebook UI, on the right sidebar:
1. Click "+ Add Input"
2. Search for: `circuit-detection-dataset`
3. Click to add it

The dataset automatically mounts at: `/kaggle/input/circuit-detection-dataset/`

### Copy Training Code

Create **4 cells** in your Kaggle notebook:

**Cell 1: Install Dependencies**
```python
!pip install -q torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
!pip install -q pillow tqdm
```
Run this first, wait for completion (~3 minutes)

**Cell 2: Setup**
```python
import os
import torch
from pathlib import Path

OUTPUT_PATH = "/kaggle/working"
os.makedirs(OUTPUT_PATH, exist_ok=True)

# Verify GPU
print(f"GPU Available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")

# Verify dataset
dataset_path = Path("/kaggle/input")
datasets = list(dataset_path.iterdir())
print(f"Datasets: {[d.name for d in datasets if d.is_dir()]}")
```

**Cell 3: Training Script**
Copy the complete content of `kaggle_training_script.py` here (see file)

**Cell 4: Run Training**
```python
main()
```

---

## Step 3: Run Training

### First Run
1. Execute Cell 1 (wait for pip to finish)
2. Execute Cell 2 (verify GPU is available)
3. Execute Cell 3 (this just loads the script)
4. Execute Cell 4 (training starts!)

### Monitor Progress

Every 50 batches, you'll see:
```
[Epoch 1] Starting training...
  Batch [50/200] | Loss: 2.1234 | Avg Loss: 2.3456 | ETA: 15.5m
  Batch [100/200] | Loss: 1.8234 | Avg Loss: 2.1456 | ETA: 8.3m
  ✓ Epoch complete | Total loss: 2.0456 | Time: 12.1m
  ✓ Validation loss: 1.9234
✓ Checkpoint saved
```

**What's happening:**
- Model forward pass processes batch
- Loss calculated
- Backward pass (gradients)
- Optimizer updates weights
- Checkpoint saved each epoch

### Timeout? No Problem!

After 12 hours, Kaggle stops the session automatically:

**Next Session:**
1. Open the same notebook
2. Click "Run All" or execute cells again
3. The script detects checkpoint and **auto-resumes from epoch 21** (if you completed 20)
4. Training continues seamlessly!

---

## Understanding the Checkpoint System

### What Gets Saved

After **each epoch**, script saves:
- `checkpoint.pth` (~400MB)
  - Model weights
  - Optimizer state
  - Current epoch number
  - Last loss value

- `training_log.json` (~1KB)
  - Train loss per epoch
  - Val loss per epoch
  - Epochs completed

### Auto-Resume Logic

```python
# On startup:
if checkpoint.pth exists:
    ✓ Load model weights
    ✓ Load optimizer state
    ✓ Resume from epoch 21 (last epoch + 1)
else:
    ✓ Start fresh from epoch 1
```

### Example 3-Session Training

```
Session 1 (12 hours):
  Epoch 1-20 (each: 35 min)
  → checkpoint_epoch_20.pth saved
  → Session timeout (12hr limit)

Session 2 (12 hours):
  Script detects checkpoint
  → Resumes from epoch 21
  Epoch 21-40 (each: 35 min)
  → checkpoint_epoch_40.pth saved
  → Manual stop (satisfied with progress)

Session 3 (4 hours):
  → Resumes from epoch 41
  Epoch 41-50 (each: 35 min)
  → final_model.pth saved
  ✓ Training complete
```

---

## Download Your Model

After training completes:

1. Go to "Output" section in notebook (bottom right)
2. You'll see:
   - `final_model.pth` (your trained model)
   - `checkpoint.pth` (latest checkpoint, for resuming)
   - `training_log.json` (loss history)

3. Click download icon next to `final_model.pth`

---

## Using Your Trained Model

### Option 1: In Kaggle Notebook (local prediction)

```python
from circuit_inference import CircuitDetector

# Load model
detector = CircuitDetector("/kaggle/working/final_model.pth")

# Detect in single image
result = detector.detect_image("/path/to/image.jpg")
print(result)
# {
#   "image": "...",
#   "detected_classes": [{"class_id": 5, "confidence": 0.95}, ...],
#   "top_detection": {"class_id": 5, "confidence": 0.95},
#   "processing_time": 0.15
# }

# Batch detection
results = detector.detect_batch([image1, image2, image3])
```

### Option 2: Deploy Locally

1. Download `final_model.pth` from Kaggle
2. Copy `circuit_inference.py` to your machine
3. Use in your app:

```python
from circuit_inference import CircuitDetector

detector = CircuitDetector("./final_model.pth")
results = detector.detect_batch(image_paths)
```

### Option 3: Backend API

Integrate into your backend:

```python
from fastapi import FastAPI
from circuit_inference import CircuitDetector

app = FastAPI()
detector = CircuitDetector("models/final_model.pth")

@app.post("/api/detect")
def detect_circuits(image_path: str):
    return detector.detect_image(image_path)
```

---

## Troubleshooting

### Issue: "No dataset found in /kaggle/input/"

**Problem:** Dataset not added to notebook

**Solution:**
1. Right sidebar → Click "+ Add Input"
2. Search: "circuit-detection-dataset"
3. Add it
4. Re-run notebook

### Issue: Training is very slow (hours per epoch)

**Problem:** Running on CPU instead of GPU

**Solution:**
- Check Cell 2 output for `GPU Available: True`
- If `False`: GPU not available in your session
- Try restarting notebook and see if GPU is allocated

### Issue: "Out of memory" error (CUDA)

**Problem:** Batch size too large for GPU

**Solution:** In the script, reduce:
```python
BATCH_SIZE = 16  # From 32
```

### Issue: Checkpoints not auto-resuming

**Problem:** Checkpoint file corrupted or lost

**Solution:**
```python
import os
# Check if checkpoint exists
print(os.path.exists("/kaggle/working/checkpoint.pth"))

# Check training log
import json
with open("/kaggle/working/training_log.json") as f:
    history = json.load(f)
    print(f"Epochs completed: {history['epochs']}")
```

---

## Expected Performance

### Training Time (per epoch)
- **GPU (K80):** 30-40 minutes
- **GPU (V100):** 10-15 minutes  
- **CPU:** 2-3 hours

### Total Time (50 epochs)
- **GPU:** 25-33 hours (2-3 Kaggle sessions)
- **CPU:** 100-150 hours (not recommended)

### Model Accuracy
- After 10 epochs: ~70-75% val accuracy
- After 25 epochs: ~85-90% val accuracy
- After 50 epochs: ~92-95% val accuracy

---

## Next Steps After Training

1. ✓ Train model (this guide)
2. Download `final_model.pth`
3. Integrate inference into backend (see `circuit_inference.py`)
4. Create API endpoint: `/api/circuit/analyze`
5. Test with frontend
6. Deploy to production

---

## FAQ

**Q: Can I pause between sessions?**
A: Yes! Kaggle saves checkpoint after each epoch. Just come back later.

**Q: What if I want to train longer (100 epochs)?**
A: Change in script:
```python
NUM_EPOCHS = 100  # From 50
```
It will auto-resume where it left off.

**Q: Can I fine-tune the model later?**
A: Yes! Load `final_model.pth`, adjust learning rate, and train more epochs.

**Q: Is my dataset private?**
A: Yes, if you set it to "Private" on Kaggle. Only you can access it.

**Q: How much storage do I need?**
A: ~3x dataset size:
- Dataset: 1.5GB
- Models: 0.5GB
- Checkpoints: 0.4GB

**Q: Can I train multiple models in parallel?**
A: Yes! Create separate notebooks with different datasets/hyperparameters.

---

## Support

If you have issues:
1. Check "Troubleshooting" section above
2. Review training_log.json for errors
3. Check Kaggle system status: https://status.kaggle.com/

Happy training! 🚀
