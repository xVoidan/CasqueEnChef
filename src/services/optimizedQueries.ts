/**
 * Requêtes Supabase optimisées
 * Élimine les problèmes N+1 et optimise les jointures
 */

import { supabase } from './supabase';
import type { Database } from '../types/database.types';

type _Tables = Database['public']['Tables'];

/**
 * Requêtes optimisées pour les quiz
 */
export const optimizedQuizQueries = {
  /**
   * Récupérer un quiz complet avec toutes ses relations
   * Une seule requête au lieu de multiples
   */
  async getCompleteQuiz(quizId: number) {
    return supabase
      .from('quiz')
      .select(
        `
        *,
        categories!inner (
          id,
          nom,
          description
        ),
        entreprises (
          id,
          nom,
          logo_url
        ),
        questions (
          id,
          texte,
          ordre,
          points,
          temps_limite_secondes,
          reponses (
            id,
            texte,
            est_correcte,
            ordre
          )
        )
      `
      )
      .eq('id', quizId)
      .single();
  },

  /**
   * Récupérer la liste des quiz avec pagination
   */
  async getQuizList({
    page = 1,
    limit = 10,
    categoryId,
    isPublic = true,
  }: {
    page?: number;
    limit?: number;
    categoryId?: number;
    isPublic?: boolean;
  }) {
    let query = supabase.from('quiz').select(
      `
        id,
        titre,
        description,
        duree_minutes,
        nombre_questions,
        niveau_difficulte,
        categories (nom),
        entreprises (nom)
      `,
      { count: 'exact' }
    );

    if (categoryId) {
      query = query.eq('categorie_id', categoryId);
    }

    if (isPublic !== undefined) {
      query = query.eq('est_public', isPublic);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    return query.range(from, to).order('created_at', { ascending: false });
  },

  /**
   * Récupérer les quiz populaires (basé sur le nombre de sessions)
   */
  async getPopularQuizzes(limit = 5) {
    // Utiliser une vue ou fonction SQL pour optimiser
    return supabase
      .from('quiz')
      .select(
        `
        *,
        categories (nom),
        sessions_quiz (count)
      `
      )
      .eq('est_public', true)
      .order('sessions_quiz.count', { ascending: false })
      .limit(limit);
  },
};

/**
 * Requêtes optimisées pour les sessions
 */
export const optimizedSessionQueries = {
  /**
   * Récupérer une session avec toutes les données nécessaires
   */
  async getCompleteSession(sessionId: number) {
    return supabase
      .from('sessions_quiz')
      .select(
        `
        *,
        quiz (
          id,
          titre,
          nombre_questions,
          duree_minutes,
          questions (
            id,
            texte,
            ordre,
            points,
            reponses (
              id,
              texte,
              est_correcte
            )
          )
        ),
        reponses_utilisateur (
          id,
          question_id,
          reponse_id,
          est_correcte,
          temps_reponse,
          points_gagnes
        )
      `
      )
      .eq('id', sessionId)
      .single();
  },

  /**
   * Récupérer le dashboard d'un utilisateur
   * Combine plusieurs métriques en une requête
   */
  async getUserDashboard(userId: string) {
    const [sessions, stats, achievements] = await Promise.all([
      // Sessions récentes
      supabase
        .from('sessions_quiz')
        .select(
          `
          id,
          statut,
          score_final,
          created_at,
          quiz (titre, categories (nom))
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5),

      // Statistiques globales
      supabase
        .from('sessions_quiz')
        .select('score_final, statut, temps_total')
        .eq('user_id', userId)
        .eq('statut', 'termine'),

      // Achievements (si la table existe)
      supabase
        .from('user_achievements')
        .select(
          `
          unlocked_at,
          achievements (
            nom,
            description,
            badge_url
          )
        `
        )
        .eq('user_id', userId)
        .limit(10),
    ]);

    // Calculer les statistiques
    let totalScore = 0;
    let totalTime = 0;
    let completedCount = 0;

    if (stats.data) {
      stats.data.forEach(session => {
        totalScore += session.score_final ?? 0;
        totalTime += session.temps_total ?? 0;
        completedCount++;
      });
    }

    return {
      recentSessions: sessions.data,
      statistics: {
        totalSessions: completedCount,
        averageScore: completedCount > 0 ? totalScore / completedCount : 0,
        totalTime,
      },
      achievements: achievements.data,
    };
  },

  /**
   * Récupérer le classement avec optimisation
   */
  async getLeaderboard(limit = 10) {
    // Utiliser une requête agrégée pour éviter N+1
    return supabase
      .from('profiles')
      .select(
        `
        id,
        username,
        avatar_url,
        experience_points,
        sessions_quiz!inner (
          score_final,
          statut
        )
      `
      )
      .eq('sessions_quiz.statut', 'termine')
      .order('experience_points', { ascending: false })
      .limit(limit);
  },
};

/**
 * Requêtes optimisées pour les profils
 */
export const optimizedProfileQueries = {
  /**
   * Récupérer un profil complet avec ses statistiques
   */
  async getCompleteProfile(userId: string) {
    const [profile, sessionStats] = await Promise.all([
      // Profil de base
      supabase
        .from('profiles')
        .select(
          `
          *,
          entreprises (
            id,
            nom,
            logo_url
          )
        `
        )
        .eq('id', userId)
        .single(),

      // Statistiques des sessions
      supabase.rpc('get_user_statistics', { user_id: userId }),
    ]);

    return {
      profile: profile.data,
      statistics: sessionStats.data,
    };
  },

  /**
   * Mettre à jour les points d'expérience
   * Utilise une fonction SQL pour atomicité
   */
  async updateExperiencePoints(userId: string, pointsToAdd: number) {
    return supabase.rpc('add_experience_points', {
      user_id: userId,
      points: pointsToAdd,
    });
  },
};

/**
 * Requêtes batch pour réduire les allers-retours
 */
export const batchQueries = {
  /**
   * Charger toutes les données initiales de l'app
   */
  async loadInitialData() {
    const [categories, enterprises, quizzes] = await Promise.all([
      supabase.from('categories').select('*'),
      supabase.from('entreprises').select('*').eq('actif', true),
      optimizedQuizQueries.getQuizList({ limit: 10 }),
    ]);

    return {
      categories: categories.data,
      enterprises: enterprises.data,
      quizzes: quizzes.data,
    };
  },

  /**
   * Précharger les données pour une session de quiz
   */
  async preloadQuizSession(quizId: number, userId: string) {
    const [quiz, userProfile, activeSession] = await Promise.all([
      optimizedQuizQueries.getCompleteQuiz(quizId),
      supabase.from('profiles').select('id, experience_points, niveau').eq('id', userId).single(),
      supabase
        .from('sessions_quiz')
        .select('id')
        .eq('user_id', userId)
        .eq('statut', 'en_cours')
        .maybeSingle(),
    ]);

    return {
      quiz: quiz.data,
      profile: userProfile.data,
      hasActiveSession: !!activeSession.data,
    };
  },
};

/**
 * Helpers pour créer des vues et fonctions SQL
 * À exécuter dans Supabase SQL Editor pour optimisation maximale
 */
export const sqlOptimizations = `
-- Vue pour les quiz avec statistiques
CREATE OR REPLACE VIEW quiz_with_stats AS
SELECT 
  q.*,
  COUNT(DISTINCT sq.id) as total_sessions,
  AVG(sq.score_final) as average_score,
  COUNT(DISTINCT sq.user_id) as unique_players
FROM quiz q
LEFT JOIN sessions_quiz sq ON q.id = sq.quiz_id AND sq.statut = 'termine'
GROUP BY q.id;

-- Fonction pour récupérer les statistiques utilisateur
CREATE OR REPLACE FUNCTION get_user_statistics(user_id UUID)
RETURNS TABLE (
  total_sessions INT,
  completed_sessions INT,
  average_score FLOAT,
  total_time INT,
  best_score INT,
  rank INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INT as total_sessions,
    COUNT(*) FILTER (WHERE statut = 'termine')::INT as completed_sessions,
    AVG(score_final) FILTER (WHERE statut = 'termine') as average_score,
    SUM(temps_total)::INT as total_time,
    MAX(score_final)::INT as best_score,
    (
      SELECT COUNT(*)::INT + 1
      FROM profiles p2
      WHERE p2.experience_points > (
        SELECT experience_points 
        FROM profiles 
        WHERE id = user_id
      )
    ) as rank
  FROM sessions_quiz
  WHERE sessions_quiz.user_id = get_user_statistics.user_id;
END;
$$ LANGUAGE plpgsql;

-- Index pour optimisation
CREATE INDEX IF NOT EXISTS idx_sessions_user_status 
  ON sessions_quiz(user_id, statut);
CREATE INDEX IF NOT EXISTS idx_reponses_session 
  ON reponses_utilisateur(session_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_ordre 
  ON questions(quiz_id, ordre);
`;

export default {
  quiz: optimizedQuizQueries,
  session: optimizedSessionQueries,
  profile: optimizedProfileQueries,
  batch: batchQueries,
};
