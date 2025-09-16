#!/bin/bash

# Script de déploiement complet pour MesAbos
# Usage: ./deploy.sh [environment]

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_DIR="$(dirname "$DEPLOYMENT_DIR")"

ENV=${1:-production}
echo -e "${GREEN}🚀 Déploiement MesAbos - Environnement: $ENV${NC}"

# Charger la configuration
if [ ! -f "$DEPLOYMENT_DIR/config.env" ]; then
    echo -e "${RED}❌ Fichier de configuration manquant: $DEPLOYMENT_DIR/config.env${NC}"
    exit 1
fi

# Export des variables d'environnement
export $(grep -v '^#' "$DEPLOYMENT_DIR/config.env" | xargs)

# Vérifier les prérequis
echo -e "${YELLOW}📋 Vérification des prérequis...${NC}"
command -v aws >/dev/null 2>&1 || { echo -e "${RED}❌ AWS CLI requis${NC}"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker requis${NC}"; exit 1; }
command -v jq >/dev/null 2>&1 || { echo -e "${RED}❌ jq requis${NC}"; exit 1; }

# Vérifier la connectivité AWS
aws sts get-caller-identity > /dev/null || { echo -e "${RED}❌ Authentification AWS requise${NC}"; exit 1; }

echo -e "${GREEN}✅ Prérequis validés${NC}"

# 1. Déployer l'infrastructure si nécessaire
echo -e "${YELLOW}🏗️  Déploiement de l'infrastructure...${NC}"
STACK_NAME="$APP_NAME-infrastructure"

aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Stack d'infrastructure existante trouvée${NC}"
else
    echo -e "${YELLOW}📦 Création de la stack d'infrastructure...${NC}"
    aws cloudformation create-stack \
        --stack-name "$STACK_NAME" \
        --template-body "file://$DEPLOYMENT_DIR/aws/infrastructure.yml" \
        --parameters \
            ParameterKey=AppName,ParameterValue="$APP_NAME" \
            ParameterKey=DomainName,ParameterValue="$DOMAIN_NAME" \
            ParameterKey=DBPassword,ParameterValue="$DB_PASSWORD" \
            ParameterKey=JWTSecret,ParameterValue="$JWT_SECRET" \
            ParameterKey=SSLCertificateArn,ParameterValue="$SSL_CERTIFICATE_ARN" \
        --capabilities CAPABILITY_IAM \
        --region "$AWS_REGION"
    
    echo -e "${YELLOW}⏳ Attente de la création de l'infrastructure...${NC}"
    aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME" --region "$AWS_REGION"
fi

# Récupérer les outputs de l'infrastructure
echo -e "${YELLOW}📋 Récupération des informations d'infrastructure...${NC}"
OUTPUTS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" --query 'Stacks[0].Outputs')

export DB_ENDPOINT=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="DatabaseEndpoint") | .OutputValue')
export ALB_DNS=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="LoadBalancerDNS") | .OutputValue')
export BACKEND_TG_ARN=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="BackendTargetGroupArn") | .OutputValue')
export FRONTEND_TG_ARN=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="FrontendTargetGroupArn") | .OutputValue')
export TASK_EXECUTION_ROLE_ARN=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="ECSTaskExecutionRoleArn") | .OutputValue')

# 2. Créer les repositories ECR si nécessaires
echo -e "${YELLOW}🐳 Vérification des repositories ECR...${NC}"
for repo in "$APP_NAME-back" "$APP_NAME-front"; do
    aws ecr describe-repositories --repository-names "$repo" --region "$AWS_REGION" > /dev/null 2>&1 || {
        echo -e "${YELLOW}📦 Création du repository ECR: $repo${NC}"
        aws ecr create-repository --repository-name "$repo" --region "$AWS_REGION" > /dev/null
    }
done

# 3. Authentification Docker ECR
echo -e "${YELLOW}🔐 Authentification Docker ECR...${NC}"
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"

# 4. Build et push des images Docker
echo -e "${YELLOW}🔨 Build et push de l'image backend...${NC}"
cd "$ROOT_DIR/back"
docker build -t "$ECR_REGISTRY/$APP_NAME-back:latest" .
docker push "$ECR_REGISTRY/$APP_NAME-back:latest"

echo -e "${YELLOW}🔨 Build et push de l'image frontend...${NC}"
cd "$ROOT_DIR/front"
docker build -t "$ECR_REGISTRY/$APP_NAME-front:latest" .
docker push "$ECR_REGISTRY/$APP_NAME-front:latest"

# 5. Préparation des task definitions
echo -e "${YELLOW}📋 Préparation des task definitions...${NC}"
cd "$DEPLOYMENT_DIR"

