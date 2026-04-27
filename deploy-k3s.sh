#!/bin/bash
# =============================================================================
# deploy-k3s.sh — Deploy the Contacts App on a k3s cluster
# =============================================================================
# Usage:
#   chmod +x deploy-k3s.sh
#   ./deploy-k3s.sh          # full deploy
#   ./deploy-k3s.sh --clean  # delete everything and redeploy
# =============================================================================

set -e  # Exit immediately if a command fails

# ─── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
success(){ echo -e "${GREEN}[OK]${NC}    $1"; }
warn()   { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ─── Variables ────────────────────────────────────────────────────────────────
NAMESPACE="contacts-lab"
BACKEND_IMAGE="lab-backend:latest"
FRONTEND_IMAGE="lab-frontend:latest"
K8S_DIR="./k8s"

# ─── Check prerequisites ──────────────────────────────────────────────────────
check_prerequisites() {
  log "Checking prerequisites..."

  command -v docker   &>/dev/null || error "Docker is not installed or not in PATH"
  command -v kubectl  &>/dev/null || error "kubectl is not installed or not in PATH"
  command -v k3s      &>/dev/null || warn  "k3s binary not found in PATH (may be fine if using remote kubeconfig)"

  success "Prerequisites OK"
}

# ─── Optional: clean existing deployment ─────────────────────────────────────
clean_deployment() {
  warn "Deleting existing namespace '$NAMESPACE' and all its resources..."
  kubectl delete namespace "$NAMESPACE" --ignore-not-found=true
  log "Waiting for namespace to be fully removed..."
  kubectl wait --for=delete namespace/"$NAMESPACE" --timeout=60s 2>/dev/null || true
  success "Clean done"
}

# ─── Step 1: Build Docker images ─────────────────────────────────────────────
build_images() {
  log "Building Docker images..."

  docker build -f Dockerfile.backend -t "$BACKEND_IMAGE" . \
    || error "Failed to build backend image"
  success "Built $BACKEND_IMAGE"

  docker build -f Dockerfile.frontend -t "$FRONTEND_IMAGE" . \
    || error "Failed to build frontend image"
  success "Built $FRONTEND_IMAGE"
}

# ─── Step 2: Import images into k3s ──────────────────────────────────────────
# k3s uses its own containerd runtime — it does NOT share Docker's image cache.
# Images must be exported from Docker and imported into k3s containerd.
import_images_to_k3s() {
  log "Importing images into k3s containerd runtime..."

  log "  → Exporting $BACKEND_IMAGE from Docker..."
  docker save "$BACKEND_IMAGE" -o /tmp/lab-backend.tar
  sudo k3s ctr images import /tmp/lab-backend.tar
  rm -f /tmp/lab-backend.tar
  success "  $BACKEND_IMAGE imported"

  log "  → Exporting $FRONTEND_IMAGE from Docker..."
  docker save "$FRONTEND_IMAGE" -o /tmp/lab-frontend.tar
  sudo k3s ctr images import /tmp/lab-frontend.tar
  rm -f /tmp/lab-frontend.tar
  success "  $FRONTEND_IMAGE imported"
}

# ─── Step 3: Apply Kubernetes manifests ───────────────────────────────────────
apply_manifests() {
  log "Applying Kubernetes manifests..."

  # Order matters: namespace → config → storage → workloads → routing
  kubectl apply -f "$K8S_DIR/namespace.yaml"
  success "Namespace applied"

  kubectl apply -f "$K8S_DIR/app-config.yaml"
  success "ConfigMap + Secret applied"

  kubectl apply -f "$K8S_DIR/postgres-init.yaml"
  success "Postgres init script ConfigMap applied"

  kubectl apply -f "$K8S_DIR/postgres.yaml"
  success "Postgres Service + Deployment + PVC applied"

  kubectl apply -f "$K8S_DIR/backend.yaml"
  success "Backend Service + Deployment applied"

  kubectl apply -f "$K8S_DIR/frontend.yaml"
  success "Frontend Service + Deployment applied"

  kubectl apply -f "$K8S_DIR/ingress.yaml"
  success "Ingress (Traefik) applied"
}

# ─── Step 4: Wait for all pods to be Ready ───────────────────────────────────
wait_for_pods() {
  log "Waiting for all pods to become Ready (timeout: 3 minutes)..."

  kubectl wait pod \
    --namespace="$NAMESPACE" \
    --for=condition=Ready \
    --all \
    --timeout=180s \
    || error "Some pods did not become Ready in time. Run: kubectl get pods -n $NAMESPACE"

  success "All pods are Ready!"
}

# ─── Step 5: Print access info ───────────────────────────────────────────────
print_info() {
  echo ""
  echo -e "${GREEN}============================================${NC}"
  echo -e "${GREEN}  ✅  Deployment complete!${NC}"
  echo -e "${GREEN}============================================${NC}"
  echo ""
  echo -e "  📦 Namespace : ${YELLOW}$NAMESPACE${NC}"
  echo ""
  echo -e "  🌐 Access the app:"
  echo -e "     Via NodePort  → ${YELLOW}http://<k3s-node-ip>:30080${NC}"
  echo -e "     Via Ingress   → ${YELLOW}http://<k3s-node-ip>/${NC}"
  echo ""
  echo -e "  🔍 Useful commands:"
  echo -e "     kubectl get all -n $NAMESPACE"
  echo -e "     kubectl get pods -n $NAMESPACE"
  echo -e "     kubectl logs -n $NAMESPACE deployment/backend"
  echo -e "     kubectl logs -n $NAMESPACE deployment/postgres"
  echo ""
  echo -e "  🗑️  To delete everything:"
  echo -e "     kubectl delete namespace $NAMESPACE"
  echo ""
}

# ─── Main ─────────────────────────────────────────────────────────────────────
main() {
  echo ""
  echo -e "${BLUE}================================================${NC}"
  echo -e "${BLUE}  🚀 k3s Deployment — Contacts App${NC}"
  echo -e "${BLUE}================================================${NC}"
  echo ""

  check_prerequisites

  # Handle --clean flag
  if [[ "$1" == "--clean" ]]; then
    clean_deployment
  fi

  build_images
  import_images_to_k3s
  apply_manifests
  wait_for_pods
  print_info
}

main "$@"
