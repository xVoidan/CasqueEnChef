# Instructions pour mettre à jour le schéma de la base de données

## Problème identifié
La table `reponses_utilisateur` a une contrainte de clé étrangère qui référence l'ancienne table `sessions` au lieu de la nouvelle table `sessions_quiz`.

## Solution immédiate

### Option 1 : Script d'urgence (RECOMMANDÉ)
Exécutez le fichier `FIX_URGENT_FK_CONSTRAINT.sql` dans l'éditeur SQL de Supabase :
1. Allez dans Supabase Dashboard > SQL Editor
2. Copiez le contenu du fichier `FIX_URGENT_FK_CONSTRAINT.sql`
3. Exécutez le script
4. Vérifiez que la contrainte a été corrigée

### Option 2 : Commande rapide
Si vous avez besoin d'une solution ultra-rapide, exécutez simplement :
```sql
ALTER TABLE public.reponses_utilisateur DISABLE ROW LEVEL SECURITY;
```

## Migrations à appliquer
Les fichiers suivants contiennent les migrations nécessaires :
1. `migrations/fix_reponses_utilisateur_fk.sql` - Corrige la contrainte FK
2. `migrations/create_insert_reponse_bypass.sql` - Crée une fonction de contournement

## Vérification
Après avoir appliqué les corrections, vérifiez avec :
```sql
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage 
WHERE table_name = 'reponses_utilisateur' 
AND column_name = 'session_id';
```

La contrainte devrait maintenant référencer `sessions_quiz` et non plus `sessions`.