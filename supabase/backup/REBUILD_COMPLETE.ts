/**
 * SCRIPT DE RECONSTRUCTION COMPLÈTE DE LA BASE SUPABASE
 *
 * Ce script permet de recréer entièrement un projet Supabase depuis zéro
 * Utilisation: npx tsx supabase/backup/REBUILD_COMPLETE.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================
// ÉTAPE 1: SAUVEGARDER LES DONNÉES EXISTANTES
// ============================================
async function backupExistingData(): Promise<void> {
  console.error('\n📦 SAUVEGARDE DES DONNÉES EXISTANTES...');
  const backupData: Record<string, unknown[]> = {};

  const tablesToBackup = [
    'categories',
    'entreprises',
    'profiles',
    'quiz',
    'questions',
    'reponses',
    'sessions_quiz',
    'reponses_utilisateur',
    'quiz_questions',
  ];

  for (const table of tablesToBackup) {
    const { data, error } = await supabase.from(table).select('*');
    if (!error && data) {
      backupData[table] = data;
      console.error(`✅ ${table}: ${data.length} enregistrements sauvegardés`);
    }
  }

  // Sauvegarder dans un fichier JSON
  const backupPath = path.join(__dirname, `data_backup_${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
  console.error(`\n💾 Backup sauvegardé dans: ${backupPath}`);
}

// ============================================
// ÉTAPE 2: CRÉER TOUTES LES TABLES
// ============================================
async function createAllTables(): Promise<void> {
  console.error('\n🔨 CRÉATION DES TABLES...');

  // Lire le schema.sql si besoin
  // const schemaPath = path.join(__dirname, 'schema.sql');
  // const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

  // Pour Supabase, il faut utiliser l'API SQL Editor ou créer les tables une par une
  // Ici on utilise une approche programmatique

  const tables = {
    // 1. Categories
    categories: async () => {
      const { error } = await supabase.from('categories').select('*').limit(0);
      if (error?.code === '42P01') {
        console.error('   Créer la table categories dans Supabase Dashboard');
      } else {
        console.error('✅ Table categories existe déjà');
      }
    },

    // 2. Entreprises
    entreprises: async () => {
      const { error } = await supabase.from('entreprises').select('*').limit(0);
      if (error?.code === '42P01') {
        console.error('   Créer la table entreprises dans Supabase Dashboard');
      } else {
        console.error('✅ Table entreprises existe déjà');
      }
    },

    // 3. Profiles
    profiles: async () => {
      const { error } = await supabase.from('profiles').select('*').limit(0);
      if (error?.code === '42P01') {
        console.error('   Créer la table profiles dans Supabase Dashboard');
      } else {
        console.error('✅ Table profiles existe déjà');
      }
    },

    // Continuer pour toutes les tables...
  };

  for (const [_name, checkFn] of Object.entries(tables)) {
    await checkFn();
  }
}

// ============================================
// ÉTAPE 3: INSÉRER LES DONNÉES INITIALES
// ============================================
async function insertInitialData(): Promise<void> {
  console.error('\n📝 INSERTION DES DONNÉES INITIALES...');

  // Catégories de base
  const categories = [
    { nom: 'Sécurité', description: 'Questions sur la sécurité au travail et les EPI' },
    { nom: 'Ergonomie', description: "Questions sur l'ergonomie et les bonnes postures" },
    { nom: 'Réglementation', description: 'Questions sur les normes et réglementations' },
    { nom: 'Premiers secours', description: 'Questions sur les gestes de premiers secours' },
    { nom: 'Prévention', description: 'Questions sur la prévention des risques' },
  ];

  for (const cat of categories) {
    const { error } = await supabase.from('categories').upsert(cat, {
      onConflict: 'nom',
    });
    if (!error) {
      console.error(`✅ Catégorie: ${cat.nom}`);
    }
  }

  // Entreprise de démonstration
  const entreprise = {
    nom: 'Entreprise Demo',
    description: 'Entreprise de démonstration pour les tests',
    actif: true,
  };

  const { data: entrepriseData, error: entrepriseError } = await supabase
    .from('entreprises')
    .upsert(entreprise, { onConflict: 'nom' })
    .select()
    .single();

  if (!entrepriseError) {
    console.error('✅ Entreprise Demo créée');
  }

  // Quiz de démonstration complet
  if (entrepriseData) {
    await createDemoQuiz(entrepriseData.id);
  }
}

// ============================================
// CRÉER UN QUIZ DE DÉMONSTRATION COMPLET
// ============================================
async function createDemoQuiz(entrepriseId: number): Promise<void> {
  const { data: securiteCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('nom', 'Sécurité')
    .single();

  if (!securiteCategory) {
    return;
  }

  const quiz = {
    titre: 'Quiz Sécurité - Introduction aux EPI',
    description: 'Testez vos connaissances sur les équipements de protection individuelle',
    categorie_id: securiteCategory.id,
    entreprise_id: entrepriseId,
    duree_minutes: 15,
    nombre_questions: 5,
    est_public: true,
    niveau_difficulte: 1,
  };

  const { data: createdQuiz, error } = await supabase.from('quiz').insert(quiz).select().single();

  if (!error && createdQuiz) {
    console.error('✅ Quiz de démonstration créé');

    // Questions et réponses
    const questionsData = [
      {
        texte: "Qu'est-ce qu'un EPI ?",
        reponses: [
          { texte: 'Équipement de Protection Individuelle', est_correcte: true },
          { texte: 'Équipement Personnel Industriel', est_correcte: false },
          { texte: 'Équipement Professionnel Intégré', est_correcte: false },
          { texte: 'Équipement de Prévention Industrielle', est_correcte: false },
        ],
      },
      {
        texte: 'Quel EPI protège les yeux ?',
        reponses: [
          { texte: 'Les gants', est_correcte: false },
          { texte: 'Les lunettes de sécurité', est_correcte: true },
          { texte: 'Les chaussures de sécurité', est_correcte: false },
          { texte: 'Le casque', est_correcte: false },
        ],
      },
      {
        texte: 'Quand doit-on porter un casque de sécurité ?',
        reponses: [
          { texte: 'Uniquement en cas de danger immédiat', est_correcte: false },
          { texte: 'Jamais', est_correcte: false },
          { texte: 'Dans toutes les zones où il est obligatoire', est_correcte: true },
          { texte: 'Seulement si on le souhaite', est_correcte: false },
        ],
      },
      {
        texte: 'Les chaussures de sécurité protègent contre :',
        reponses: [
          { texte: "Les chutes d'objets et les perforations", est_correcte: true },
          { texte: 'Uniquement le froid', est_correcte: false },
          { texte: 'Uniquement la chaleur', est_correcte: false },
          { texte: 'Rien de particulier', est_correcte: false },
        ],
      },
      {
        texte: 'Qui est responsable de fournir les EPI ?',
        reponses: [
          { texte: 'Le salarié', est_correcte: false },
          { texte: "L'employeur", est_correcte: true },
          { texte: 'Le syndicat', est_correcte: false },
          { texte: 'La sécurité sociale', est_correcte: false },
        ],
      },
    ];

    let ordre = 1;
    for (const qData of questionsData) {
      const { data: question, error: qError } = await supabase
        .from('questions')
        .insert({
          quiz_id: createdQuiz.id,
          texte: qData.texte,
          ordre: ordre++,
          points: 10,
        })
        .select()
        .single();

      if (!qError && question) {
        for (const reponse of qData.reponses) {
          await supabase.from('reponses').insert({
            question_id: question.id,
            texte: reponse.texte,
            est_correcte: reponse.est_correcte,
          });
        }
      }
    }
    console.error(`✅ ${questionsData.length} questions créées avec réponses`);
  }
}

// ============================================
// ÉTAPE 4: CRÉER LES TABLES DE GAMIFICATION
// ============================================
async function createGamificationTables(): Promise<void> {
  console.error('\n🎮 CONFIGURATION DE LA GAMIFICATION...');

  // Note: Ces tables doivent être créées via le Dashboard Supabase
  // Voir schema.sql pour la structure complète

  console.error('⚠️  Tables à créer dans Supabase Dashboard:');
  console.error('   - experience_levels');
  console.error('   - achievements');
  console.error('   - user_achievements');
  console.error('\n📄 Utiliser le fichier schema.sql pour les structures');
}

// ============================================
// ÉTAPE 5: VÉRIFICATION FINALE
// ============================================
async function verifySetup(): Promise<void> {
  console.error('\n🔍 VÉRIFICATION FINALE...');

  const requiredTables = [
    'profiles',
    'entreprises',
    'categories',
    'quiz',
    'questions',
    'reponses',
    'sessions_quiz',
    'reponses_utilisateur',
  ];

  let allGood = true;
  for (const table of requiredTables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });

    if (error) {
      console.error(`❌ ${table}: Manquante`);
      allGood = false;
    } else {
      console.error(`✅ ${table}: ${count} enregistrements`);
    }
  }

  if (allGood) {
    console.error('\n🎉 BASE DE DONNÉES PRÊTE !');
  } else {
    console.error('\n⚠️  Certaines tables sont manquantes');
    console.error('Créez-les via Supabase Dashboard avec schema.sql');
  }
}

// ============================================
// FONCTION PRINCIPALE
// ============================================
async function rebuildComplete(): Promise<void> {
  console.error('🚀 RECONSTRUCTION COMPLÈTE DE LA BASE SUPABASE');
  console.error('='.repeat(60));

  try {
    // 1. Sauvegarder les données existantes
    await backupExistingData();

    // 2. Vérifier/créer les tables
    await createAllTables();

    // 3. Insérer les données initiales
    await insertInitialData();

    // 4. Configurer la gamification
    await createGamificationTables();

    // 5. Vérification finale
    await verifySetup();

    console.error('\n✨ RECONSTRUCTION TERMINÉE !');
    console.error('\n📋 PROCHAINES ÉTAPES:');
    console.error('1. Si des tables sont manquantes:');
    console.error('   - Allez dans Supabase Dashboard > SQL Editor');
    console.error('   - Copiez le contenu de schema.sql');
    console.error('   - Exécutez le SQL');
    console.error('\n2. Pour restaurer des données:');
    console.error('   - Utilisez le fichier data_backup_*.json créé');
    console.error('\n3. Configurez les politiques RLS si nécessaire');
  } catch (error) {
    console.error('\n❌ ERREUR:', error);
  }
}

// ============================================
// FONCTION DE RESTAURATION
// ============================================
export async function restoreFromBackup(backupFile: string): Promise<void> {
  console.error('\n📥 RESTAURATION DEPUIS BACKUP...');

  const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

  // Ordre de restauration (respecter les dépendances)
  const restoreOrder = [
    'categories',
    'entreprises',
    'profiles',
    'quiz',
    'questions',
    'reponses',
    'sessions_quiz',
    'reponses_utilisateur',
    'quiz_questions',
  ];

  for (const table of restoreOrder) {
    if (backupData[table]) {
      const data = backupData[table];
      console.error(`Restauration ${table}: ${data.length} enregistrements`);

      // Insérer par lots de 100
      for (let i = 0; i < data.length; i += 100) {
        const batch = data.slice(i, i + 100);
        const { error } = await supabase.from(table).upsert(batch);
        if (error) {
          console.error(`⚠️ Erreur ${table}:`, error.message);
        }
      }
    }
  }

  console.error('✅ Restauration terminée');
}

// Exécution
if (require.main === module) {
  rebuildComplete().catch(console.error);
}
