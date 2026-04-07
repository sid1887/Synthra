# 🎯 SYNTHRA ML TRAINING COMPREHENSIVE PLAN
## Complete Dataset Unification & CPU-Optimized YOLOv8 Training Strategy

**Generated:** April 7, 2026  
**Objective:** Train production-grade circuit detection model from scratch  
**Hardware:** 16GB RAM CPU, 2GB GPU (optional), WEEKS available  
**Target Model:** YOLOv8 Small (optimized for CPU inference)

---

## 📊 DATASET INVENTORY SUMMARY

### Available Data Sources

| Source | Type | Count | Format | Status | Notes |
|--------|------|-------|--------|--------|-------|
| circuit elements.yolov8 | Images | 772 | YOLO | ✅ Ready | 45 classes, 291 obj/img avg |
| Circuit Schematic Detection.yolov8 | Images | 2,000 | YOLO | ✅ Ready | 36 classes, 5 obj/img avg |
| Electronic Components.yolov8 | Images | 1,803 | YOLO | ✅ Ready | 7 classes, 1 obj/img avg |
| archive (2) | Images | 266 | YOLO | ✅ Ready | Additional labeled dataset |
| Components (Categories) | Images | 21,980 | JPG (cats) | ⚠️ To annotate | 37 categories, no labels |
| 3D Models (Dataverse) | 3D | 234 | OBJ/STL/OFF | 🔄 To project | Need 2D conversion |
| archive (1) | Data | 2 | CSV | 📋 To analyze | Metadata/ground truth |

**TOTAL IMAGES AVAILABLE:** ~26,555  
**LABELED & READY:** 4,841 images (18.2%)  
**UNLABELED:** 21,714 images (81.8%)

---

## 🔧 PHASE 1: DATA PREPARATION (Days 1-3)

### Stage 1a: Merge YOLOv8 Datasets
**Objective:** Combine 3 YOLO datasets + archive(2) into unified corpus

```
YOLO Dataset Merger Strategy:
├── Load all 4 datasets
├── Map class IDs → unified class definitions
│   ├── circuit elements: classes 0-45
│   ├── Circuit Schematic: classes 0-35
│   ├── Electronic Components: classes 0-6
│   └── archive(2): unknown classes
├── Create class mapping table
├── Normalize all labels to unified schema
├── Merge into single train/val/test split (70/15/15)
└── Output: ~/training_data/merged_yolo/
    ├── train/
    │   ├── images/ (3,388)
    │   └── labels/ (3,388)
    ├── val/
    │   ├── images/ (843)
    │   └── labels/ (843)
    └── test/
        ├── images/ (610)
        └── labels/ (610)

Total: 4,841 images with proper YOLO format
Expected size: ~300-400 MB
Time estimate: 2-4 hours
```

**Key decisions:**
- Keep original class IDs initially to debug class distribution
- Create comprehensive class mapping JSON for future reference
- Verify no image/label mismatches during merge
- Convert any absolute coordinates to normalized (0-1 range)

### Stage 1b: Process Component Category Images
**Objective:** Convert 21,980 images from folder-based categories to YOLO format

```
Component Processing Strategy:
├── Enum all 36 valid categories (exclude nested "images" dir)
├── For each category:
│   ├── Map category name → class_id (0-35)
│   ├── For each image:
│   │   ├── Generate full-image bounding box (whole component)
│   │   └── Create YOLO label: class_id 0.5 0.5 1.0 1.0
│   └── Copy to training structure
├── Handle nested images/images/ structure
│   ├── Check if duplicate or different content
│   ├── If duplicate: skip
│   └── If different: merge into respective categories
└── Output: ~/training_data/components/
    ├── images/ (21,980)
    ├── labels/ (21,980)
    └── CATEGORY_MAPPING.json

Total: 21,980 labeled images
Expected size: ~150-200 MB
Time estimate: 4-6 hours processing
```

**Challenge:** Component category = full image bounding box (1 object per image)

**Solution:**
- Use approach: class_id always center (0.5), full width/height (1.0)
- Create mapping: category_name → standard class_id
- Validate 1:1 mapping (1 image = 1 category)
- Duplicate check using image hash (MD5)

### Stage 1c: Project 3D Models to 2D Images
**Objective:** Convert 234 3D models (OBJ/STL/OFF) to 2D PNG + generate labels

