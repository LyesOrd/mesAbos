#!/bin/bash

# Script pour configurer le routage des uploads vers le backend
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

# Vérifier si une règle pour /uploads existe déjà
echo "🔍 Vérification des règles existantes..."
EXISTING_RULE_ARN=$(aws elbv2 describe-rules --listener-arn $LISTENER_ARN --query 'Rules[?Conditions[?Field==`path-pattern` && Values[?contains(@, `/uploads/*`)]].RuleArn' --output text)

if [ ! -z "$EXISTING_RULE_ARN" ] && [ "$EXISTING_RULE_ARN" != "None" ]; then
    echo "⚠️  Une règle pour /uploads/* existe déjà. Suppression..."
    aws elbv2 delete-rule --rule-arn $EXISTING_RULE_ARN
    echo "🗑️  Règle supprimée"
fi

# Ajouter la nouvelle règle pour router /uploads/* vers le backend
echo "➕ Ajout de la règle de routage pour /uploads/*..."
aws elbv2 create-rule \
    --listener-arn $LISTENER_ARN \
    --priority 10 \
    --conditions Field=path-pattern,Values='/uploads/*' \
    --actions Type=forward,TargetGroupArn=$BACKEND_TG_ARN

echo "✅ Règle ajoutée avec succès !"

# Ajouter aussi une règle pour /api/* si elle n'existe pas
echo "🔍 Vérification de la règle /api/*..."
API_RULE_ARN=$(aws elbv2 describe-rules --listener-arn $LISTENER_ARN --query 'Rules[?Conditions[?Field==`path-pattern` && Values[?contains(@, `/api/*`)]].RuleArn' --output text)

if [ -z "$API_RULE_ARN" ] || [ "$API_RULE_ARN" = "None" ]; then
    echo "➕ Ajout de la règle de routage pour /api/*..."
    aws elbv2 create-rule \
        --listener-arn $LISTENER_ARN \
        --priority 20 \
        --conditions Field=path-pattern,Values='/api/*' \
        --actions Type=forward,TargetGroupArn=$BACKEND_TG_ARN
    echo "✅ Règle /api/* ajoutée !"
else
    echo "✅ Règle /api/* existe déjà"
fi

echo ""
echo "📋 Règles de routage configurées :"
echo "  1. /uploads/* → Backend (priorité 10)"
echo "  2. /api/*     → Backend (priorité 20)"
echo "  3. /*         → Frontend (défaut)"

echo ""
echo "🧪 Test des URLs :"
echo "curl https://mesabos.com/api/health"
curl -s https://mesabos.com/api/health || echo "❌ API non accessible"

echo ""
echo "🖼️  Testons un fichier upload (doit retourner 404 si aucun fichier) :"
echo "curl -I https://mesabos.com/uploads/avatars/test.jpg"
curl -I -s https://mesabos.com/uploads/avatars/test.jpg | head -1

echo ""
echo "✅ Configuration terminée ! Les uploads devraient maintenant être accessibles."
