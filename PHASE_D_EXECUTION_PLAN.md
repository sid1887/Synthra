---
title: "PHASE D - EXECUTION PLAN"
subtitle: "Stateful Analysis Engine with Learning & Persistence"
date: "April 5, 2026"
status: "PLANNING"
---

# Phase D: Execution Plan
## Building State Continuity & Advanced Workflows

---

## Phase D Overview

**Goal**: Transform Synthra from **stateless request processor** → **stateful learning engine**

**Timeline**: 2-3 weeks
**Complexity**: High
**Risk**: Medium (database integration)

---

## Phase D Deliverables

### D1: State Persistence Layer
**Objective**: Add memory between requests

**Work**:
- PostgreSQL schema design
  - `analysis_history` table (1000s of past analyses)
  - `component_detections` table (normalized)
  - `circuit_patterns` table (learned patterns)
  - `user_feedback` table (corrections)
  - `execution_metrics` table (performance tracking)

- ORM integration (Prisma or TypeORM)
  ```typescript
  const analysis = await db.analysis.create({
    requestId,
    imageId,
    circuitLabel,
    components: [...],
    confidence: 0.85,
    executionTimeMs: 234,
  });
  ```

- Query optimization
  - Indexing strategy
  - Pagination for history
  - Full-text search on circuit labels

**Files to Create**:
- `backend/src/db/schema.prisma`
- `backend/src/db/migrations/001_initial.sql`
- `backend/src/db/queries.ts`
- `backend/src/modules/history-engine.ts`

**Effort**: 4-5 days

---

### D2: Analysis Caching & Deduplication
**Objective**: Avoid re-analyzing identical or near-identical images

**Work**:
- Image hash calculation (perceptual hash for similar images)
  ```typescript
  const hash = await calculateImageFingerprint(buffer);
  const cached = await db.analysis.findByImageHash(hash);
  if (cached && confidence > 0.95) return cached;
  ```

- Redis caching layer (optional, for performance)
  ```typescript
  cache.set(`analysis:${imageHash}`, result, ttl: 7 * 24 * 60 * 60);
  ```

- Deduplication detection
  - Same exact image uploaded twice → return cached analysis
  - Very similar image → suggest cached result ("Did you mean...?")
  - Different angle of same circuit → link to original

**Files to Create**:
- `backend/src/modules/image-fingerprint.ts`
- `backend/src/modules/cache-engine.ts`
- `backend/src/db/similarity-queries.ts`

**Effort**: 2-3 days

---

### D3: Confidence Evolution Tracking
**Objective**: Track how confidence changes across similar analyses

**Work**:
- Store confidence metrics per component over time
  ```
  Battery detection confidence:
  - Analysis 1: 0.94
  - Analysis 2: 0.91
  - Analysis 3: 0.96
  → Average: 0.94 (reliable)
  ```

- Identify problematic components (consistently low confidence)
  ```typescript
  const problemComponents = await db.query(`
    SELECT component_label, AVG(confidence) as avg_conf
    FROM detections
    GROUP BY component_label
    HAVING avg_conf < 0.7
  `);
  ```

- Suggest model improvements
  ```
  Alert: "Capacitors detected with 0.62 avg confidence"
  Recommendation: "Need more training data or model fine-tuning"
  ```

**Files to Create**:
- `backend/src/modules/confidence-analytics.ts`
- `backend/src/db/analytics-queries.ts`

**Effort**: 1-2 days

---

### D4: Component Pattern Learning
**Objective**: Build database of real component patterns

**Work**:
- Store successful detection patterns
  ```json
  [
    {
      pattern: "LED + Resistor + Battery",
      confidence: 0.95,
      occurrences: 147,
      lastSeen: "2026-04-05",
      avgExecutionTime: 234,
      commonErrors: []
    }
  ]
  ```

- Rank patterns by reliability
  - Sort by (occurrences * confidence)
  - Weight recent analyses more heavily
  - Track failure rate

- Use patterns for early detection
  ```typescript
  const topPatterns = await db.getTopPatterns(limit: 10);
  // If current components match top pattern with high confidence
  // → fast-track to results without full analysis
  ```

**Files to Create**:
- `backend/src/modules/pattern-learning.ts`
- `backend/src/jobs/pattern-aggregation.ts` (daily batch job)

**Effort**: 2-3 days

---

### D5: User Feedback Loop
**Objective**: Allow users to correct analyses → improve future detections

