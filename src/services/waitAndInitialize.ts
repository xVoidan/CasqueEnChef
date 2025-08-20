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

async function waitForConnection(maxAttempts = 10, delayMs = 2000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { error } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });

      if (!error) {
        return true;
      }

      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        return true;
      }
    } catch {
      // Continuer à essayer
    }

    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return false;
}

async function createTablesIfNeeded(): Promise<void> {
  const tables = {
    categories: `
      CREATE TABLE IF NOT EXISTS public.categories (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `,
    entreprises: `
      CREATE TABLE IF NOT EXISTS public.entreprises (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        logo_url TEXT,
        actif BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `,
    profiles: `
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        username VARCHAR(50) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        nom VARCHAR(100),
        prenom VARCHAR(100),
        entreprise_id INTEGER REFERENCES public.entreprises(id),
        role VARCHAR(50) DEFAULT 'user',
        avatar_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `,
    quiz: `
      CREATE TABLE IF NOT EXISTS public.quiz (
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
      )
    `,
    questions: `
      CREATE TABLE IF NOT EXISTS public.questions (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER REFERENCES public.quiz(id) ON DELETE CASCADE,
        texte TEXT NOT NULL,
        ordre INTEGER DEFAULT 1,
        points INTEGER DEFAULT 10,
        temps_limite_secondes INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `,
    reponses: `
      CREATE TABLE IF NOT EXISTS public.reponses (
        id SERIAL PRIMARY KEY,
        question_id INTEGER REFERENCES public.questions(id) ON DELETE CASCADE,
        texte TEXT NOT NULL,
        est_correcte BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `,
    sessions_quiz: `
      CREATE TABLE IF NOT EXISTS public.sessions_quiz (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER REFERENCES public.quiz(id),
        user_id UUID REFERENCES auth.users(id),
        statut VARCHAR(20) DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'termine', 'abandonne')),
        score_actuel INTEGER DEFAULT 0,
        score_final INTEGER,
        question_actuelle INTEGER DEFAULT 1,
        temps_total INTEGER DEFAULT 0,
        temps_passe INTEGER DEFAULT 0,
        questions_repondues INTEGER DEFAULT 0,
        started_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `,
    reponses_utilisateur: `
      CREATE TABLE IF NOT EXISTS public.reponses_utilisateur (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES public.sessions_quiz(id) ON DELETE CASCADE,
        question_id INTEGER REFERENCES public.questions(id),
        reponse_id INTEGER REFERENCES public.reponses(id),
        est_correcte BOOLEAN,
        temps_reponse INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `,
  };

  // Vérifier/créer chaque table
  for (const [tableName, createSQL] of Object.entries(tables)) {
    const { error } = await supabase.from(tableName).select('*').limit(0);

    if (error && (error.code === 'PGRST205' || error.message?.includes('does not exist'))) {
      // Essayer de créer via RPC si disponible
      try {
        await supabase.rpc('exec_sql', { query: createSQL });
      } catch {
        // Si RPC échoue, la table doit être créée manuellement
        console.error(`❌ Table ${tableName} doit être créée manuellement dans Supabase`);
      }
    }
  }
}

async function insertSampleData(): Promise<void> {
  // Insérer les catégories
  const categories = [
    { nom: 'Sécurité', description: 'Questions sur la sécurité au travail' },
    { nom: 'Ergonomie', description: "Questions sur l'ergonomie" },
    { nom: 'Réglementation', description: 'Questions sur les normes' },
  ];

  for (const cat of categories) {
    await supabase.from('categories').upsert(cat, { onConflict: 'nom' });
  }

  // Insérer une entreprise de démonstration
  const entreprise = {
    nom: 'Entreprise Demo',
    description: 'Entreprise de démonstration',
    actif: true,
  };

  const { data: entrepriseData } = await supabase
    .from('entreprises')
    .upsert(entreprise, { onConflict: 'nom' })
    .select()
    .single();

  // Créer un quiz de démo
  if (entrepriseData) {
    const { data: securiteCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('nom', 'Sécurité')
      .single();

    if (securiteCategory) {
      const quiz = {
        titre: 'Quiz de Sécurité - Démo',
        description: 'Quiz de démonstration sur la sécurité',
        categorie_id: securiteCategory.id,
        entreprise_id: entrepriseData.id,
        duree_minutes: 10,
        nombre_questions: 3,
        est_public: true,
      };

      const { data: quizData } = await supabase.from('quiz').insert(quiz).select().single();

      if (quizData) {
        const questions = [
          {
            quiz_id: quizData.id,
            texte: "Quel est l'EPI obligatoire sur un chantier ?",
            ordre: 1,
            points: 10,
          },
          {
            quiz_id: quizData.id,
            texte: "Quelle est la vitesse maximale dans l'entrepôt ?",
            ordre: 2,
            points: 10,
          },
          {
            quiz_id: quizData.id,
            texte: 'Qui est responsable de la sécurité ?',
            ordre: 3,
            points: 10,
          },
        ];

        for (const q of questions) {
          const { data: questionData } = await supabase
            .from('questions')
            .insert(q)
            .select()
            .single();

          if (questionData) {
            const reponses = [
              { question_id: questionData.id, texte: 'Option A', est_correcte: q.ordre === 1 },
              { question_id: questionData.id, texte: 'Option B', est_correcte: q.ordre === 2 },
              { question_id: questionData.id, texte: 'Option C', est_correcte: q.ordre === 3 },
              { question_id: questionData.id, texte: 'Option D', est_correcte: false },
            ];

            for (const r of reponses) {
              await supabase.from('reponses').insert(r);
            }
          }
        }
      }
    }
  }
}

async function checkTableCounts(): Promise<void> {
  const tables = [
    'profiles',
    'categories',
    'entreprises',
    'quiz',
    'questions',
    'reponses',
    'sessions_quiz',
    'reponses_utilisateur',
  ];

  for (const table of tables) {
    await supabase.from(table).select('*', { count: 'exact', head: true });
  }
}

async function main(): Promise<void> {
  const isConnected = await waitForConnection();

  if (!isConnected) {
    console.error('❌ Impossible de se connecter à Supabase après plusieurs tentatives');
    process.exit(1);
  }

  await createTablesIfNeeded();
  await insertSampleData();
  await checkTableCounts();
}

// Exécution
main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
