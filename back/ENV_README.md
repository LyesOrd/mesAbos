# Configuration des Variables d'Environnement

## 📁 Fichiers disponibles

- **`.env.template`** - Template principal (à commiter) 
- **`.env.production.template`** - Template spécifique production (à commiter)
- **`.env.development`** - Votre config de développement (ignoré par git)
- **`.env.production`** - Votre config de production (ignoré par git)

## 🚀 Configuration rapide

### Pour le développement :
```bash
# 1. Copier le template
cp .env.template .env.development

# 2. Générer une clé JWT sécurisée
openssl rand -hex 32

# 3. Éditer .env.development avec vos valeurs
```

### Pour la production :
```bash
# 1. Copier le template de production
cp .env.production.template .env.production

# 2. Générer une clé JWT différente pour la production
openssl rand -hex 32

# 3. Éditer .env.production avec vos valeurs de production
```

## 🔐 Variables requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NODE_ENV` | Environnement d'exécution | `development` / `production` |
| `PORT` | Port du serveur | `3000` |
| `DATABASE_URL` | URL PostgreSQL complète | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Clé de signature JWT (32 bytes hex) | `abc123...` |
| `JWT_EXPIRES_IN` | Durée de validité des tokens | `7d` / `24h` |
| `GOOGLE_CLIENT_ID` | ID client Google OAuth | `your-client-id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Secret client Google OAuth | `GOCSPX-...` |

## ⚠️ Sécurité

- **JAMAIS** commiter les fichiers `.env.development` ou `.env.production`
- Utiliser des clés JWT différentes entre développement et production
- Garder les secrets Google OAuth privés
- Les templates peuvent être commités car ils ne contiennent pas de vraies valeurs

## 🔄 Workflow recommandé

1. Modifier les templates si de nouvelles variables sont ajoutées
2. Commiter les templates
3. Chaque développeur copie et configure ses propres fichiers .env
4. Les vrais fichiers .env restent locaux et ne sont jamais commités