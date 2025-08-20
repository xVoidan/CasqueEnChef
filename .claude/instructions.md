# Instructions Claude Code

## Contexte
- Accès Supabase via SUPABASE_SERVICE_ROLE_KEY dans .env
- Toujours analyser le projet au démarrage
- Pas de fichiers .md d'explication, code uniquement

## Workflow

### NOUVELLES FONCTIONNALITÉS → Push automatique
```bash
npm run check-types
npm run lint:fix  
git add .
git commit -m "feat: [description]"
git push
CORRECTIONS BUGS → Pas de push

Corriger uniquement, pas de commit/push automatique

Optimisations Automatiques

any → types spécifiques
select(*) → select('colonnes')
console.log → retirer en prod
Ajouter useCallback/useMemo si nécessaire
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
Proposer optimisations prioritaires

RÈGLES STRICTES:
1. Code only, pas de .md explicatifs
2. ESLint STRICT: 0 erreur, 0 warning obligatoire
3. feat: → audit complet + push | fix: → pas de push
4. Maintenir supabase/backup/schema.sql à jour
5. Types explicites partout, jamais de any