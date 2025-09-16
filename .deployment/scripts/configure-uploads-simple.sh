#!/bin/bash

# Script simplifié pour configurer le routage des uploads vers le backend
set -e

echo "🔧 Configuration du routage des uploads vers le backend..."

# Récupérer les ARNs nécessaires
ALB_ARN=$(aws elbv2 describe-load-balancers --names mesabos-alb --query 'LoadBalancers[0].LoadBalancerArn' --output text)
LISTENER_ARN=$(aws elbv2 describe-listeners --load-balancer-arn $ALB_ARN --query 'Listeners[?Port==`443`].ListenerArn' --output text)
BACKEND_TG_ARN=$(aws elbv2 describe-target-groups --names mesabos-backend-tg --query 'TargetGroups[0].TargetGroupArn' --output text)

echo "📋 Configuration détectée :"
echo "  ALB: $ALB_ARN"
echo "  Listener HTTPS: $LISTENER_ARN"
echo "  Backend Target Group: $BACKEND_TG_ARN"

# Lister toutes les règles existantes
echo "🔍 Règles existantes :"
aws elbv2 describe-rules --listener-arn $LISTENER_ARN --query 'Rules[].{Priority:Priority,Conditions:Conditions[0].Values,Actions:Actions[0].TargetGroupArn}' --output table

# Ajouter la nouvelle règle pour router /uploads/* vers le backend
echo "➕ Ajout de la règle de routage pour /uploads/*..."
aws elbv2 create-rule \
    --listener-arn $LISTENER_ARN \
    --priority 10 \
    --conditions Field=path-pattern,Values='/uploads/*' \
    --actions Type=forward,TargetGroupArn=$BACKEND_TG_ARN

echo "✅ Règle /uploads/* ajoutée avec la priorité 10 !"

echo ""
echo "📋 Nouvelles règles de routage :"
echo "  1. /uploads/* → Backend (priorité 10)"
echo "  2. /api/*     → Backend (existe déjà)"
echo "  3. /*         → Frontend (défaut)"

echo ""
echo "🧪 Test des URLs :"
echo "API Health Check:"
curl -s https://mesabos.com/api/health || echo "❌ API non accessible"

echo ""
echo "🖼️  Test upload path (doit retourner 404 si aucun fichier) :"
echo "curl -I https://mesabos.com/uploads/avatars/test.jpg"
curl -I -s https://mesabos.com/uploads/avatars/test.jpg 2>/dev/null | head -1 || echo "❌ Erreur de connexion"

echo ""
echo "✅ Configuration terminée ! Les uploads devraient maintenant être accessibles."
