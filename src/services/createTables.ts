import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createMissingTables(): Promise<void> {
  const sqlCommands = [
    // 1. Créer la table categories
    `CREATE TABLE IF NOT EXISTS public.categories (
      id SERIAL PRIMARY KEY,
      nom VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // 2. Créer la table entreprises
    `CREATE TABLE IF NOT EXISTS public.entreprises (
      id SERIAL PRIMARY KEY,
      nom VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      logo_url TEXT,
      actif BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // 3. Créer la table quiz
    `CREATE TABLE IF NOT EXISTS public.quiz (
      id SERIAL PRIMARY KEY,
      titre VARCHAR(255) NOT NULL,
      description TEXT,
      categorie_id INTEGER REFERENCES public.categories(id),
      entreprise_id INTEGER REFERENCES public.entreprises(id),
      duree_minutes INTEGER DEFAULT 30,
      nombre_questions INTEGER DEFAULT 10,
      est_public BOOLEAN DEFAULT true,
      niveau_difficulte INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // 4. Créer la table sessions_quiz
    `CREATE TABLE IF NOT EXISTS public.sessions_quiz (
      id SERIAL PRIMARY KEY,
      quiz_id INTEGER REFERENCES public.quiz(id),
      user_id UUID REFERENCES auth.users(id),
      statut VARCHAR(20) DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'termine', 'abandonne')),
      score_actuel INTEGER DEFAULT 0,
      score_final INTEGER,
      question_actuelle INTEGER DEFAULT 1,
      temps_total INTEGER DEFAULT 0,
      started_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // 5. Table de liaison quiz_questions
    `CREATE TABLE IF NOT EXISTS public.quiz_questions (
      id SERIAL PRIMARY KEY,
      quiz_id INTEGER REFERENCES public.quiz(id) ON DELETE CASCADE,
      question_id INTEGER REFERENCES public.questions(id) ON DELETE CASCADE,
      ordre INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(quiz_id, question_id)
    )`,
  ];

  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_quiz_categorie ON public.quiz(categorie_id)`,
    `CREATE INDEX IF NOT EXISTS idx_quiz_entreprise ON public.quiz(entreprise_id)`,
    `CREATE INDEX IF NOT EXISTS idx_sessions_quiz_user ON public.sessions_quiz(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_sessions_quiz_status ON public.sessions_quiz(statut)`,
    `CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions(quiz_id)`,
    `CREATE INDEX IF NOT EXISTS idx_quiz_questions_question ON public.quiz_questions(question_id)`,
  ];

  // Exécuter les commandes de création de tables
  for (let i = 0; i < sqlCommands.length; i++) {
    const tableName = ['categories', 'entreprises', 'quiz', 'sessions_quiz', 'quiz_questions'][i];

    try {
      let error: unknown;
      try {
        const result = await supabase.rpc('exec_sql', {
          query: sqlCommands[i],
        });
        error = result.error;
      } catch {
        // Si la fonction RPC n'existe pas, essayer directement
        error = 'RPC not available';
      }

      if (error) {
        // Tenter de créer via une insertion test
        const testResult = await testTableCreation(tableName);
        if (!testResult) {
          console.error(`❌ Impossible de créer ${tableName} - À créer manuellement dans Supabase`);
        }
      }
    } catch (err) {
      console.error(`❌ Erreur pour ${tableName}:`, err);
    }
  }

  // Créer les index
  for (const indexCmd of indexes) {
    try {
      try {
        await supabase.rpc('exec_sql', { query: indexCmd });
      } catch {
        // Ignorer les erreurs d'index
      }
    } catch {
      // Ignorer les erreurs d'index
    }
  }
}

async function testTableCreation(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).select('*').limit(0);
    return !error || error.code !== 'PGRST205';
  } catch {
    return false;
  }
}

async function checkTablesStatus(): Promise<void> {
  const tables = [
    'profiles',
    'categories',
    'entreprises',
    'quiz',
    'questions',
    'reponses',
    'sessions_quiz',
    'reponses_utilisateur',
    'quiz_questions',
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });

    if (error) {
      console.error(`❌ ${table.padEnd(20)} : N'existe pas`);
    }
  }
}

// Exécution
void (async (): Promise<void> => {
  await createMissingTables();
  await checkTablesStatus();
})();
