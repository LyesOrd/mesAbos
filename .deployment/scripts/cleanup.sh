#!/bin/bash

# Script de nettoyage des ressources AWS pour MesAbos
# Usage: ./cleanup.sh [--force]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="$(dirname "$SCRIPT_DIR")"

# Charger la configuration
export $(grep -v '^#' "$DEPLOYMENT_DIR/config.env" | xargs)

FORCE_DELETE=${1:-false}

echo -e "${YELLOW}🧹 Nettoyage des ressources AWS MesAbos${NC}"

if [ "$FORCE_DELETE" != "--force" ]; then
    echo -e "${RED}⚠️  ATTENTION: Cette opération va supprimer TOUTES les ressources AWS !${NC}"
    echo -e "${RED}   - Cluster ECS et services${NC}"
    echo -e "${RED}   - Base de données RDS${NC}"  
    echo -e "${RED}   - Load Balancer${NC}"
    echo -e "${RED}   - Repositories ECR${NC}"
    echo -e "${RED}   - Stack CloudFormation${NC}"
    echo ""
    read -p "Êtes-vous sûr de vouloir continuer? (tapez 'DELETE' pour confirmer): " confirmation
    if [ "$confirmation" != "DELETE" ]; then
        echo -e "${GREEN}✅ Opération annulée${NC}"
        exit 0
    fi
fi

# 1. Supprimer les services ECS
echo -e "${YELLOW}🗑️  Suppression des services ECS...${NC}"
for service in "$BACK_SERVICE_NAME" "$FRONT_SERVICE_NAME"; do
    if aws ecs describe-services --cluster "$CLUSTER_NAME" --services "$service" --region "$AWS_REGION" > /dev/null 2>&1; then
        echo -e "${YELLOW}   Mise à l'échelle du service $service à 0...${NC}"
        aws ecs update-service --cluster "$CLUSTER_NAME" --service "$service" --desired-count 0 --region "$AWS_REGION" > /dev/null
        
        echo -e "${YELLOW}   Suppression du service $service...${NC}"
        aws ecs delete-service --cluster "$CLUSTER_NAME" --service "$service" --region "$AWS_REGION" > /dev/null
    fi
done

# 2. Supprimer les images ECR
echo -e "${YELLOW}🗑️  Suppression des repositories ECR...${NC}"
for repo in "$APP_NAME-back" "$APP_NAME-front"; do
    if aws ecr describe-repositories --repository-names "$repo" --region "$AWS_REGION" > /dev/null 2>&1; then
        echo -e "${YELLOW}   Suppression du repository $repo...${NC}"
        aws ecr delete-repository --repository-name "$repo" --force --region "$AWS_REGION" > /dev/null
    fi
done

# 3. Supprimer la stack CloudFormation
echo -e "${YELLOW}🗑️  Suppression de l'infrastructure CloudFormation...${NC}"
STACK_NAME="$APP_NAME-infrastructure"
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" > /dev/null 2>&1; then
    aws cloudformation delete-stack --stack-name "$STACK_NAME" --region "$AWS_REGION"
    echo -e "${YELLOW}⏳ Attente de la suppression de la stack...${NC}"
    aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" --region "$AWS_REGION"
fi

# 4. Supprimer les log groups
echo -e "${YELLOW}🗑️  Suppression des log groups CloudWatch...${NC}"
for log_group in "/ecs/$APP_NAME" "/ecs/$APP_NAME-backend" "/ecs/$APP_NAME-frontend"; do
    if aws logs describe-log-groups --log-group-name-prefix "$log_group" --region "$AWS_REGION" --query 'logGroups[0]' > /dev/null 2>&1; then
        echo -e "${YELLOW}   Suppression du log group $log_group...${NC}"
        aws logs delete-log-group --log-group-name "$log_group" --region "$AWS_REGION" 2>/dev/null || true
    fi
done

echo -e "${GREEN}🎉 Nettoyage terminé !${NC}"
echo -e "${GREEN}✅ Toutes les ressources AWS ont été supprimées${NC}"
