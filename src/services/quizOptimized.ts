import { supabase } from '../config/supabase';

export interface QuizWithStats {
  id: number;
  titre: string;
  description: string;
  categorie_id: number;
  categorie_nom: string;
  entreprise_id: number;
  entreprise_nom: string;
  duree_minutes: number;
  nombre_questions: number;
  est_public: boolean;
  niveau_difficulte: number;
  points_total: number;
  created_at: string;
  updated_at: string;
  questions_count: number;
  sessions_count: number;
  avg_score: number;
}

/**
 * Service optimisé pour récupérer les quiz par catégorie
 * Utilise une vue matérialisée côté Supabase pour des performances optimales
 */
export const quizService = {
  /**
   * Récupère les quiz par catégorie avec des statistiques
   * Performance optimisée via vue matérialisée
   */
  async getQuizByCategory(
    categorieId?: number,
    entrepriseId?: number,
    onlyPublic = false
  ): Promise<{ data: QuizWithStats[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.rpc('get_quiz_by_category', {
        p_categorie_id: categorieId,
        p_entreprise_id: entrepriseId,
        p_only_public: onlyPublic,
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  /**
   * Récupère tous les quiz publics
   */
  async getPublicQuiz(): Promise<{ data: QuizWithStats[] | null; error: Error | null }> {
    return this.getQuizByCategory(undefined, undefined, true);
  },

  /**
   * Récupère les quiz d'une entreprise spécifique
   */
  async getEntrepriseQuiz(
    entrepriseId: number
  ): Promise<{ data: QuizWithStats[] | null; error: Error | null }> {
    return this.getQuizByCategory(undefined, entrepriseId, false);
  },

  /**
   * Force le rafraîchissement du cache
   * À utiliser après des modifications importantes
   */
  async refreshCache(): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase.rpc('refresh_quiz_cache');

      if (error) {
        throw error;
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  },

  /**
   * Récupère les détails complets d'un quiz spécifique
   * Inclut les questions et réponses
   */
  async getQuizDetails(quizId: number) {
    try {
      const { data, error } = await supabase
        .from('quiz')
        .select(
          `
          *,
          categories (nom),
          entreprises (nom),
          questions (
            id,
            texte,
            type,
            ordre,
            points,
            temps_limite_secondes,
            image_url,
            explication,
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

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },
};