```
3D→2D Projection Strategy:
├── Load 3D model (OBJ/STL/OFF format)
├── Render from multiple angles:
│   ├── Top-down view (XY plane)
│   ├── Front view (XZ plane)
│   ├── Side view (YZ plane)
│   └── 45° isometric views (3 variants)
├── For each view:
│   ├── Generate PNG image (512×512 or 1024×1024)
│   ├── Create bounding box around projected component
│   └── Generate YOLO label with bbox
└── Output: ~/training_data/3d_projected/
    ├── images/ (234 × 6 = 1,404 images)
    ├── labels/ (1,404)
    └── PROJECTION_LOG.json

Total: 1,404 synthetic 2D images from 3D data
Expected size: ~100-150 MB
Time estimate: 2-3 hours processing + rendering
```

**Tool chain:**
- `trimesh` or `open3d` for 3D loading
- `PyOpenGL` or `pyglet` for rendering
- Image rotation for augmentation during rendering

---

## 📈 PHASE 2: UNIFIED DATASET ASSEMBLY (Days 3-4)

### Combine all sources into single training corpus

```
Final Grand Merge:
├── Source 1: Merged YOLOv8 (4,841 images)
├── Source 2: Components with auto-labels (21,980 images)
├── Source 3: 3D projected to 2D (1,404 images)
└── Total: 28,225 images with YOLO labels

Split into train/val/test (70/15/15):
├── train/: 19,758 images (70%)
├── val/: 2,959 images (15%)
└── test/: 2,959 images (15%)

Output directory: ~/training_data/unified/
├── train/images/ (19,758)
├── train/labels/ (19,758)
├── val/images/ (2,959)
├── val/labels/ (2,959)
├── test/images/ (2,959)
├── test/labels/ (2,959)
├── data.yaml (dataset config)
└── STATISTICS.json

Total directory size: ~1.2-1.5 GB compressed
RAM required for loading: 2-3 GB
```

### Class Distribution Analysis

```
Expected class types:
- From circuit elements: ~45 unique circuit component classes
- From schematic detection: ~36 unique schematic element classes
- From electronic components: ~7 component types
- From component categories: ~36 physical component categories
- Total unified classes: ~80-90 distinct component/element types

This creates comprehensive circuit detection model covering:
✓ Schematic symbols (lines, resistors, capacitors, etc.)
✓ Physical components (LEDs, transistors, chips, etc.)
✓ Circuit elements (nodes, connections, etc.)
```

---

## 🧠 PHASE 3: MODEL TRAINING (Days 5-40 ESTIMATED)

### Training Configuration

```yaml
# CPU-Optimized YOLOv8 Setup
model: yolov8s  # Small variant (best for CPU)

training_params:
  epochs: 50-100  # Extend if RAM allows, checkpoint every 5
  batch_size: 4   # CPU limitation with 16GB RAM
  imgsz: 416      # Input image size (smaller = faster but less accurate)
  device: cpu     # Primary device
  
  # Augmentation (aggressive for data richness)
  augment: true
  mosaic: 1.0
  mixup: 0.1
  fliplr: 0.5
  flipud: 0.5
  degrees: 10
  translate: 0.1
  scale: 0.5
  hsv_h: 0.015
  hsv_s: 0.7
  hsv_v: 0.4
  
  # Optimization
  optimizer: SGD
  lr0: 0.01
  lrf: 0.01
  momentum: 0.937
  weight_decay: 0.0005
  
  # Hardware
  workers: 0  # CPU workers (disable for CPU training)
  patience: 20  # Early stopping if mAP doesn't improve
  seed: 42
  
# Output
save_dir: ./runs/detect/train_cpu_optimized/
```

### Training Loop Strategy

```python
# Pseudocode for CPU-optimized training

1. DATA LOADING
   └─ Load data.yaml pointing to unified dataset
   └─ Use default augmentation pipeline
   └─ Pre-load training indices (avoid repeated I/O)

2. MODEL INITIALIZATION
   └─ Load YOLOv8 Small pretrained (ImageNet)
   └─ Freeze backbone initially (transfer learning)
   └─ Fine-tune for 10 epochs first

3. CHECKPOINT STRATEGY
   ├─ Save every epoch (crash recovery)
   ├─ Keep only best 3 checkpoints (disk space)
   └─ Save metrics: mAP, precision, recall, loss

4. MEMORY MANAGEMENT
   ├─ Batch size: 4
   ├─ Empty GPU cache every N batches (if GPU available)
   ├─ Use gradient accumulation if OOM
   └─ Profile memory every 10 batches

5. VALIDATION
   ├─ Run on 256 images every epoch (fast CPU validation)
   ├─ Compute mAP@0.5, mAP@0.5:0.95
   ├─ Track precision/recall per class
   └─ Save best model (by mAP)

6. LOGGING
   ├─ Log: epoch, loss, lr, memory usage, ETA
   ├─ Save to tensorboard for visualization
   ├─ Save per-class metrics
   └─ Track data augmentation effects
```

