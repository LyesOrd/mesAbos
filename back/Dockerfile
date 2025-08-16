FROM node:22-alpine

WORKDIR /back

# 1) Installer dépendances
COPY package.json package-lock.json ./
RUN npm install --production
RUN npm ci

# 2) Copier le dossier prisma séparément pour optimiser le cache
COPY prisma ./prisma

# 3) Générer le client Prisma
RUN npx prisma generate

# 4) Copier le reste du code
COPY . .

# 5) Compiler l'application NestJS
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
