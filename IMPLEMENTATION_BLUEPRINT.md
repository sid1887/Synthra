# 🛠️ IMPLEMENTATION BLUEPRINT
## Exact Scripts to Build for Phase 1-2 (Data Preparation)

**Last Updated:** April 7, 2026  
**Status:** Ready for implementation  
**Estimated time for all 4 scripts:** 8-12 hours coding + 14-18 hours execution

---

## SCRIPT 1: YOLO Dataset Merger
**File:** `merge_yolo_datasets.py`  
**Purpose:** Combine 4 YOLOv8 datasets with consistent class mapping  
**Input:** 3 YOLOv8 dataset folders + archive(2)  
**Output:** Single merged dataset with unified classes  
**Execution time:** 2-3 hours  

### Implementation Requirements
```python
1. Load all 4 YOLO datasets from disk
   - Parse directory structure (train/images, train/labels)
   - Read image filenames
   - Read corresponding label files (txt format)
   
2. Class ID mapping
   - Analyze class distribution in each dataset
   - Create mapping table: old_dataset_id → unified_id
   - Handle class overlaps intelligently
   
3. Normalize coordinates
   - Read each label file (YOLO format)
   - Verify coordinates are normalized (0-1 range)
   - Fix any absolute coordinates
   
4. Merge strategy
   - circuit elements: all classes keep IDs (0-45) → offset to 0-45
   - Schematic: remap 0-35 → 46-81
   - Components: remap 0-6 → 82-88
   - archive(2): auto-detect and remap
   
5. Create output structure
   ├─ train/
   │  ├─ images/ (3,388 from merged)
   │  └─ labels/ (3,388)
   ├─ val/
   │  ├─ images/ (843)
   │  └─ labels/ (843)
   └─ test/
      ├─ images/ (610)
      └─ labels/ (610)

6. Validation
   - Verify every image has corresponding label
   - Check no corrupted images
   - Validate coordinate ranges
   - Save CLASS_MAPPING.json with unified schema
   
7. Logging
   - Track images merged per source
   - Log any class mapping conflicts
   - Save statistics to merge_stats.json
```

### Success Criteria
- ✅ All 4,841 images copied
- ✅ All labels normalized
- ✅ Proper train/val/test split (70/15/15)
- ✅ CLASS_MAPPING.json created with≥100 classes
- ✅ Zero mismatches (every image has label)

---

## SCRIPT 2: Component Image Processor
**File:** `process_component_images.py`  
**Purpose:** Convert categorized images to YOLO format  
**Input:** components/images/ with 37 category folders  
**Output:** YOLOv8-formatted images + labels  
**Execution time:** 4-6 hours (mostly I/O and hashing)  

### Implementation Requirements
```python
1. Enumerate categories
   - List all subdirectories in components/images/
   - Filter out "images" nested directory (special handling)
   - Assign class_id to each category (37 total → IDs 89-125)
   
2. Duplicate detection
   - For each image, compute MD5 hash
   - Check against seen hashes
   - Skip or merge duplicates
   
3. Label generation
   - Every image = 1 object (full component)
   - YOLO format: "class_id center_x center_y width height"
   - For each image: class_id 0.5 0.5 1.0 1.0
   
4. Handle nested structure
   - Check components/images/images/ folder
   - Determine if duplicate or unique content
   - If unique: merge into respective categories
   - If duplicate: skip (don't double-count)
   
5. Create output structure
   ├─ train/ (70% split, 15,386 images)
   │  ├─ images/
   │  └─ labels/
   ├─ val/ (15%, 3,297 images)
   │  ├─ images/
   │  └─ labels/
   └─ test/ (15%, 3,297 images)
       ├─ images/
       └─ labels/

6. Validation
   - Verify exactly 1 label per image
   - Check class_id is in valid range
   - Spot-check random samples visually
   - Generate per-category statistics
   
7. Logging
   - Track images per category
   - Log duplicates found (if any)
   - Save COMPONENT_CLASS_MAPPING.json
   - Save processing_stats.json
```

### Success Criteria
- ✅ All 21,980 images labeled (or fewer if duplicates)
- ✅ All labels verified (1 per image, format correct)
- ✅ Proper train/val/test split
- ✅ COMPONENT_CLASS_MAPPING.json (37 categories → IDs 89-125)
- ✅ Duplicate detection report

---

## SCRIPT 3: 3D Model Projector
**File:** `project_3d_to_2d.py`  
**Purpose:** Render 3D models from 6 angles → 2D PNG + labels  
**Input:** dataverse_files/ with OBJ/STL/OFF models  
**Output:** 1,404 PNG images + YOLO labels  
**Execution time:** 2-3 hours rendering  

