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
DOCKER_USER="nourki2003"
BACKEND_IMAGE="$DOCKER_USER/lab-backend:latest"
FRONTEND_IMAGE="$DOCKER_USER/lab-frontend:latest"
K8S_DIR="./k8s"

# ─── Check prerequisites ──────────────────────────────────────────────────────
check_prerequisites() {
  log "Checking prerequisites..."

  command -v docker   &>/dev/null || error "Docker is not installed or not in PATH"
  command -v kubectl  &>/dev/null || error "kubectl is not installed or not in PATH"

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

# ─── Step 1: Build & Push Docker images ─────────────────────────────────────
build_and_push_images() {
  log "Building and Pushing Docker images to Docker Hub..."

  log "  → Backend..."
  docker build -f Dockerfile.backend -t "$BACKEND_IMAGE" . \
    || error "Failed to build backend image"
  docker push "$BACKEND_IMAGE" || error "Failed to push backend image. Are you logged in? (docker login)"
  success "Backend image pushed"

  log "  → Frontend..."
  docker build -f Dockerfile.frontend -t "$FRONTEND_IMAGE" . \
    || error "Failed to build frontend image"
  docker push "$FRONTEND_IMAGE" || error "Failed to push frontend image. Are you logged in? (docker login)"
  success "Frontend image pushed"
}

# ─── Step 2: Apply Kubernetes manifests ───────────────────────────────────────
apply_manifests() {
  log "Applying Kubernetes manifests..."

  # Order matters: namespace → config → storage → workloads → routing
  kubectl apply -f "$K8S_DIR/namespace.yaml"
  kubectl apply -f "$K8S_DIR/app-config.yaml"
  kubectl apply -f "$K8S_DIR/postgres-init.yaml"
  kubectl apply -f "$K8S_DIR/postgres.yaml"
  kubectl apply -f "$K8S_DIR/backend.yaml"
  kubectl apply -f "$K8S_DIR/frontend.yaml"
  kubectl apply -f "$K8S_DIR/ingress.yaml"
  kubectl apply -f "$K8S_DIR/network-policy.yaml" 2>/dev/null || warn "NetworkPolicy not applied"
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
  echo -e "${BLUE}  🚀 Docker Hub Deployment — Contacts App${NC}"
  echo -e "${BLUE}================================================${NC}"
  echo ""

  check_prerequisites

  # Handle --clean flag
  if [[ "$1" == "--clean" ]]; then
    clean_deployment
  fi

  build_and_push_images
  apply_manifests
  wait_for_pods
  print_info
}

main "$@"