### Training Stages

```
Stage 1: TRANSFER LEARNING (Epochs 1-10)
├─ Frozen backbone, train head only
├─ Fast convergence, lower data requirement
├─ Establish baseline metrics
└─ ~2-3 hours with CPU

Stage 2: FINE-TUNING (Epochs 11-30)
├─ Unfreeze backbone layers gradually
├─ Slower learning rate (0.001)
├─ Better feature adaptation
└─ ~8-12 hours with CPU

Stage 3: EXTENDED TRAINING (Epochs 31-100)
├─ Full model training
├─ Learning rate decay schedule
├─ Aggressive augmentation
├─ Monitor for overfitting
└─ ~40-60 hours with CPU

TOTAL TRAINING TIME ESTIMATE:
├─ Best case (50 epochs): 32-48 hours CPU time
├─ Extended (100 epochs): 64-96 hours CPU time
└─ Real time: 3-7 days (depending on background tasks)
```

### Expected Performance

```
Target metrics (after full training):
├─ mAP@0.5: 0.60-0.75 (circuit component detection)
├─ mAP@0.5:0.95: 0.35-0.50 (stricter evaluation)
├─ Precision: 0.70-0.85 (less false positives)
├─ Recall: 0.65-0.80 (catch most components)
└─ Per-class F1: 0.65-0.80 (balanced performance)

Factors affecting performance:
✓ Data quality (unlabeled component images impact)
✓ Class imbalance (45 + 36 + 7 + 36 classes = complex)
✓ Component diversity (physical vs schematic)
✓ Augmentation strategy
✗ CPU constraints (slower convergence than GPU)
```

---

## 🚀 PHASE 4: DEPLOYMENT & INTEGRATION (Days 41+)

### Model Export & Inference

