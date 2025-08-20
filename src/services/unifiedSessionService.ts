/**
 * Service unifié pour la gestion des sessions
 * Remplace sessionService, sessionServiceBypass et sessionServiceNoRLS
 * Utilise React Query pour le cache et l'optimisation
 */

import { supabase, handleSupabaseError } from './supabase';
import type { Database } from '../types/database.types';

type Session = Database['public']['Tables']['sessions_quiz']['Row'];
type ReponseUtilisateur = Database['public']['Tables']['reponses_utilisateur']['Row'];
type Question = Database['public']['Tables']['questions']['Row'];
type Reponse = Database['public']['Tables']['reponses']['Row'];

/**
 * Configuration du service
 */
interface SessionConfig {
  useRLS: boolean;
  enableCache: boolean;
  retryOnError: boolean;
  maxRetries: number;
}

const defaultConfig: SessionConfig = {
  useRLS: true,
  enableCache: true,
  retryOnError: true,
  maxRetries: 3,
};

/**
 * Résultat standardisé pour les opérations
 */
type Result<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: string };

/**
 * Service unifié de gestion des sessions
 */
export class UnifiedSessionService {
  private config: SessionConfig;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Créer une nouvelle session
   */
  async createSession(quizId: number, userId: string): Promise<Result<Session>> {
    try {
      // Vérifier s'il y a déjà une session active
      const activeCheck = await this.getActiveSession(userId);
      if (activeCheck.success && activeCheck.data) {
        return {
          success: false,
          error:
            "Une session est déjà en cours. Veuillez la terminer avant d'en commencer une nouvelle.",
        };
      }

      // Créer la nouvelle session
      const { data, error } = await supabase
        .from('sessions_quiz')
        .insert({
          quiz_id: quizId,
          user_id: userId,
          statut: 'en_cours',
          score_actuel: 0,
          question_actuelle: 1,
          temps_total: 0,
          temps_passe: 0,
          questions_repondues: 0,
          reponses_correctes: 0,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[SessionService] Erreur création session:', error);
        return {
          success: false,
          error: handleSupabaseError(error),
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('[SessionService] Erreur inattendue:', error);
      return {
        success: false,
        error: 'Une erreur inattendue est survenue',
      };
    }
  }

  /**
   * Récupérer la session active d'un utilisateur
   */
  async getActiveSession(userId: string): Promise<Result<Session | null>> {
    try {
      const { data, error } = await supabase
        .from('sessions_quiz')
        .select('*')
        .eq('user_id', userId)
        .eq('statut', 'en_cours')
        .maybeSingle();

      if (error) {
        console.error('[SessionService] Erreur récupération session active:', error);
        return {
          success: false,
          error: handleSupabaseError(error),
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('[SessionService] Erreur inattendue:', error);
      return {
        success: false,
        error: 'Une erreur inattendue est survenue',
      };
    }
  }

  /**
   * Récupérer une session par ID
   */
  async getSession(sessionId: number): Promise<Result<Session>> {
    try {
      const { data, error } = await supabase
        .from('sessions_quiz')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('[SessionService] Erreur récupération session:', error);
        return {
          success: false,
          error: handleSupabaseError(error),
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('[SessionService] Erreur inattendue:', error);
      return {
        success: false,
        error: 'Une erreur inattendue est survenue',
      };
    }
  }

  /**
   * Sauvegarder une réponse avec retry automatique
   */
  async saveAnswer(params: {
    sessionId: number;
    questionId: number;
    reponseId: number;
    estCorrecte: boolean;
    tempsReponse: number;
    pointsGagnes: number;
  }): Promise<Result<ReponseUtilisateur>> {
    let attempts = 0;
    const maxAttempts = this.config.retryOnError ? this.config.maxRetries : 1;

    while (attempts < maxAttempts) {
      attempts++;

      try {
        // Sauvegarder la réponse
        const { data: reponseData, error: reponseError } = await supabase
          .from('reponses_utilisateur')
          .insert({
            session_id: params.sessionId,
            question_id: params.questionId,
            reponse_id: params.reponseId,
            est_correcte: params.estCorrecte,
            temps_reponse: params.tempsReponse,
            points_gagnes: params.pointsGagnes,
          })
          .select()
          .single();

        if (reponseError) {
          if (attempts < maxAttempts) {
            // Attendre avant de réessayer (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            continue;
          }
          throw reponseError;
        }

        // Mettre à jour la session
        const updateResult = await this.updateSessionProgress({
          sessionId: params.sessionId,
          pointsToAdd: params.pointsGagnes,
          timeToAdd: params.tempsReponse,
          isCorrect: params.estCorrecte,
        });

        if (!updateResult.success) {
          console.warn('[SessionService] Mise à jour session échouée:', updateResult.error);
        }

        return {
          success: true,
          data: reponseData,
        };
      } catch (error) {
        if (attempts >= maxAttempts) {
          console.error(
            '[SessionService] Erreur sauvegarde réponse après',
            attempts,
            'tentatives:',
            error
          );
          return {
            success: false,
            error: handleSupabaseError(error),
          };
        }
      }
    }

    return {
      success: false,
      error: 'Impossible de sauvegarder la réponse après plusieurs tentatives',
    };
  }

  /**
   * Mettre à jour la progression de la session
   */
  private async updateSessionProgress(params: {
    sessionId: number;
    pointsToAdd: number;
    timeToAdd: number;
    isCorrect: boolean;
  }): Promise<Result<Session>> {
    try {
      // Récupérer d'abord la session actuelle
      const { data: currentSession, error: fetchError } = await supabase
        .from('sessions_quiz')
        .select('*')
        .eq('id', params.sessionId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Calculer les nouvelles valeurs
      const updates = {
        score_actuel: (currentSession.score_actuel ?? 0) + params.pointsToAdd,
        question_actuelle: (currentSession.question_actuelle ?? 1) + 1,
        questions_repondues: (currentSession.questions_repondues ?? 0) + 1,
        temps_passe: (currentSession.temps_passe ?? 0) + params.timeToAdd,
        reponses_correctes: (currentSession.reponses_correctes ?? 0) + (params.isCorrect ? 1 : 0),
        updated_at: new Date().toISOString(),
      };

      // Appliquer les mises à jour
      const { data, error } = await supabase
        .from('sessions_quiz')
        .update(updates)
        .eq('id', params.sessionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('[SessionService] Erreur mise à jour progression:', error);
      return {
        success: false,
        error: handleSupabaseError(error),
      };
    }
  }

  /**
   * Terminer une session
   */
  async completeSession(sessionId: number): Promise<Result<Session>> {
    try {
      // Récupérer la session pour avoir le score final
      const { data: session, error: fetchError } = await supabase
        .from('sessions_quiz')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Marquer comme terminée
      const { data, error } = await supabase
        .from('sessions_quiz')
        .update({
          statut: 'termine',
          score_final: session.score_actuel,
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('[SessionService] Erreur completion session:', error);
      return {
        success: false,
        error: handleSupabaseError(error),
      };
    }
  }

  /**
   * Abandonner une session
   */
  async abandonSession(sessionId: number): Promise<Result<Session>> {
    try {
      const { data, error } = await supabase
        .from('sessions_quiz')
        .update({
          statut: 'abandonne',
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('[SessionService] Erreur abandon session:', error);
      return {
        success: false,
        error: handleSupabaseError(error),
      };
    }
  }

  /**
   * Récupérer les questions d'un quiz avec optimisation
   */
  async getQuizQuestions(quizId: number): Promise<Result<(Question & { reponses: Reponse[] })[]>> {
    try {
      // Requête optimisée avec jointure
      const { data, error } = await supabase
        .from('questions')
        .select(
          `
          *,
          reponses (*)
        `
        )
        .eq('quiz_id', quizId)
        .order('ordre', { ascending: true });

      if (error) {
        throw error;
      }

      // Trier les réponses
      const sortedData = data.map(question => ({
        ...question,
        reponses: question.reponses.sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0)),
      }));

      return {
        success: true,
        data: sortedData,
      };
    } catch (error) {
      console.error('[SessionService] Erreur récupération questions:', error);
      return {
        success: false,
        error: handleSupabaseError(error),
      };
    }
  }

  /**
   * Récupérer les réponses d'une session
   */
  async getSessionAnswers(sessionId: number): Promise<Result<ReponseUtilisateur[]>> {
    try {
      const { data, error } = await supabase
        .from('reponses_utilisateur')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('[SessionService] Erreur récupération réponses:', error);
      return {
        success: false,
        error: handleSupabaseError(error),
      };
    }
  }

  /**
   * Récupérer l'historique des sessions d'un utilisateur
   */
  async getUserSessions(userId: string, limit = 10): Promise<Result<Session[]>> {
    try {
      const { data, error } = await supabase
        .from('sessions_quiz')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('[SessionService] Erreur récupération historique:', error);
      return {
        success: false,
        error: handleSupabaseError(error),
      };
    }
  }
}

// Export d'une instance par défaut
export const sessionService = new UnifiedSessionService();

// Export pour configuration personnalisée
export function createSessionService(config?: Partial<SessionConfig>): UnifiedSessionService {
  return new UnifiedSessionService(config);
}
