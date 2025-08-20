# 🔒 Configuration Sécurisée - CasqueEnMain

## ⚠️ IMPORTANT: Sécurité des Clés API

Les clés API Supabase ne doivent **JAMAIS** être exposées dans le code source ou sur GitHub.

## 📋 Configuration Initiale

1. **Copier le fichier d'exemple**
   ```bash
   cp .env.example .env
   ```

2. **Récupérer vos clés depuis Supabase**
   - Allez sur [app.supabase.com](https://app.supabase.com)
   - Sélectionnez votre projet
   - Settings → API
   - Copiez les clés nécessaires

3. **Remplir le fichier .env**
   ```env
   EXPO_PUBLIC_SUPABASE_URL=votre_url_ici
   EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key_ici
   SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_ici
   ```

## 🛡️ Règles de Sécurité

### ✅ AUTORISÉ
- `EXPO_PUBLIC_SUPABASE_URL` - Peut être exposée (c'est l'URL publique)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Peut être exposée côté client (avec RLS activé)

### ❌ INTERDIT
- `SUPABASE_SERVICE_ROLE_KEY` - **JAMAIS** exposer côté client
- Ne jamais commiter le fichier `.env`
- Ne jamais hardcoder les clés dans le code

## 🔑 Utilisation des Clés

### Côté Client (React Native)
```typescript
// Utiliser UNIQUEMENT les clés publiques
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Côté Serveur/Scripts (Node.js)
```typescript
// Peut utiliser la service_role_key pour admin
const supabaseAdmin = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

## 🚨 En Cas de Fuite

Si vos clés ont été exposées:

1. **Régénérer immédiatement** dans Supabase Dashboard
2. **Mettre à jour** votre fichier `.env` local
3. **Vérifier** l'historique Git pour traces
4. **Auditer** les logs Supabase pour activité suspecte

## 📝 Checklist de Sécurité

- [ ] `.env` est dans `.gitignore`
- [ ] Aucune clé hardcodée dans le code
- [ ] RLS activé sur toutes les tables
- [ ] Service role key utilisée uniquement côté serveur
- [ ] Variables d'environnement configurées en production

## 🔄 Rotation des Clés

Recommandation: Régénérer les clés tous les 3 mois ou après chaque:
- Changement d'équipe
- Incident de sécurité
- Audit de sécurité

---
*Dernière mise à jour: 2025-08-20*