# Backend task definition
envsubst < "aws/backend-task-definition.json" > "backend-task-definition-resolved.json"
jq --arg arn "$TASK_EXECUTION_ROLE_ARN" '.executionRoleArn = $arn' "backend-task-definition-resolved.json" > "backend-task-definition-final.json"

# Frontend task definition  
envsubst < "aws/frontend-task-definition.json" > "frontend-task-definition-resolved.json"
jq --arg arn "$TASK_EXECUTION_ROLE_ARN" '.executionRoleArn = $arn' "frontend-task-definition-resolved.json" > "frontend-task-definition-final.json"

# 6. Enregistrement des task definitions
echo -e "${YELLOW}📝 Enregistrement des task definitions...${NC}"
BACKEND_TASK_DEF_ARN=$(aws ecs register-task-definition --cli-input-json "file://backend-task-definition-final.json" --region "$AWS_REGION" --query 'taskDefinition.taskDefinitionArn' --output text)
FRONTEND_TASK_DEF_ARN=$(aws ecs register-task-definition --cli-input-json "file://frontend-task-definition-final.json" --region "$AWS_REGION" --query 'taskDefinition.taskDefinitionArn' --output text)

# 7. Récupération des informations réseau
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=$APP_NAME-vpc" --region "$AWS_REGION" --query 'Vpcs[0].VpcId' --output text)
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Name,Values=$APP_NAME-public-subnet-*" --region "$AWS_REGION" --query 'Subnets[].SubnetId' --output text | tr '\t' ',')
SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=$APP_NAME-ecs-sg" --region "$AWS_REGION" --query 'SecurityGroups[0].GroupId' --output text)

# 8. Création/Mise à jour des services ECS
echo -e "${YELLOW}🚀 Déploiement des services ECS...${NC}"

# Service Backend
aws ecs describe-services --cluster "$CLUSTER_NAME" --services "$BACK_SERVICE_NAME" --region "$AWS_REGION" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${YELLOW}🔄 Mise à jour du service backend...${NC}"
    aws ecs update-service \
        --cluster "$CLUSTER_NAME" \
        --service "$BACK_SERVICE_NAME" \
        --task-definition "$BACKEND_TASK_DEF_ARN" \
        --region "$AWS_REGION" > /dev/null
else
    echo -e "${YELLOW}📦 Création du service backend...${NC}"
    aws ecs create-service \
        --cluster "$CLUSTER_NAME" \
        --service-name "$BACK_SERVICE_NAME" \
        --task-definition "$BACKEND_TASK_DEF_ARN" \
        --desired-count 1 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_IDS],securityGroups=[$SECURITY_GROUP_ID],assignPublicIp=ENABLED}" \
        --load-balancers "targetGroupArn=$BACKEND_TG_ARN,containerName=$APP_NAME-backend,containerPort=3000" \
        --region "$AWS_REGION" > /dev/null
fi

# Service Frontend
aws ecs describe-services --cluster "$CLUSTER_NAME" --services "$FRONT_SERVICE_NAME" --region "$AWS_REGION" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${YELLOW}🔄 Mise à jour du service frontend...${NC}"
    aws ecs update-service \
        --cluster "$CLUSTER_NAME" \
        --service "$FRONT_SERVICE_NAME" \
        --task-definition "$FRONTEND_TASK_DEF_ARN" \
        --region "$AWS_REGION" > /dev/null
else
    echo -e "${YELLOW}📦 Création du service frontend...${NC}"
    aws ecs create-service \
        --cluster "$CLUSTER_NAME" \
        --service-name "$FRONT_SERVICE_NAME" \
        --task-definition "$FRONTEND_TASK_DEF_ARN" \
        --desired-count 1 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_IDS],securityGroups=[$SECURITY_GROUP_ID],assignPublicIp=ENABLED}" \
        --load-balancers "targetGroupArn=$FRONTEND_TG_ARN,containerName=$APP_NAME-frontend,containerPort=4200" \
        --region "$AWS_REGION" > /dev/null
fi

# 9. Attendre la stabilisation des services
echo -e "${YELLOW}⏳ Attente de la stabilisation des services...${NC}"
aws ecs wait services-stable --cluster "$CLUSTER_NAME" --services "$BACK_SERVICE_NAME" "$FRONT_SERVICE_NAME" --region "$AWS_REGION"

# Nettoyage des fichiers temporaires
rm -f backend-task-definition-resolved.json frontend-task-definition-resolved.json
rm -f backend-task-definition-final.json frontend-task-definition-final.json

echo -e "${GREEN}🎉 Déploiement terminé avec succès !${NC}"
echo -e "${GREEN}🌐 Application disponible sur: https://$DOMAIN_NAME${NC}"
echo -e "${GREEN}📊 Load Balancer: $ALB_DNS${NC}"
