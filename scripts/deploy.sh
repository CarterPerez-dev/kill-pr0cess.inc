#!/bin/bash

# Google Cloud deployment script for maximum performance
# I'm setting up the infrastructure to showcase our speed optimizations

set -e

PROJECT_ID=${GOOGLE_CLOUD_PROJECT_ID}
REGION=${GOOGLE_CLOUD_REGION:-us-central1}
SERVICE_NAME="dark-performance-showcase"

echo "🚀 Deploying Dark Performance Showcase to Google Cloud..."

# Build and push container images
echo "📦 Building container images..."

# Backend image
docker build -t gcr.io/${PROJECT_ID}/${SERVICE_NAME}-backend:latest ./backend
docker push gcr.io/${PROJECT_ID}/${SERVICE_NAME}-backend:latest

# Frontend image
docker build -t gcr.io/${PROJECT_ID}/${SERVICE_NAME}-frontend:latest ./frontend
docker push gcr.io/${PROJECT_ID}/${SERVICE_NAME}-frontend:latest

# Deploy to Cloud Run with performance optimizations
echo "🌩️ Deploying to Cloud Run..."

# Backend service
gcloud run deploy ${SERVICE_NAME}-backend \
  --image gcr.io/${PROJECT_ID}/${SERVICE_NAME}-backend:latest \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --concurrency 100 \
  --max-instances 10 \
  --set-env-vars="DATABASE_URL=${DATABASE_URL},REDIS_URL=${REDIS_URL},GITHUB_TOKEN=${GITHUB_TOKEN}" \
  --port 3001

# Frontend service
gcloud run deploy ${SERVICE_NAME}-frontend \
  --image gcr.io/${PROJECT_ID}/${SERVICE_NAME}-frontend:latest \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --concurrency 1000 \
  --max-instances 5 \
  --port 3000

# Set up load balancer for optimal performance
echo "⚡ Configuring load balancer..."

# Create backend service
gcloud compute backend-services create ${SERVICE_NAME}-backend-service \
  --global \
  --protocol HTTP \
  --health-checks ${SERVICE_NAME}-health-check \
  --enable-cdn

# Create frontend backend service
gcloud compute backend-services create ${SERVICE_NAME}-frontend-service \
  --global \
  --protocol HTTP \
  --enable-cdn

echo "✅ Deployment complete!"
echo "🌐 Your dark performance showcase is live!"
