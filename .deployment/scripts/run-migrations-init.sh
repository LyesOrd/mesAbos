#!/bin/bash

# Script pour exécuter les migrations en modifiant temporairement le service backend
set -e

echo "🔄 Modification du service backend pour exécuter les migrations..."

# Récupérer la définition de tâche actuelle
aws ecs describe-task-definition --task-definition mesabos-backend --query 'taskDefinition' > /tmp/current-task.json

# Créer une nouvelle définition avec commande de migration
cat > /tmp/migration-task.json << 'EOF'
{
  "family": "mesabos-backend-migrate",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::430118830447:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "mesabos-backend",
      "image": "430118830447.dkr.ecr.eu-west-1.amazonaws.com/mesabos-backend:latest",
      "essential": true,
      "command": ["sh", "-c", "echo 'Exécution des migrations...' && npx prisma migrate deploy && echo 'Migrations terminées!' && npm run start:prod"],
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://mesabos_admin:piAjIdPKIRufA2Gjv290@mesabos-db.cras0mawwg7p.eu-west-1.rds.amazonaws.com:5432/mesabos_prod"
        },
        {
          "name": "JWT_SECRET",
          "value": "XiFmjpuTl1IU33AkcElW1h64bjUHwO3OuDnB3Bj+pfc="
        },
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "GOOGLE_CLIENT_ID",
          "value": "464908390325-c5a91uln62d88duvrd1jemue65isr1hv.apps.googleusercontent.com"
        },
        {
          "name": "GOOGLE_CLIENT_SECRET",
          "value": "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"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/mesabos-backend",
          "awslogs-region": "eu-west-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

echo "📝 Enregistrement de la nouvelle définition de tâche avec migrations..."
aws ecs register-task-definition --cli-input-json file:///tmp/migration-task.json

echo "🔄 Mise à jour du service avec la nouvelle définition..."
aws ecs update-service \
  --cluster mesabos-cluster \
  --service mesabos-back \
  --task-definition mesabos-backend-migrate

echo "⏳ Attente du déploiement..."
aws ecs wait services-stable --cluster mesabos-cluster --services mesabos-back

echo "✅ Service mis à jour! Les migrations ont été exécutées."
echo "📋 Vérification des logs..."

# Récupérer les logs récents
sleep 5
LATEST_TASK=$(aws ecs list-tasks --cluster mesabos-cluster --service-name mesabos-back --desired-status RUNNING --query 'taskArns[0]' --output text)
TASK_ID=$(echo $LATEST_TASK | cut -d'/' -f3)

echo "📋 Logs de démarrage (avec migrations):"
aws logs get-log-events \
  --log-group-name "/ecs/mesabos-backend" \
  --log-stream-name "ecs/mesabos-backend/$TASK_ID" \
  --start-time $(date -d '2 minutes ago' +%s)000 \
  --query 'events[*].message' \
  --output text

echo ""
echo "🔍 Test de création de compte..."
curl -X POST https://mesabos.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User"}' \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "📝 Pour remettre le service en mode normal:"
echo "aws ecs update-service --cluster mesabos-cluster --service mesabos-back --task-definition mesabos-backend"

# Nettoyer
rm -f /tmp/current-task.json /tmp/migration-task.json