```python
# After training completes:

1. EXPORT BEST MODEL
   ├─ Load best.pt checkpoint
   ├─ Export to ONNX format (CPU inference optimized)
   └─ Save: ~/models/circuit-detector-yolov8s.onnx

2. CREATE INFERENCE WRAPPER
   ├─ Load ONNX model
   ├─ Implement batch prediction
   ├─ Add confidence threshold (0.5)
   ├─ Generate bounding boxes with class names
   └─ Return JSON format

3. INTEGRATE WITH BACKEND
   ├─ Update /api/circuit/analyze endpoint
   ├─ Load model on startup (async)
   ├─ Process image → predict → format result
   ├─ Return detected components + confidence
   └─ Cache model in memory (avoid reload)

4. TEST PIPELINE
   ├─ Unit tests: single image inference
   ├─ Integration tests: API endpoint
   ├─ Performance tests: batch processing speed
   ├─ Accuracy tests: known test set
   └─ Edge cases: blurry/small components
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Week 1: DATA PREPARATION

- [ ] **Task 1.1:** Merge YOLOv8 datasets
  - [ ] Load all 3 YOLO datasets
  - [ ] Create unified class mapping
  - [ ] Normalize label coordinates
  - [ ] Create train/val/test split
  - [ ] Validate no mismatches
  - [ ] Output: 4,841 images ready

- [ ] **Task 1.2:** Process component images
  - [ ] List all component categories
  - [ ] Create category→class_id mapping
  - [ ] Generate YOLO labels (full-image bbox)
  - [ ] Check for duplicates (MD5 hash)
  - [ ] Handle nested images/ directory
  - [ ] Output: 21,980 labeled images

- [ ] **Task 1.3:** Project 3D models to 2D
  - [ ] Set up 3D rendering pipeline
  - [ ] Implement multi-angle projection
  - [ ] Generate PNG images
  - [ ] Create bounding box labels
  - [ ] Test on sample models
  - [ ] Output: 1,404 synthetic images

- [ ] **Task 1.4:** Combine into unified dataset
  - [ ] Merge all sources
  - [ ] Create data.yaml config
  - [ ] Verify class distribution
  - [ ] Generate statistics report
  - [ ] Output: 28,225 images ready for training

### Week 2-6: TRAINING

- [ ] **Task 2.1:** Set up training environment
  - [ ] Install PyTorch CPU
  - [ ] Install YOLOv8
  - [ ] Create training script
  - [ ] Set up logging/tensorboard
  - [ ] Test on small batch

- [ ] **Task 2.2:** Run training pipeline
  - [ ] Stage 1: Transfer learning (10 epochs)
  - [ ] Checkpoint every epoch
  - [ ] Monitor metrics
  - [ ] Adjust parameters if needed

- [ ] **Task 2.3:** Extended training
  - [ ] Stage 2: Fine-tuning (20 epochs)
  - [ ] Stage 3: Full training (50+ epochs)
  - [ ] Weekly performance reviews
  - [ ] Watch for convergence

### Week 7: DEPLOYMENT

- [ ] **Task 3.1:** Export trained model
  - [ ] Load best checkpoint
  - [ ] Export to ONNX format
  - [ ] Test inference speed
  - [ ] Verify accuracy on test set

- [ ] **Task 3.2:** Create inference wrapper
  - [ ] Build inference service
  - [ ] Implement batch processing
  - [ ] Add confidence filtering
  - [ ] Format output (JSON)

- [ ] **Task 3.3:** Backend integration
  - [ ] Update API endpoint
  - [ ] Load model on startup
  - [ ] Test end-to-end
  - [ ] Performance profiling

---

## 💾 RESOURCE REQUIREMENTS

### Disk Space
```
Datasets: 1.7 GB (existing)
Training data (merged): 1.2-1.5 GB
Training checkpoints: 200-400 MB (multiple epochs)
Best model + exports: 100-150 MB
Total: ~3.5 GB
```

### Memory (RAM)
```
OS/System: ~2-3 GB
Dataset in memory: 2-3 GB (batch loading)
Model + optimizer: 2-3 GB
Total available: 16 GB → ~10-11 GB for training
Critical: Monitor to avoid OOM errors
```

### GPU (Optional)
```
If available (2GB):
├─ Can accelerate batch processing
├─ Use memory efficient settings
├─ Primary device: CPU (since 2GB limited)
└─ Fallback automatically if not available
```

### Time
```
Data preparation: 1 week
Training (50 epochs): 3-5 days
Training (100 epochs): 6-10 days
Integration & testing: 2-3 days
Total: 2-4 weeks (acceptable per user)
```

---

## ⚠️ KNOWN CHALLENGES & MITIGATIONS

| Challenge | Impact | Mitigation |
|-----------|--------|-----------|
| **CPU Training Performance** | Slow (weeks) | Acceptable; use reduced batch size, checkpoint frequently |
| **Out of Memory (OOM)** | Training crash | Reduce batch size to 2-4; monitor memory; enable gradient accumulation |
| **Class Imbalance** | Biased model | Use weighted loss; oversample minority classes; augmentation |
| **Component Images Unlabeled** | Lower accuracy | Generate full-image bbox (whole component = 1 object); accept quality limitation |
| **3D Model Projection** | Synthetic data quality | Use multiple angles; validate rendering; manual spot-check |
| **Dataset Size Variability** | Different resolutions | Normalize to 416×416 (YOLOv8 default); augmentation handles variations |
| **Class Definition Ambiguity** | Overlapping classes | Create class hierarchy; map redundant classes; test on validation set |

---

## 🎯 SUCCESS CRITERIA

### Model Accuracy (Primary)
- ✅ mAP@0.5 ≥ 0.60 (reasonable component detection)
- ✅ Precision ≥ 0.70 (fewer false positives)
- ✅ Recall ≥ 0.65 (catches most components)

### Inference Performance (Secondary)
- ✅ CPU inference ≤ 2 seconds per image (416×416)
- ✅ Batch processing ≤ 0.5 seconds per image (batch of 10)
- ✅ Memory footprint ≤ 200 MB (model + runtime)

### Integration Quality (Tertiary)
- ✅ API response ≤ 3 seconds (including I/O)
- ✅ 100% uptime (model preloaded, no timeout)
- ✅ Proper error handling (bad images, edge cases)

---

## 📞 NEXT STEPS

1. **Immediate (Today):** Review this plan, confirm data sources, identify any issues
2. **Day 1-3:** Implement data preparation scripts (merger, projector, component processor)
3. **Day 4:** Combine all data into unified dataset
4. **Day 5-40:** Run training pipeline with monitoring
5. **Day 41+:** Export model and integrate with backend

**Estimated Total Timeline:** 6-8 weeks (with flexibility based on performance)

---

**Created:** April 7, 2026  
**Ready to execute:** YES ✅  
**Dependencies:** Python 3.10+, PyTorch, YOLOv8, trimesh, open3d, numpy, opencv
