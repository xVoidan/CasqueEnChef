# Instructions Claude Code

## Contexte
- Accès Supabase via SUPABASE_SERVICE_ROLE_KEY dans .env
- Toujours analyser le projet au démarrage
- Pas de fichiers .md d'explication, code uniquement
- **ESLint en mode STRICT - AUCUNE erreur/warning toléré**

## Workflow

### NOUVELLES FONCTIONNALITÉS → Push automatique
```bash
npm run check-types
npm run lint:fix  
# Si des erreurs ESLint persistent après fix:
# Les corriger manuellement jusqu'à 0 erreur/warning
git add .
git commit -m "feat: [description]"
git push
CORRECTIONS BUGS → Pas de push

Corriger uniquement, pas de commit/push automatique
Mais toujours valider avec ESLint strict

ESLint Configuration Stricte
Vérifier/créer .eslintrc.json avec règles strictes
Audit Obligatoire
AVANT CHAQUE COMMIT:
bashnpm run check-types  # Doit passer à 100%
npm run lint         # Doit afficher 0 errors, 0 warnings
npm run lint:fix     # Correction auto
npm run lint         # Revérifier: DOIT être 0/0
Si erreurs persistent → Les corriger manuellement
Ne JAMAIS commit avec des erreurs/warnings ESLint
Optimisations Automatiques

any → types spécifiques (OBLIGATOIRE)
select(*) → select('colonnes')
console.log → retirer (sauf console.error)
Ajouter useCallback/useMemo si nécessaire
Types de retour explicites sur toutes les fonctions
Const au lieu de let quand possible
=== au lieu de ==
Indexer colonnes fréquemment requêtées
N+1 queries → requêtes jointes

Backup DB
Maintenir à jour: supabase/backup/schema.sql et supabase/backup/data.sql
Analyse au démarrage

Structure projet + dépendances
Vérifier config ESLint stricte
Run lint pour voir état actuel
Tables/RLS/Functions Supabase
Git log --oneline -10
Vérifier schema.sql à jour
Proposer optimisations prioritaires + corrections ESLint

Règle d'or
Qualité > Rapidité

Code 100% typé
0 erreur ESLint
0 warning ESLint
Tests types passent