### Implementation Requirements
```python
1. Setup 3D rendering pipeline
   - Import open3d or trimesh for 3D loading
   - Setup PyOpenGL or matplotlib for rendering
   - Configure virtual camera/viewport (512×512)
   
2. Load 3D models
   - For each model ID in train/val/test splits:
   │  ├─ Load OBJ format (primary)
   │  ├─ Or load STL (fallback)
   │  ├─ Or load OFF (fallback)
   │  └─ Verify model loaded successfully
   
3. Render 6 views per model
   - View 1: Top-down (0°, 0°, 0° yaw/pitch/roll)
   - View 2: Front (0°, 90°, 0°)
   - View 3: Side (90°, 0°, 0°)
   - View 4: Isometric-1 (45°, 45°, 0°)
   - View 5: Isometric-2 (45°, 135°, 0°)
   - View 6: Isometric-3 (45°, 225°, 0°)
   
4. Generate bounding box
   - Project 3D vertices onto 2D plane
   - Find min/max x, y of projection
   - Convert to YOLO normalized format:
     │  ├─ center_x = (min_x + max_x) / 2 / image_width
     │  ├─ center_y = (min_y + max_y) / 2 / image_height
     │  ├─ bbox_width = (max_x - min_x) / image_width
     │  └─ bbox_height = (max_y - min_y) / image_height
   
5. Save outputs
   - Save PNG: models_3d_projected/{split}/{model_id}_{angle}.png
   - Save label: models_3d_projected_labels/{model_id}_{angle}.txt
   - Label format: class_id center_x center_y width height
   - Class_id: 126 (unified ID for 3D projections)
   
6. Split management
   - Train (163 models × 6 = 978 images)
   - Val (47 models × 6 = 282 images)
   - Test (24 models × 6 = 144 images)
   
7. Validation
   - Verify PNG readable (try load with PIL)
   - Verify labels valid (coordinates in 0-1)
   - Spot-check visual rendering (save samples)
   - Log any failed renderings
   
8. Logging
   - Track successful/failed renders
   - Save rendering_stats.json
   - Save sample images for QA review
```

### Success Criteria
- ✅ 1,404 PNG images generated (234 × 6)
- ✅ All labels valid (class 126, normalized coords)
- ✅ Proper train/val/test split maintained
- ✅ No rendering errors (or logged with fallback)
- ✅ Sample images saved for visual inspection

---

## SCRIPT 4: Dataset Assembler
**File:** `assemble_unified_dataset.py`  
**Purpose:** Combine all 3 processed sources into final unified corpus  
**Input:** Outputs from Scripts 1-3  
**Output:** Single training-ready dataset with data.yaml  
**Execution time:** 1-2 hours (copy + validation)  

### Implementation Requirements
```python
1. Load all three processed datasets
   - Load merged YOLO (from Script 1)
   - Load component images (from Script 2)
   - Load 3D projections (from Script 3)
   
2. Consolidate class mappings
   - Merged YOLO: classes 0-~50
   - Components: classes 89-125
   - 3D projections: class 126
   - Create final UNIFIED_CLASS_MAPPING.json
   - Document all class names and IDs
   
3. Combine into single structure
   ```
   unified_dataset/
   ├── train/
   │   ├── images/ (copy all train images)
   │   └── labels/ (copy all train labels)
   ├── val/
   │   ├── images/
   │   └── labels/
   ├── test/
   │   ├── images/
   │   └── labels/
   ├── data.yaml
   ├── STATISTICS.json
   ├── CLASS_MAPPING.json
   └── PREPARATION_LOG.json
   ```
   
4. Re-split if needed
   - Combine all images: ~28,225
   - Split randomly: 70% train, 15% val, 15% test
   - Preserve stratification (similar class distribution)
   - Verify no data leakage (image not in multiple splits)
   
5. Create data.yaml (YOLOv8 config)
   ```yaml
   path: /path/to/unified_dataset
   train: train/images
   val: val/images
   test: test/images
   nc: 127  # total classes
   names: ['class_0', 'class_1', ..., 'class_126']
   ```
   
6. Generate statistics
   - Count images per split
   - Count labels per class
   - Compute class distribution
   - Generate histograms (JSON)
   - Identify class imbalances
   
7. Validation
   - Every image has label (1:1 mapping)
   - No corrupted files
   - No duplicate images across splits
   - Class IDs consistent
   - Splits don't overlap (train ∩ val = ∅)
   
8. Create preparation report
   - Document sources and contributions
   - List class mappings
   - Record statistics
   - Note any issues encountered
   - Save to PREPARATION_LOG.md
```

### Success Criteria
- ✅ 28,225 images in unified structure
- ✅ Proper 70/15/15 split
- ✅ Zero file corruption
- ✅ data.yaml created correctly
- ✅ STATISTICS.json complete
- ✅ Preparation report generated

---

## 📋 EXECUTION CHECKLIST

### Pre-execution Setup
- [ ] Python 3.10+ installed
- [ ] Required libraries: numpy, opencv-python, Pillow, trimesh, open3d
- [ ] Disk space: ~3 GB available
- [ ] RAM available: ~8 GB minimum

