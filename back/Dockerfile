FROM node:22-alpine

WORKDIR /back

# 1) Installer les dépendances
COPY package.json package-lock.json ./
RUN npm install

# 2) Copier le code source et la configuration nécessaires à la compilation
COPY prisma ./prisma
COPY src ./src
COPY test ./test
COPY nest-cli.json ./
COPY tsconfig*.json ./
COPY .eslintrc.js ./.eslintrc.js
COPY .prettierrc ./.prettierrc
COPY README.md ./README.md

# 3) Générer le client Prisma avant la compilation
RUN npx prisma generate

# 4) Compiler l'application NestJS
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
