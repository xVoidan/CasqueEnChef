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

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (!error) {
      return true;
    }

    if (
      error.code === 'PGRST205' ||
      error.message?.includes('relation') ||
      error.message?.includes('does not exist')
    ) {
      return true;
    }

    console.error('❌ Erreur de connexion:', error);
    return false;
  } catch (error) {
    console.error('❌ Erreur de connexion:', error);
    return false;
  }
}

async function initializeCategories(): Promise<void> {
  const categories = [
    { nom: 'Sécurité', description: 'Questions sur la sécurité au travail et les EPI' },
    { nom: 'Ergonomie', description: "Questions sur l'ergonomie et les bonnes postures" },
    { nom: 'Réglementation', description: 'Questions sur les normes et réglementations' },
    { nom: 'Premiers secours', description: 'Questions sur les gestes de premiers secours' },
    { nom: 'Prévention', description: 'Questions sur la prévention des risques' },
  ];

  for (const cat of categories) {
    const { error } = await supabase.from('categories').insert(cat);

    if (error && !error.message?.includes('duplicate')) {
      console.error(`❌ Erreur lors de l'insertion de la catégorie ${cat.nom}:`, error);
    }
  }
}

async function initializeEntreprises(): Promise<void> {
  const entreprises = [
    {
      nom: 'Entreprise Demo',
      description: 'Entreprise de démonstration pour les tests',
      actif: true,
    },
  ];

  for (const entreprise of entreprises) {
    const { error } = await supabase.from('entreprises').insert(entreprise);

    if (error && !error.message?.includes('duplicate')) {
      console.error(`❌ Erreur lors de l'insertion de l'entreprise ${entreprise.nom}:`, error);
    }
  }
}

async function initializeQuizWithQuestions(): Promise<void> {
  // Récupérer les IDs des catégories et entreprises
  const { data: categories } = await supabase.from('categories').select('id, nom');
  const { data: entreprises } = await supabase.from('entreprises').select('id, nom');

  if (!categories || categories.length === 0 || !entreprises || entreprises.length === 0) {
    console.error('❌ Catégories ou entreprises manquantes');
    return;
  }

  const securiteCategory = categories.find(c => c.nom === 'Sécurité');
  const demoEntreprise = entreprises.find(e => e.nom === 'Entreprise Demo');

  if (!securiteCategory || !demoEntreprise) {
    console.error('❌ Catégorie Sécurité ou Entreprise Demo introuvable');
    return;
  }

  // Créer un quiz de démonstration
  const quiz = {
    titre: 'Quiz Sécurité - Introduction aux EPI',
    description: 'Testez vos connaissances sur les équipements de protection individuelle',
    categorie_id: securiteCategory.id,
    entreprise_id: demoEntreprise.id,
    duree_minutes: 15,
    nombre_questions: 5,
    est_public: true,
    niveau_difficulte: 1,
  };

  const { data: createdQuiz, error: quizError } = await supabase
    .from('quiz')
    .insert(quiz)
    .select()
    .single();

  if (quizError) {
    if (!quizError.message?.includes('duplicate')) {
      console.error('❌ Erreur lors de la création du quiz:', quizError);
    }
    return;
  }

  if (createdQuiz) {
    // Créer les questions et réponses
    const questionsData = [
      {
        question: "Qu'est-ce qu'un EPI ?",
        reponses: [
          { texte: 'Équipement de Protection Individuelle', est_correcte: true },
          { texte: 'Équipement Personnel Industriel', est_correcte: false },
          { texte: 'Équipement Professionnel Intégré', est_correcte: false },
          { texte: 'Équipement de Prévention Industrielle', est_correcte: false },
        ],
      },
      {
        question: 'Quel EPI protège les yeux ?',
        reponses: [
          { texte: 'Les gants', est_correcte: false },
          { texte: 'Les lunettes de sécurité', est_correcte: true },
          { texte: 'Les chaussures de sécurité', est_correcte: false },
          { texte: 'Le casque', est_correcte: false },
        ],
      },
      {
        question: 'Quand doit-on porter un casque de sécurité ?',
        reponses: [
          { texte: 'Uniquement en cas de danger immédiat', est_correcte: false },
          { texte: 'Jamais', est_correcte: false },
          { texte: 'Dans toutes les zones où il est obligatoire', est_correcte: true },
          { texte: 'Seulement si on le souhaite', est_correcte: false },
        ],
      },
      {
        question: 'Les chaussures de sécurité protègent contre :',
        reponses: [
          { texte: "Les chutes d'objets et les perforations", est_correcte: true },
          { texte: 'Uniquement le froid', est_correcte: false },
          { texte: 'Uniquement la chaleur', est_correcte: false },
          { texte: 'Rien de particulier', est_correcte: false },
        ],
      },
      {
        question: 'Qui est responsable de fournir les EPI ?',
        reponses: [
          { texte: 'Le salarié', est_correcte: false },
          { texte: "L'employeur", est_correcte: true },
          { texte: 'Le syndicat', est_correcte: false },
          { texte: 'La sécurité sociale', est_correcte: false },
        ],
      },
    ];

    for (const qData of questionsData) {
      const { data: createdQuestion, error: questionError } = await supabase
        .from('questions')
        .insert({
          quiz_id: createdQuiz.id,
          texte: qData.question,
          ordre: questionsData.indexOf(qData) + 1,
          points: 10,
        })
        .select()
        .single();

      if (!questionError && createdQuestion) {
        for (const reponse of qData.reponses) {
          await supabase.from('reponses').insert({
            question_id: createdQuestion.id,
            texte: reponse.texte,
            est_correcte: reponse.est_correcte,
          });
        }
      }
    }
  }
}

async function main(): Promise<void> {
  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    console.error('❌ Impossible de se connecter à la base de données');
    process.exit(1);
  }

  await initializeCategories();
  await initializeEntreprises();
  await initializeQuizWithQuestions();
}

// Exécution
main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
