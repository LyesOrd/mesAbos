#!/bin/bash

# Script pour exécuter les migrations Prisma en production
set -e

# Charger la configuration
source ../config.env

echo "🔄 Enregistrement de la définition de tâche de migration..."

# Enregistrer la définition de tâche
aws ecs register-task-definition \
    --family "mesabos-migrate" \
    --network-mode "awsvpc" \
    --requires-compatibilities "FARGATE" \
    --cpu "256" \
    --memory "512" \
    --execution-role-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskExecutionRole" \
    --container-definitions '[
        {
            "name": "migration-container",
            "image": "'${ECR_REGISTRY}'/mesabos-backend:latest",
            "essential": true,
            "command": ["sh", "-c", "npx prisma migrate deploy"],
            "environment": [
                {
                    "name": "DATABASE_URL",
                    "value": "postgresql://'${DB_USERNAME}':'${DB_PASSWORD}'@mesabos-db.cjvug5qrzxjg.eu-west-1.rds.amazonaws.com:5432/'${DB_NAME}'"
                },
                {
                    "name": "NODE_ENV",
                    "value": "production"
                }
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/mesabos-migration",
                    "awslogs-region": "'${AWS_REGION}'",
                    "awslogs-stream-prefix": "ecs"
                }
            }
        }
    ]' \
    --region $AWS_REGION

echo "✅ Définition de tâche enregistrée"

echo "🚀 Exécution de la migration..."

# Récupérer la configuration réseau du service backend
NETWORK_CONFIG=$(aws ecs describe-services \
    --cluster $CLUSTER_NAME \
    --services $BACK_SERVICE_NAME \
    --region $AWS_REGION \
    --query 'services[0].networkConfiguration.awsvpcConfiguration.{Subnets:subnets,SecurityGroups:securityGroups}')

SUBNETS=$(echo $NETWORK_CONFIG | jq -r '.Subnets | join(",")')
SECURITY_GROUPS=$(echo $NETWORK_CONFIG | jq -r '.SecurityGroups | join(",")')

# Exécuter la tâche de migration
TASK_ARN=$(aws ecs run-task \
    --cluster $CLUSTER_NAME \
    --task-definition mesabos-migrate \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SECURITY_GROUPS],assignPublicIp=ENABLED}" \
    --region $AWS_REGION \
    --query 'tasks[0].taskArn' \
    --output text)

echo "📋 Tâche de migration démarrée: $TASK_ARN"

echo "⏳ Attente de la fin de la migration..."

# Attendre que la tâche se termine
aws ecs wait tasks-stopped \
    --cluster $CLUSTER_NAME \
    --tasks $TASK_ARN \
    --region $AWS_REGION

# Vérifier le statut final
FINAL_STATUS=$(aws ecs describe-tasks \
    --cluster $CLUSTER_NAME \
    --tasks $TASK_ARN \
    --region $AWS_REGION \
    --query 'tasks[0].lastStatus' \
    --output text)

echo "📊 Statut final de la migration: $FINAL_STATUS"

# Afficher les logs de la migration
echo "📋 Logs de la migration:"
aws logs get-log-events \
    --log-group-name "/ecs/mesabos-migration" \
    --log-stream-name "ecs/migration-container/$(echo $TASK_ARN | cut -d'/' -f3)" \
    --region $AWS_REGION \
    --query 'events[*].message' \
    --output text

if [ "$FINAL_STATUS" = "STOPPED" ]; then
    echo "✅ Migration terminée avec succès!"
else
    echo "❌ Erreur lors de la migration"
    exit 1
fi
