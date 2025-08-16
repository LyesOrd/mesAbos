# MesAbos

MesAbos est une application web qui permet de centraliser et suivre facilement tous vos abonnements mensuels ou annuels. Qu'il s'agisse de services SaaS comme Netflix, Amazon Prime ou Spotify, l'application vous offre un tableau de bord intuitif et sécurisé pour garder un œil sur vos dépenses récurrentes.

## Fonctionnalités

- **Suivi centralisé** : enregistrez l'ensemble de vos abonnements (SaaS, utilitaires, etc.).
- **Tableau de bord sécurisé** : accédez à toutes vos informations sur une interface claire et responsive.
- **Visualisation des dépenses** : graphiques interactifs réalisés avec [ECharts.js](https://echarts.apache.org/) pour comprendre rapidement où va votre argent.
- **Gestion des échéances** : distinguez vos paiements mensuels, trimestriels ou annuels d'un coup d'œil.

## Stack technique

- **Front-end** : Angular et PrimeNG pour une UI moderne et dynamique.
- **Back-end** : NestJS couplé à Prisma pour une API robuste.
- **Base de données** : PostgreSQL (via Docker Compose).
- **Visualisation** : librairie ECharts.js pour les graphiques.

## Installation

1. Cloner le dépôt :
   ```bash
   git clone <URL_DU_DEPOT>
   cd mesAbos
   ```
2. Définir la clé de signature des tokens dans le fichier d'environnement du back :
   - pour le développement : `back/.env.development`
   - pour la production : `back/.env.production`

   Exemple de génération d'un secret aléatoire pour le développement :
   ```bash
   printf "JWT_SECRET=%s\n" "$(openssl rand -hex 32)" > back/.env.development
   ```

3. Construire et démarrer les services Docker :
   ```bash
   make build
   make start
   ```
4. Le front est accessible par défaut sur http://localhost:4200 et l'API sur http://localhost:3000.

## Tests

Des scripts de tests sont disponibles pour le front (`Angular`) et le back (`NestJS`). Pour les exécuter :
```bash
# Tests front
cd front
npm test -- --watch=false

# Tests back
cd ../back
npm test
```

## Licence

Ce projet est distribué sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus d'informations.

---
Made with ❤️ for une gestion simplifiée de vos abonnements !
