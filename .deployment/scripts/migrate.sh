#!/bin/bash

# Script pour exécuter les migrations Prisma sur la base de données de production
# Utilisation: ./migrate.sh

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour logger
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Charger la configuration
if [ ! -f "../config.env" ]; then
    error "Fichier de configuration non trouvé: ../config.env"
    exit 1
fi

source ../config.env

# Vérifier que les variables nécessaires sont définies
if [ -z "$AWS_REGION" ] || [ -z "$ECR_REGISTRY" ] || [ -z "$DB_USERNAME" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
    error "Variables d'environnement manquantes dans config.env"
    exit 1
fi

log "🚀 Début de l'exécution des migrations Prisma"

# Définir les variables
CLUSTER_NAME="mesabos-cluster"
TASK_DEFINITION_FILE="../aws/migrate-task-definition.json"
DB_ENDPOINT="mesabos-db.c1rbzk3pjvd9.eu-west-1.rds.amazonaws.com"

# Remplacer les variables dans la définition de tâche
log "📝 Génération de la définition de tâche..."
envsubst < "$TASK_DEFINITION_FILE" > /tmp/migrate-task-definition.json

# Enregistrer la définition de tâche
log "📋 Enregistrement de la définition de tâche de migration..."
TASK_DEF_ARN=$(aws ecs register-task-definition \
    --cli-input-json file:///tmp/migrate-task-definition.json \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

if [ $? -ne 0 ]; then
    error "Échec de l'enregistrement de la définition de tâche"
    exit 1
fi

log "✅ Définition de tâche enregistrée: $TASK_DEF_ARN"

# Obtenir les informations du cluster (subnet et security group)
log "🔍 Récupération des informations réseau..."
SUBNET_IDS=$(aws ec2 describe-subnets \
    --filters "Name=tag:Name,Values=mesabos-*" \
    --query 'Subnets[?AvailabilityZone != null].SubnetId' \
    --output text | tr '\t' ',')

SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=mesabos-*" \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

if [ -z "$SUBNET_IDS" ] || [ -z "$SECURITY_GROUP_ID" ]; then
    error "Impossible de récupérer les informations réseau"
    exit 1
fi

log "📡 Subnet IDs: $SUBNET_IDS"
log "🔒 Security Group ID: $SECURITY_GROUP_ID"

# Exécuter la tâche
log "🏃‍♂️ Exécution de la tâche de migration..."
TASK_ARN=$(aws ecs run-task \
    --cluster "$CLUSTER_NAME" \
    --task-definition "$TASK_DEF_ARN" \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_IDS],securityGroups=[$SECURITY_GROUP_ID],assignPublicIp=ENABLED}" \
    --query 'tasks[0].taskArn' \
    --output text)

if [ $? -ne 0 ]; then
    error "Échec du lancement de la tâche"
    exit 1
fi

log "✅ Tâche de migration lancée: $TASK_ARN"

# Attendre que la tâche se termine
log "⏳ Attente de la fin de la tâche..."
aws ecs wait tasks-stopped --cluster "$CLUSTER_NAME" --tasks "$TASK_ARN"

# Vérifier le statut final
TASK_STATUS=$(aws ecs describe-tasks \
    --cluster "$CLUSTER_NAME" \
    --tasks "$TASK_ARN" \
    --query 'tasks[0].lastStatus' \
    --output text)

EXIT_CODE=$(aws ecs describe-tasks \
    --cluster "$CLUSTER_NAME" \
    --tasks "$TASK_ARN" \
    --query 'tasks[0].containers[0].exitCode' \
    --output text)

log "📊 Statut final: $TASK_STATUS"
log "📊 Code de sortie: $EXIT_CODE"

# Afficher les logs
log "📜 Logs de la migration:"
aws logs get-log-events \
    --log-group-name "/ecs/mesabos-migrate" \
    --log-stream-name "migrate/mesabos-migrate/$(basename $TASK_ARN)" \
    --query 'events[*].message' \
    --output text

if [ "$EXIT_CODE" = "0" ]; then
    log "🎉 Migrations exécutées avec succès!"
    log "💡 Vous pouvez maintenant tester la création de compte sur https://mesabos.com"
else
    error "❌ Échec des migrations (code: $EXIT_CODE)"
    exit 1
fi

# Nettoyer
rm -f /tmp/migrate-task-definition.json

log "🧹 Nettoyage terminé"
