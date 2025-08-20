import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Variables d'environnement manquantes");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function exploreDatabase(): Promise<void> {
  try {
    // 1. Récupérer toutes les tables
    const { error: tablesError } = await supabase.rpc('get_all_tables');

    if (tablesError) {
      // Alternative : requête directe sur information_schema
      const { error: altError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (altError) {
        // Méthode fallback : lister les tables connues
        await exploreFallbackMethod();
        return;
      }
    }

    // 2. Explorer chaque table connue
    const knownTables = [
      'profiles',
      'entreprises',
      'categories',
      'quiz',
      'questions',
      'reponses',
      'sessions_quiz',
      'reponses_utilisateur',
      'users',
    ];

    for (const tableName of knownTables) {
      await exploreTable(tableName);
    }

    // 3. Analyser les relations
    await analyzeRelationships();

    // 4. Statistiques globales
    await getGlobalStats();
  } catch (error) {
    console.error("❌ Erreur lors de l'exploration:", error);
  }
}

async function exploreTable(tableName: string): Promise<void> {
  try {
    // Compter les enregistrements
    const { error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error(`  ⚠️ Impossible d'accéder à la table: ${countError.message}`);
      return;
    }

    // Récupérer un échantillon de données
    const { data: sample } = await supabase.from(tableName).select('*').limit(5);

    if (sample && sample.length > 0) {
    }

    // Vérifier les politiques RLS
    // Vérifier les politiques RLS
    try {
      await supabase.rpc('get_policies_for_table', {
        table_name: tableName,
      });
    } catch {
      // Ignorer les erreurs RLS
    }
  } catch (error) {
    console.error(`  ❌ Erreur: ${error}`);
  }
}

async function analyzeRelationships(): Promise<void> {
  // Relations entre les tables
  const _relationships = [
    { from: 'reponses_utilisateur', to: 'sessions_quiz', key: 'session_id' },
    { from: 'reponses_utilisateur', to: 'questions', key: 'question_id' },
    { from: 'reponses_utilisateur', to: 'reponses', key: 'reponse_id' },
    { from: 'sessions_quiz', to: 'quiz', key: 'quiz_id' },
    { from: 'sessions_quiz', to: 'profiles', key: 'user_id' },
    { from: 'questions', to: 'quiz', key: 'quiz_id' },
    { from: 'reponses', to: 'questions', key: 'question_id' },
    { from: 'quiz', to: 'categories', key: 'categorie_id' },
    { from: 'quiz', to: 'entreprises', key: 'entreprise_id' },
  ];
}

async function getGlobalStats(): Promise<void> {
  try {
    // Sessions actives
    // Sessions actives
    await supabase
      .from('sessions_quiz')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'en_cours');

    // Sessions terminées
    await supabase
      .from('sessions_quiz')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'termine');

    // Total quiz
    await supabase.from('quiz').select('*', { count: 'exact', head: true });

    // Total questions
    await supabase.from('questions').select('*', { count: 'exact', head: true });

    // Total réponses utilisateur
    await supabase.from('reponses_utilisateur').select('*', { count: 'exact', head: true });

    // Entreprises
    await supabase.from('entreprises').select('*', { count: 'exact', head: true });

    // Utilisateurs (profiles)
    await supabase.from('profiles').select('*', { count: 'exact', head: true });
  } catch (error) {
    console.error('  ❌ Erreur lors du calcul des stats:', error);
  }
}

async function exploreFallbackMethod(): Promise<void> {
  const knownTables = [
    'profiles',
    'entreprises',
    'categories',
    'quiz',
    'questions',
    'reponses',
    'sessions_quiz',
    'reponses_utilisateur',
  ];

  for (const table of knownTables) {
    await exploreTable(table);
  }
}

// Fonction pour tester des requêtes spécifiques
async function testSpecificQueries(): Promise<void> {
  // Test 1: Récupérer un quiz avec ses questions
  // Test 1: Récupérer un quiz avec ses questions
  await supabase
    .from('quiz')
    .select(
      `
      *,
      questions (
        *,
        reponses (*)
      )
    `
    )
    .limit(1);

  // Test 2: Récupérer les sessions d'un utilisateur
  await supabase
    .from('sessions_quiz')
    .select(
      `
      *,
      quiz (titre),
      reponses_utilisateur (count)
    `
    )
    .limit(5);
}

// Exécution
exploreDatabase()
  .then(() => testSpecificQueries())
  .then(() => {
    // Exploration terminée
  })
  .catch(error => {
    console.error('\n❌ Erreur fatale:', error);
  });
