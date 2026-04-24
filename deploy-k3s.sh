#!/bin/bash

# Build the docker images
echo "Building backend image..."
docker build -t lab-backend:latest -f Dockerfile.backend .

echo "Building frontend image..."
docker build -t lab-frontend:latest -f Dockerfile.frontend .

# Export images to tar archives and import them into k3s (since k3s uses containerd, it might not see docker images automatically)
# This assumes you have k3s running locally or have access to k3s ctr
# If using k3d, you would use: k3d image import lab-backend:latest lab-frontend:latest -c <cluster-name>
# Let's save them and import them
echo "Exporting images..."
docker save lab-backend:latest -o lab-backend.tar
docker save lab-frontend:latest -o lab-frontend.tar

echo "Importing images into k3s..."
sudo k3s ctr images import lab-backend.tar
sudo k3s ctr images import lab-frontend.tar

# Clean up tar files
rm lab-backend.tar lab-frontend.tar

# Apply Kubernetes manifests
echo "Applying Kubernetes manifests..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/app-config.yaml
kubectl apply -f k8s/postgres-init.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml

echo "Deployment complete!"
echo "Check the status of your pods:"
echo "kubectl get pods -n contacts-lab"
echo "Access the frontend at http://localhost:30080 or http://<k3s-node-ip>:30080"
