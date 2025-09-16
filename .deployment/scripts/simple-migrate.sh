#!/bin/bash

# Script simple pour exécuter les migrations Prisma
set -e

echo "🔄 Exécution des migrations Prisma..."

# Configuration
CLUSTER_NAME="mesabos-cluster"
SUBNETS="subnet-07a9da6627ca1bf80,subnet-0608d90f5591f8b20"
SECURITY_GROUPS="sg-0e434616b4490d11a"
DATABASE_URL="postgresql://mesabos_admin:piAjIdPKIRufA2Gjv290@mesabos-db.cras0mawwg7p.eu-west-1.rds.amazonaws.com:5432/mesabos_prod"

# Créer une définition de tâche temporaire pour les migrations
cat > /tmp/migration-task.json << EOF
{
  "family": "mesabos-migrations-simple",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::430118830447:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "migrate",
      "image": "430118830447.dkr.ecr.eu-west-1.amazonaws.com/mesabos-backend:latest",
      "essential": true,
      "command": ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "$DATABASE_URL"
        },
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/mesabos-migrations",
          "awslogs-region": "eu-west-1",
          "awslogs-stream-prefix": "migration"
        }
      }
    }
  ]
}
EOF

echo "📝 Création du log group..."
aws logs create-log-group --log-group-name "/ecs/mesabos-migrations" --region eu-west-1 2>/dev/null || echo "Log group existe déjà"

echo "📝 Enregistrement de la définition de tâche..."
aws ecs register-task-definition --cli-input-json file:///tmp/migration-task.json

echo "🚀 Exécution de la tâche de migration..."
TASK_ARN=$(aws ecs run-task \
  --cluster $CLUSTER_NAME \
  --task-definition mesabos-migrations-simple \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SECURITY_GROUPS],assignPublicIp=ENABLED}" \
  --query 'tasks[0].taskArn' \
  --output text)

echo "✅ Tâche lancée: $TASK_ARN"
echo "⏳ Attente de la fin de l'exécution..."

# Attendre que la tâche se termine
while true; do
  STATUS=$(aws ecs describe-tasks --cluster $CLUSTER_NAME --tasks $TASK_ARN --query 'tasks[0].lastStatus' --output text)
  echo "Status: $STATUS"
  
  if [ "$STATUS" = "STOPPED" ]; then
    EXIT_CODE=$(aws ecs describe-tasks --cluster $CLUSTER_NAME --tasks $TASK_ARN --query 'tasks[0].containers[0].exitCode' --output text)
    echo "🏁 Tâche terminée avec le code de sortie: $EXIT_CODE"
    
    if [ "$EXIT_CODE" = "0" ]; then
      echo "✅ Migrations exécutées avec succès!"
    else
      echo "❌ Erreur lors de l'exécution des migrations"
    fi
    break
  fi
  
  sleep 10
done

echo "📋 Logs de la migration:"
aws logs get-log-events \
  --log-group-name "/ecs/mesabos-migrations" \
  --log-stream-name "migration/migrate/$(echo $TASK_ARN | cut -d'/' -f3)" \
  --query 'events[*].message' \
  --output text

echo "🔍 Vérification des tables créées..."
echo "Vous pouvez maintenant tester la création de compte!"

# Nettoyer
rm -f /tmp/migration-task.json
