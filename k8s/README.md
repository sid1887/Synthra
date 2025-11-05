# Synthra Kubernetes Deployment

Production deployment manifests for Synthra EDA platform.

## Quick Start

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n synthra

# Access via LoadBalancer
kubectl get svc -n synthra synthra-ingress
```

## Structure

- `namespace.yaml` - Dedicated namespace for Synthra
- `configmap.yaml` - Environment configuration
- `secrets.yaml` - Sensitive data (database credentials, API keys)
- `postgres.yaml` - PostgreSQL database with persistent volume
- `redis.yaml` - Redis for caching and job queue
- `api-gateway.yaml` - API gateway service
- `vision.yaml` - Vision service for image detection
- `core.yaml` - Core service for netlist/HDL generation
- `simulator.yaml` - Circuit simulator
- `docs.yaml` - PDF documentation generator
- `sve.yaml` - SVE AI symbol generator (GPU-enabled)
- `realtime.yaml` - WebSocket real-time collaboration
- `frontend.yaml` - React frontend
- `ingress.yaml` - Ingress controller for external access
- `hpa.yaml` - Horizontal Pod Autoscalers
- `monitoring.yaml` - Prometheus + Grafana

## Prerequisites

- Kubernetes 1.24+
- kubectl configured
- NVIDIA GPU Operator (for SVE service)
- Persistent storage provisioner
- Ingress controller (nginx)

## Configuration

1. Update secrets:
```bash
kubectl create secret generic synthra-secrets \
  --from-literal=postgres-password=your-password \
  --from-literal=redis-password=your-password \
  -n synthra
```

2. Configure GPU node labels:
```bash
kubectl label nodes <gpu-node> nvidia.com/gpu=true
```

3. Update ingress domain in `ingress.yaml`

## Scaling

```bash
# Scale services manually
kubectl scale deployment synthra-api --replicas=3 -n synthra

# HPA will auto-scale based on CPU/memory
kubectl get hpa -n synthra
```

## Monitoring

```bash
# Port-forward Grafana
kubectl port-forward svc/grafana 3000:3000 -n synthra

# Access at http://localhost:3000
# Default credentials: admin / admin
```
