#!/bin/bash

# Script de redéploiement rapide (images seulement)
# Usage: ./redeploy.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
DEPLOYMENT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${GREEN}🚀 Redéploiement rapide MesAbos${NC}"

# Charger la configuration
export $(grep -v '^#' "$DEPLOYMENT_DIR/config.env" | xargs)

# Authentification Docker ECR
echo -e "${YELLOW}🔐 Authentification ECR...${NC}"
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"

# Build et push backend
echo -e "${YELLOW}🔨 Build image backend...${NC}"
cd "$ROOT_DIR/back"
docker build -t "$ECR_REGISTRY/$APP_NAME-back:latest" .
docker push "$ECR_REGISTRY/$APP_NAME-back:latest"

# Build et push frontend  
echo -e "${YELLOW}🔨 Build image frontend...${NC}"
cd "$ROOT_DIR/front"
docker build -t "$ECR_REGISTRY/$APP_NAME-front:latest" .
docker push "$ECR_REGISTRY/$APP_NAME-front:latest"

# Force redéploiement des services
echo -e "${YELLOW}🔄 Redéploiement des services...${NC}"
aws ecs update-service --cluster "$CLUSTER_NAME" --service "$BACK_SERVICE_NAME" --force-new-deployment --region "$AWS_REGION" > /dev/null
aws ecs update-service --cluster "$CLUSTER_NAME" --service "$FRONT_SERVICE_NAME" --force-new-deployment --region "$AWS_REGION" > /dev/null

echo -e "${YELLOW}⏳ Attente stabilisation...${NC}"
aws ecs wait services-stable --cluster "$CLUSTER_NAME" --services "$BACK_SERVICE_NAME" "$FRONT_SERVICE_NAME" --region "$AWS_REGION"

echo -e "${GREEN}✅ Redéploiement terminé !${NC}"
echo -e "${GREEN}🌐 Application: https://$DOMAIN_NAME${NC}"
