# 🕐 Information sur le Timezone dans Supabase

## Situation actuelle
Les dates dans la colonne `created_at` sont stockées en **UTC** (temps universel) dans Supabase. 
C'est une pratique standard et recommandée pour les bases de données.

## Impact
- **Date** : ✅ Correcte
- **Heure** : Décalée selon votre fuseau horaire (France = UTC+1 ou UTC+2 selon l'heure d'été)

## Solutions possibles

### Option 1 : Laisser en UTC (RECOMMANDÉ) ✅
**Pourquoi c'est bien :**
- Standard international
- Pas de problème lors des changements d'heure été/hiver
- Facilite la synchronisation entre utilisateurs de différents fuseaux

**Comment afficher l'heure locale dans l'app :**
```typescript
// Dans vos composants React Native
const formatLocalTime = (utcDate: string) => {
  const date = new Date(utcDate);
  return date.toLocaleString('fr-FR', { 
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit'
  });
};
```

### Option 2 : Configurer le timezone Supabase
Si vous voulez vraiment changer (non recommandé), dans Supabase Dashboard :
1. Settings → Database
2. Timezone settings
3. Changer pour 'Europe/Paris'

⚠️ **Attention** : Cela peut causer des problèmes si votre app est utilisée dans différents pays.

### Option 3 : Ajouter une colonne timezone utilisateur
```sql
ALTER TABLE profiles 
ADD COLUMN timezone VARCHAR(50) DEFAULT 'Europe/Paris';
```

## Conclusion
✅ **Pas d'impact sur le fonctionnement**
Les timestamps UTC sont corrects et n'affectent pas :
- Le tri des données
- Les calculs de durée
- Les statistiques

L'affichage peut être ajusté côté client si nécessaire.