### Run Scripts in Order
- [ ] **Script 1:** `python merge_yolo_datasets.py`
  - Input validation: 4 source folders exist
  - Monitor: Console output, statistics
  - Verify: ~/training_data/merged_yolo/ created with 4,841 images
  - Time: 2-3 hours

- [ ] **Script 2:** `python process_component_images.py`
  - Input validation: components/images/ exists
  - Monitor: Category enumeration, duplicate detection
  - Verify: ~/training_data/components/ created with 21,980 images
  - Time: 4-6 hours

- [ ] **Script 3:** `python project_3d_to_2d.py`
  - Input validation: dataverse_files/ exists
  - Monitor: Render progress (234 models × 6 angles)
  - Verify: ~/training_data/3d_projected/ created with 1,404 images
  - Time: 2-3 hours
  - Troubleshoot: If rendering fails, check OpenGL setup

- [ ] **Script 4:** `python assemble_unified_dataset.py`
  - Input validation: All 3 processed datasets exist
  - Monitor: Merge progress, statistics generation
  - Verify: ~/training_data/unified/ created with 28,225 images
  - Time: 1-2 hours

### Post-execution QA
- [ ] Verify directory structure correct
- [ ] Check file counts: images vs labels (must match)
- [ ] Validate data.yaml (can load with YOLOv8)
- [ ] Check statistics: class distribution reasonable
- [ ] Spot-check 10 random images + labels (visual inspection
- [ ] Confirm total disk space ~1.2-1.5 GB

---

## 🎯 QUALITY GATES

Before proceeding to Training Phase:

```
Pass/Fail Checklist:
├─ ✅ All 28,225 images present
├─ ✅ All 28,225 labels present (1:1)
├─ ✅ Zero corrupted files
├─ ✅ Train/val/test split verified
├─ ✅ Class IDs in valid range (0-126)
├─ ✅ Bounding boxes normalized (0-1)
├─ ✅ data.yaml syntax valid
├─ ✅ Statistics computed
├─ ✅ Preparation report complete
└─ ✅ Ready for training!
```

---

## 📊 EXPECTED OUTPUT STRUCTURE

```
c:\Synthra\training_data\
├── merged_yolo/              (Script 1 output)
│   ├── train/images/         (2,938 images)
│   ├── train/labels/
│   ├── val/images/           (734 images)
│   ├── val/labels/
│   ├── test/images/          (611 images)
│   ├── test/labels/
│   └── merge_stats.json
│
├── components/               (Script 2 output)
│   ├── train/images/         (15,386 images)
│   ├── train/labels/
│   ├── val/images/           (3,297 images)
│   ├── val/labels/
│   ├── test/images/          (3,297 images)
│   ├── test/labels/
│   └── processing_stats.json
│
├── 3d_projected/             (Script 3 output)
│   ├── train/images/         (978 PNG)
│   ├── train/labels/
│   ├── val/images/           (282 PNG)
│   ├── val/labels/
│   ├── test/images/          (144 PNG)
│   ├── test/labels/
│   └── rendering_stats.json
│
└── unified/                  (Script 4 output - FINAL)
    ├── train/
    │   ├── images/           (19,758 images)
    │   └── labels/           (19,758 txt)
    ├── val/
    │   ├── images/           (2,959 images)
    │   └── labels/           (2,959 txt)
    ├── test/
    │   ├── images/           (2,959 images)
    │   └── labels/           (2,959 txt)
    ├── data.yaml             ← Required for YOLOv8
    ├── STATISTICS.json
    ├── CLASS_MAPPING.json
    ├── PREPARATION_LOG.md
    └── UNIFIED_CLASS_MAPPING.json
```

---

## 💡 IMPLEMENTATION NOTES

1. **Script 1 (YOLO Merger):**
   - Most straightforward (file copying + label parsing)
   - Key challenge: class mapping conflicts
   - Use simple offset strategy first (classes 0-45, then 46-81, etc.)

2. **Script 2 (Component Processor):**
   - Simple but time-consuming (21,980 images to process)
   - MD5 hashing for duplicates (CPU-intensive)
   - Benefit: One full-image bbox per image = simple labeling

3. **Script 3 (3D Projector):**
   - Most complex (requires 3D rendering setup)
   - Dependencies: open3d, PyOpenGL, or trimesh
   - Potential issues: OpenGL drivers, library compatibility
   - Fallback: Use trimesh + matplotlib (slower but more portable)

4. **Script 4 (Assembler):**
   - Final validation and report generation
   - Creates data.yaml (critical for YOLOv8 training)
   - Double-check class IDs don't overlap after merge

---

## ✅ READY TO IMPLEMENT!

All 4 scripts need to be created and executed in sequence.  
Total time: ~1 week for assembly + data prep + validation

**Next step:** Start with Script 1 implementation

