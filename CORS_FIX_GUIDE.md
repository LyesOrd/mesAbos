# 🔧 Fix CORS + Google OAuth - Guide complet

## 🚨 PROBLÈMES IDENTIFIÉS

### 1. **CORS Backend** ❌ 
- Whitelist ne contient que `localhost:4200`
- Bloque `https://mesabos.com` → **CORRIGÉ** ✅

### 2. **Google OAuth Origins** ❌
- Google Console n'autorise pas `https://mesabos.com`

### 3. **Environment Variables** ❌
- Client SECRET manquant dans le déploiement

## ✅ CORRECTIONS APPLIQUÉES

### 1. **Backend CORS (main.ts)** ✅
```typescript
// Avant (problématique)
const whitelist = ['http://localhost:4200', 'http://127.0.0.1:4200'];

// Après (corrigé) 
const allowedOrigins = ['http://localhost:4200', 'http://127.0.0.1:4200'];
if (process.env.NODE_ENV === 'production') {
  allowedOrigins.push('https://mesabos.com', 'https://www.mesabos.com');
}
```

### 2. **Frontend URLs** ✅
- ✅ `auth.service.ts` : Utilise `environment.apiUrl`
- ✅ `dashboard.component.ts` : Utilise `environment.apiUrl`
- ✅ `environment.prod.ts` : `apiUrl: 'https://mesabos.com/api'`

## 🔧 ACTIONS MANUELLES REQUISES

### 1. **Google Cloud Console** (CRITIQUE)
Allez sur : https://console.cloud.google.com/apis/credentials

1. **Cliquez sur votre OAuth Client ID** : 
   `464908390325-c5a91uln62d88duvrd1jemue65isr1hv.apps.googleusercontent.com`

2. **Dans "Origines JavaScript autorisées"** :
   ```
   http://localhost:4200    ← (existant, gardez-le)
   https://mesabos.com      ← AJOUTEZ
   https://www.mesabos.com  ← AJOUTEZ
   ```

3. **Dans "URI de redirection autorisées"** :
   ```
   https://mesabos.com
   https://mesabos.com/login
   https://mesabos.com/auth/callback
   ```

4. **COPIEZ le Client Secret** et mettez-le dans `.deployment/config.env`:
   ```bash
   GOOGLE_CLIENT_SECRET="VOTRE_VRAI_SECRET_ICI"
   ```

### 2. **Redéploiement** 
```bash
cd .deployment/scripts
./redeploy.sh
```

## 🧪 **TESTS POST-DÉPLOIEMENT**

### 1. Test CORS
```bash
# Tester depuis le navigateur (console) sur https://mesabos.com
fetch('https://mesabos.com/api/users/me', {
  headers: {'Authorization': 'Bearer YOUR_TOKEN'}
})
```

### 2. Test Google OAuth
1. Allez sur https://mesabos.com  
2. Cliquez "Se connecter avec Google"
3. ✅ Ne devrait plus avoir d'erreur CORS
4. ✅ Ne devrait plus avoir d'erreur origin_mismatch

## 📋 VÉRIFICATION DES LOGS

### Backend logs (pour débugger CORS)
```bash
# Voir les logs ECS en temps réel
aws logs tail /ecs/mesabos --follow --region eu-west-1 --filter-pattern "backend"
```

### Si CORS ne fonctionne toujours pas :
Vérifiez dans les logs backend si vous voyez :
```
CORS: Origin 'https://mesabos.com' non autorisée. Origins autorisées: [...]
```

## ⚡ **RÉSUMÉ : OUI, un redéploiement va corriger !**

### Ce qui sera corrigé automatiquement :
- ✅ **CORS Backend** : Autorisera `https://mesabos.com`
- ✅ **API URLs** : Frontend appellera `https://mesabos.com/api`
- ✅ **Environment** : Production utilisera les bonnes configs

### Ce qui doit être fait manuellement :
- ⚠️  **Google Console** : Autoriser les origins
- ⚠️  **Client Secret** : Mettre le vrai secret dans config.env

## 🎯 **ORDRE D'EXÉCUTION RECOMMANDÉ**

1. **Faire les configs Google Console** (5 min)
2. **Mettre le Client Secret** dans `.deployment/config.env`
3. **Redéployer** : `./redeploy.sh` (5 min)
4. **Tester** : https://mesabos.com

Après ça, tout devrait fonctionner ! 🚀
