# 🔧 RÉSOLUTION: "runtime not ready error : supabase url is required"

## 🔍 Problème
L'application React Native/Expo ne trouve pas les variables d'environnement Supabase.

## ✅ Solutions (dans l'ordre)

### 1. Variables d'environnement corrigées ✅
Les fichiers `.env` et `.env.local` ont été mis à jour avec le bon préfixe `EXPO_PUBLIC_`

**Avant (incorrect):**
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

**Après (correct):**
```
EXPO_PUBLIC_SUPABASE_URL=https://eoifopsunzrvbfmlxloj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Redémarrer Metro Bundler avec cache nettoyé

```bash
# Arrêter l'app actuelle (Ctrl+C)
# Puis redémarrer avec:
npx expo start --clear

# Ou si vous utilisez npm:
npm start -- --clear
```

### 3. Si toujours des erreurs, nettoyer complètement

```bash
# Nettoyer tous les caches
npx expo start --clear
npx react-native start --reset-cache
rm -rf node_modules/.cache

# Pour iOS uniquement
cd ios && pod cache clean --all && cd ..

# Pour Android uniquement
cd android && ./gradlew clean && cd ..
```

### 4. Reconstruire l'application

Si vous testez sur un appareil physique ou émulateur:

```bash
# Pour iOS
npx expo run:ios

# Pour Android
npx expo run:android

# Ou avec EAS Build
eas build --platform all --clear-cache
```

### 5. Vérifier la configuration

Exécutez le script de test:
```bash
npx tsx src/config/testSupabaseConfig.ts
```

### 6. Alternative: Variables hardcodées (TEMPORAIRE)

Si urgent, modifiez temporairement `src/config/supabase.ts`:

```typescript
// TEMPORAIRE - À remplacer par les variables d'environnement
const supabaseUrl = 'https://eoifopsunzrvbfmlxloj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvaWZvcHN1bnpydmJmbWx4bG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNzM2NzAsImV4cCI6MjA3MDk0OTY3MH0.sucdwgxg1MFG4h2Rz5xrQXUciSIkJIGLq4uUP5li5zo';
```

⚠️ **NE PAS COMMITER cette version avec les clés en dur!**

## 📝 Checklist de vérification

- [ ] `.env.local` existe avec `EXPO_PUBLIC_` préfixe
- [ ] Metro Bundler redémarré avec `--clear`
- [ ] Cache nettoyé si nécessaire
- [ ] App reconstruite si sur appareil physique
- [ ] Variables visibles dans `console.log(process.env.EXPO_PUBLIC_SUPABASE_URL)`

## 🎯 Résultat attendu

Après ces étapes, l'application devrait se connecter correctement à Supabase sans erreur.