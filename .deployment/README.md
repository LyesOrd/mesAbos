# Déploiement MesAbos - Guide Complet

## 📋 Vue d'ensemble

Ce guide décrit la structure de déploiement automatisée pour MesAbos sur AWS, incluant l'infrastructure, les scripts d'automatisation et les workflows CI/CD.

## 🏗️ Architecture de déploiement

### Infrastructure AWS
- **ECS Fargate**: Services containerisés (frontend + backend)
- **RDS PostgreSQL**: Base de données managée
- **Application Load Balancer**: Répartition de charge avec HTTPS
- **ECR**: Registry Docker privé
- **CloudWatch**: Logs et monitoring
- **Route 53**: Gestion DNS (externe)

### Structure des fichiers

```
.deployment/
├── config.env                           # Configuration centralisée
├── aws/
│   ├── infrastructure.yml               # Template CloudFormation
│   ├── backend-task-definition.json     # Configuration service backend
│   └── frontend-task-definition.json    # Configuration service frontend
└── scripts/
    ├── deploy.sh                        # Script de déploiement complet
    └── cleanup.sh                       # Script de nettoyage
```

## 🚀 Déploiement manuel

### Prérequis
```bash
# Installer les outils nécessaires
sudo apt-get install -y awscli docker.io jq gettext-base

# Configurer AWS CLI
aws configure
```

### Configuration
1. Modifier `.deployment/config.env` avec vos valeurs :
```bash
# Informations AWS
AWS_ACCOUNT_ID="VOTRE_ACCOUNT_ID"
DB_PASSWORD="VOTRE_MOT_DE_PASSE_SECURISE"
JWT_SECRET="VOTRE_CLE_JWT_256_BITS"
SSL_CERTIFICATE_ARN="ARN_DE_VOTRE_CERTIFICAT_SSL"

# Services Google OAuth (optionnel)
GOOGLE_CLIENT_ID="VOTRE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="VOTRE_CLIENT_SECRET"
```

### Déploiement
```bash
cd .deployment/scripts
./deploy.sh production
```

Le script effectue automatiquement :
1. ✅ Vérification des prérequis
2. 🏗️ Création/mise à jour de l'infrastructure CloudFormation  
3. 🐳 Création des repositories ECR
4. 🔨 Build et push des images Docker
5. 📋 Configuration des task definitions ECS
6. 🚀 Déploiement des services ECS
7. ⏳ Attente de stabilisation

## 🤖 Déploiement automatique (GitHub Actions)

### Configuration des secrets GitHub

Dans votre repository GitHub, ajoutez les secrets suivants :
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY` 
- `AWS_ACCOUNT_ID`
- `DB_PASSWORD`
- `JWT_SECRET`
- `SSL_CERTIFICATE_ARN`
- `GOOGLE_CLIENT_ID` (optionnel)
- `GOOGLE_CLIENT_SECRET` (optionnel)

### Workflow automatique

Le déploiement se déclenche automatiquement :
- ✅ À chaque push sur la branche `master`
- 🔄 Manuellement via l'interface GitHub Actions

Le workflow inclut :
1. 🧪 Tests automatisés (frontend + backend)
2. 🔨 Build et déploiement des images
3. 🚀 Mise à jour des services ECS
4. ✅ Vérification post-déploiement

## 🧹 Nettoyage des ressources

### Nettoyage complet
```bash
cd .deployment/scripts
./cleanup.sh --force
```

⚠️ **ATTENTION** : Cette commande supprime TOUTES les ressources AWS (irréversible)

## 📊 Monitoring et logs

### Accès aux logs
```bash
# Logs backend
aws logs tail /ecs/mesabos --follow --region eu-west-1 --filter-pattern "backend"

# Logs frontend  
aws logs tail /ecs/mesabos --follow --region eu-west-1 --filter-pattern "frontend"
```

### Vérification des services
```bash
# Statut des services ECS
aws ecs describe-services \
  --cluster mesabos-cluster \
  --services mesabos-back mesabos-front \
  --region eu-west-1

# Santé du Load Balancer
aws elbv2 describe-target-health \
  --target-group-arn [TARGET_GROUP_ARN] \
  --region eu-west-1
```

## 🔧 Maintenance et mises à jour

### Mise à jour uniquement des images
```bash
# Rebuild et redéployer uniquement une image
cd .deployment/scripts
./deploy.sh production
```

### Scaling des services
```bash
# Augmenter le nombre d'instances
aws ecs update-service \
  --cluster mesabos-cluster \
  --service mesabos-front \
  --desired-count 2 \
  --region eu-west-1
```

### Mise à jour de configuration
1. Modifier `.deployment/config.env`
2. Relancer le déploiement : `./deploy.sh production`

## 🛠️ Troubleshooting

### Services qui ne démarrent pas
```bash
# Vérifier les logs d'erreur
aws logs filter-log-events \
  --log-group-name /ecs/mesabos \
  --filter-pattern "ERROR" \
  --region eu-west-1
```

### Problèmes de connectivité base de données
```bash
# Tester la connectivité depuis un conteneur
aws ecs run-task \
  --cluster mesabos-cluster \
  --task-definition mesabos-backend \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --region eu-west-1
```

### Certificat SSL
Vérifier que votre certificat est validé dans AWS Certificate Manager avant le déploiement.

## 📝 Notes importantes

- **Coûts** : Cette infrastructure coûte environ 20-30€/mois avec db.t3.micro
- **Backups** : RDS effectue des backups automatiques (7 jours de rétention)
- **Sécurité** : Les services sont isolés dans des subnets privés
- **DNS** : Route 53 doit pointer vers l'ALB manuellement
- **SSL** : HTTPS forcé avec redirection automatique HTTP → HTTPS

## 🔄 Évolutions futures possibles

- **Auto-scaling** : Configuration d'auto-scaling basé sur CPU/mémoire
- **Multi-environnements** : Staging, production, etc.
- **CI/CD avancé** : Tests d'intégration, déploiement blue/green
- **Monitoring avancé** : CloudWatch dashboards, alertes
- **CDN** : CloudFront pour la distribution statique