**Work**:
- Correction API endpoints
  ```typescript
  POST /api/feedback/:analysisId
  {
    corrections: [
      { componentId: "cmp_001", correctLabel: "resistor" },
      { circuitLabel: "battery_resistor_led_actual" }
    ]
  }
  ```

- Store corrections in database
  ```typescript
  await db.feedback.create({
    analysisId,
    corrections,
    userId,
    timestamp
  });
  ```

- Track correction patterns
  ```
  "LED detected as capacitor": 23 times
  "Resistor value misread": 156 times
  → Trigger retraining for problematic categories
  ```

- Impact measurement
  ```
  User corrected: analysis_001
  → Retrain model on this image
  → Reprocess similar analyses with updated model
  → Compare confidence before/after
  ```

**Files to Create**:
- `backend/src/routes/feedback.ts`
- `backend/src/modules/feedback-engine.ts`
- `frontend/src/components/FeedbackForm.tsx`

**Effort**: 2-3 days

---

### D6: Advanced Automation Workflows
**Objective**: Full automation rule engine with learning

**Work**:
- Extend current automation engine
  ```typescript
  // Current: Just evaluate rules
  
  // Phase D: Track automation effectiveness
  interface AutomationOutcome {
    ruleId: string;
    triggered: boolean;
    suggested_action: string;
    user_accepted: boolean;
    feedback: string;
  }
  ```

- Automation workflow builder
  ```
  Rule: IF low_confidence AND multiple_components
        THEN request_second_angle AND highlight_uncertain_regions
  
  Outcome tracking:
  - 87% accuracy when rule triggered
  - Average resolution time: 45 seconds
  - User satisfaction: 4.2/5
  ```

- Adaptive thresholds
  ```typescript
  // Learn optimal confidence threshold for each circuit type
  const optimalThreshold = await db.query(`
    SELECT circuit_type, AVG(confidence) as threshold
    FROM successful_analyses
    WHERE user_accepted = true
    GROUP BY circuit_type
  `);
  ```

**Files to Modify**:
- `backend/src/modules/automation-engine.ts` (extend)
- `backend/src/modules/rule-learner.ts` (new)
- `backend/src/db/automation-queries.ts` (new)

**Effort**: 3-4 days

---

### D7: Performance Optimization
**Objective**: Support scaling to 1000s of concurrent users

**Work**:
- Database query optimization
  - Explain plans for slow queries
  - Caching layer for frequent queries
  - Connection pooling (pgBouncer)

- API response streaming
  ```typescript
  // Long operations return stream of events
  POST /api/analyze?stream=true
  
  // Client receives:
  { "stage": "detection", "progress": 0.2 }
  { "stage": "identification", "progress": 0.5 }
  { "stage": "simulation", "progress": 0.9 }
  { "complete": true, "data": {...} }
  ```

- Request batching
  ```typescript
  POST /api/batch-analyze
  [
    { imageId: 1, file },
    { imageId: 2, file },
    { imageId: 3, file }
  ]
  // Returns results as ready
  ```

- Async job queue (Bull or BullMQ)
  ```typescript
  // Heavy simulations run in background
  const job = await simulationQueue.add({
    analysisId,
    circuitId,
    parameters
  });
  
  // Poll for results
  GET /api/simulation/:jobId/status
  ```

**Files to Create**:
- `backend/src/jobs/queue-config.ts`
- `backend/src/api/streaming.ts`
- `backend/src/api/batch.ts`
- `backend/src/db/connection-pool.ts`

**Effort**: 3-4 days

---

### D8: Analytics Dashboard
**Objective**: Real-time insights into system health & usage

**Work**:
- Metrics collection
  ```
  Key metrics:
  - Analyses per hour
  - Avg confidence by circuit type
  - Most common circuits
  - Error rates by component
  - User correction patterns
  - Processing time trends
  ```

- API endpoints for dashboards
  ```typescript
  GET /api/analytics/summary
  GET /api/analytics/confidence-trends
  GET /api/analytics/component-accuracy
  GET /api/analytics/automation-effectiveness
  ```

- Grafana visualization (optional)
  - Query metrics from PostgreSQL
  - Create dashboards
  - Set up alerts

**Files to Create**:
- `backend/src/routes/analytics.ts`
- `backend/src/modules/metrics-engine.ts`
- `frontend/src/pages/Dashboard.tsx`

**Effort**: 2-3 days

---

### D9: Model Fine-tuning Pipeline
**Objective**: Continuously improve AI detection models

**Work**:
- Collect training data from analyses
  ```
  Each analysis with user confirmation becomes training data
  - Original image
  - Detection annotations
  - Circuit label
  - User corrections
  ```

- Training job configuration
  ```typescript
  interface TrainingConfig {
    minDatapoints: 1000;
    retrainThreshold: 0.05; // 5% accuracy drop triggers retrain
    modelEvaluation: {
      precision: 0.94,
      recall: 0.91,
      f1: 0.92
    };
  }
  ```

- Model versioning
  ```
  models/
  ├── vision-v1.0.onnx (baseline)
  ├── vision-v1.1.onnx (tuned on 1K samples)
  ├── vision-v1.2.onnx (tuned on 5K samples)
  └── vision-v1.3.onnx (current production)
  ```

- A/B testing new models
  ```
  Route 10% of traffic to v1.3
  Compare confidence scores
  If v1.3 > v1.2 by 3%:
    → Graduate v1.3 to 50% traffic
    → Eventually 100%
  ```

**Files to Create**:
- `backend/src/jobs/model-training.ts`
- `backend/src/modules/model-versioning.ts`
- `backend/src/jobs/ab-testing.ts`

**Effort**: 4-5 days (assuming ML infrastructure)

---

## Phase D Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Synthra Phase D                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │           API Layer (Express.js)                │    │
│  │  /api/analyze (streaming)                       │    │
│  │  /api/batch-analyze                             │    │
│  │  /api/feedback                                  │    │
│  │  /api/analytics/*                               │    │
│  └──────────────────┬──────────────────────────────┘    │
│                     │                                     │
│  ┌──────────────────▼──────────────────────────────┐    │
│  │     Pipeline + Orchestrator (from Phase C)      │    │
│  │  - Detection Layer                              │    │
│  │  - Identification Layer                         │    │
│  │  - Optional Layer (gated)                       │    │
│  └──────────────────┬──────────────────────────────┘    │
│                     │                                     │
│  ┌──────────────────▼──────────────────────────────┐    │
│  │        Data Processing Engines                  │    │
│  │  ├─ Component Detection + Registry              │    │
│  │  ├─ Cache Engine (Redis)                        │    │
│  │  ├─ Image Fingerprinting                        │    │
│  │  ├─ Confidence Analytics                        │    │
│  │  ├─ Pattern Learning                            │    │
│  │  ├─ Feedback Processing                         │    │
│  │  └─ Automation Workflows                        │    │
│  └──────────────────┬──────────────────────────────┘    │
│                     │                                     │
│  ┌──────────────────▼──────────────────────────────┐    │
│  │      Background Job Queue (Bull)                │    │
│  │  ├─ Simulation (Heavy)                          │    │
│  │  ├─ Pattern Aggregation (Daily)                 │    │
│  │  ├─ Model Training (Weekly)                     │    │
│  │  ├─ A/B Testing (Continuous)                    │    │
│  │  └─ Feedback Incorporation (Daily)              │    │
│  └──────────────────┬──────────────────────────────┘    │
│                     │                                     │
│  ┌──────────────────▼──────────────────────────────┐    │
│  │         Persistence Layer                       │    │
│  │  ├─ PostgreSQL (analysis history, patterns)     │    │
│  │  ├─ Redis (caching, pub/sub)                    │    │
│  │  ├─ S3 (images, models)                         │    │
│  │  └─ Metrics DB (InfluxDB or PG)                 │    │
│  └──────────────────┬──────────────────────────────┘    │
│                     │                                     │
│  ┌──────────────────▼──────────────────────────────┐    │
│  │      ML Infrastructure                          │    │
│  │  ├─ Vision Model Serving (ONNX)                 │    │
│  │  ├─ Training Pipeline                           │    │
│  │  ├─ Model Versioning                            │    │
│  │  └─ Performance Tracking                        │    │
│  └──────────────────────────────────────────────────┘    │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Phase D Sprint Breakdown

### Week 1: Foundation
- **D1**: Database schema + ORM setup (full)
- **D2**: Image fingerprinting (core)
- **D3**: Confidence tracking (basic)

### Week 2: Features
- **D2**: Complete caching + deduplication
- **D5**: Feedback API + UI
- **D4**: Pattern learning aggregation

### Week 3: Advanced & Optimization
- **D6**: Advanced automation workflows
- **D7**: Performance optimization
- **D8**: Analytics dashboard
- **D9**: Model training pipeline (if ML resources available)

---

## Dependencies & Infrastructure

### Required
- PostgreSQL 13+ (analysis storage)
- Redis 6+ (caching + job queue)
- Node.js 18+ (supports native ESM)

### Optional but Recommended
- S3-compatible storage (MinIO or AWS S3)
- InfluxDB (time-series metrics)
- Grafana (dashboard visualization)
- ML training hardware (GPU for model fine-tuning)

### New Dependencies
```json
{
  "dependencies": {
    "prisma": "^5.0.0",
    "ioredis": "^5.0.0",
    "bull": "^4.0.0",
    "phash-image": "^1.0.0",
    "@influxdata/influxdb-client": "^1.0.0"
  }
}
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Database performance bottleneck | Medium | High | Connection pooling, indexing early |
| Redis cache invalidation issues | Medium | Medium | Use TTL + event-driven invalidation |
| Job queue backlog during peak | Low | Medium | Scale job workers horizontally |
| Model training instability | High | High | Start with smaller models, A/B test first |
| Data privacy concerns | Medium | High | Implement anonymization for stored images |

---

## Phase D Success Metrics

| Metric | Target | Phase C Baseline |
|--------|--------|-----------------|
| Avg response time | < 500ms | 1200ms |
| Avg confidence | 0.88+ | 0.82 |
| Cache hit rate | > 15% | 0% |
| User correction adoption | > 80% | N/A |
| Automation effectiveness | > 85% | 60% |
| Concurrent users supported | 100+ | 20 |
| Data retention (days) | 90+ | 0 |

---

## Architectural Decisions

### Database: PostgreSQL vs MongoDB
**Decision**: PostgreSQL
- **Reason**: Structured data (analyses, detections, metrics)
- **MongoDB**: Better for semi-structured logs

### Cache: Redis vs Memcached
**Decision**: Redis
- **Reason**: Supports pub/sub (job queue), Lua scripting, persistence

### Job Queue: Bull vs Celery
**Decision**: Bull (Node.js native)
- **Reason**: No extra Python infrastructure needed
- **Alternative**: Temporal for complex workflows (future)

### ML Model Format: ONNX vs TensorFlow
**Decision**: ONNX
- **Reason**: Hardware-agnostic, smaller file size, faster inference

---

## Phase D Timeline

```
Week 1:     ████ Foundation (DB, images, metrics)
Week 2:     ████ Features (Cache, feedback, patterns)
Week 3:     ████ Advanced (Automation, optimization, dashboard)
Testing:    ██ (continuous)
Deployment: ██ (end of week 3)

Total: 15 business days (~3 weeks)
```

---

## Phase D Deliverables Checklist

- [ ] PostgreSQL schema and migrations
- [ ] Prisma ORM configuration
- [ ] Image fingerprinting module
- [ ] Redis caching layer
- [ ] Analysis deduplication logic
- [ ] Confidence analytics queries
- [ ] Component pattern learning
- [ ] User feedback API + UI
- [ ] Feedback processing pipeline
- [ ] Advanced automation workflows
- [ ] API streaming endpoints
- [ ] Batch analyze endpoint
- [ ] Job queue setup (Bull)
- [ ] Query optimization
- [ ] Analytics dashboard
- [ ] Model versioning system
- [ ] A/B testing framework
- [ ] Performance monitoring
- [ ] Documentation
- [ ] Integration tests
- [ ] Load testing

---

## What Happens After Phase D?

### Phase E: Visual Enhancements
- Improve 3D rendering quality
- Add AR integration
- Real-time visualization over WebSocket

### Phase F: Mobile Apps
- React Native iOS/Android
- Uses same backend APIs
- Offline mode with sync

### Phase G: Enterprise Features
- Multi-user workspaces
- Permission system
- Audit logging
- White-label support

---

## Implementation Priority

### Must-Have (Week 1-2)
1. Database persistence
2. Deduplication
3. Feedback loop
4. Job queue for heavy operations

### Should-Have (Week 3)
1. Pattern learning
2. Performance optimization
3. Basic analytics

### Nice-To-Have (Post-Phase D)
1. Model fine-tuning
2. Advanced A/B testing
3. Grafana dashboards

---

## Success Definition

**Phase D is complete when**:
1. ✅ All analyses are stored and retrievable
2. ✅ Duplicate images detected and skipped
3. ✅ Users can provide feedback and see impact
4. ✅ System learns from correction patterns
5. ✅ Performance supports 100+ concurrent users
6. ✅ No single point of failure (DB replicas, etc.)
7. ✅ Analytics dashboard visible in-app

---

**Status**: 🟡 **IN PLANNING**
**Ready to Start**: Yes
**Estimated Effort**: 15 business days
**Team Size**: 2-3 developers
**Next Step**: Create detailed sprint planning doc

