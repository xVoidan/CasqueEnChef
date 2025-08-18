import { supabase } from '../config/supabase';
import {
  Database,
  Theme,
  SousTheme,
  Question,
  Reponse,
  Explication,
  Session,
  ReponseUtilisateur,
  Profile,
  QuestionWithReponses,
  SessionWithDetails,
  ThemeWithSousThemes,
  UserStats,
} from '../types/database';

// ============================================
// SERVICE DE BASE DE DONNÉES
// ============================================

class DatabaseService {
  // ============================================
  // GESTION DES THÈMES
  // ============================================

  /**
   * Récupère tous les thèmes actifs avec leurs sous-thèmes
   */
  async getThemesWithSousThemes(): Promise<ThemeWithSousThemes[]> {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select(`
          *,
          sous_themes (*)
        `)
        .eq('actif', true)
        .order('ordre');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des thèmes:', error);
      throw error;
    }
  }

  /**
   * Récupère un thème spécifique avec ses sous-thèmes
   */
  async getThemeById(themeId: number): Promise<ThemeWithSousThemes | null> {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select(`
          *,
          sous_themes (*)
        `)
        .eq('id', themeId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération du thème:', error);
      return null;
    }
  }

  // ============================================
  // GESTION DES QUESTIONS
  // ============================================

  /**
   * Récupère des questions aléatoires selon les critères
   */
  async getRandomQuestions(
    themeId?: number,
    sousThemeId?: number,
    limit: number = 10
  ): Promise<QuestionWithReponses[]> {
    try {
      // Utilise la fonction SQL personnalisée
      const { data: questionsData, error: questionsError } = await supabase
        .rpc('get_random_questions', {
          p_theme_id: themeId || null,
          p_sous_theme_id: sousThemeId || null,
          p_limit: limit,
        });

      if (questionsError) throw questionsError;

      // Récupère les IDs des questions
      const questionIds = questionsData?.map(q => q.question_id) || [];

      if (questionIds.length === 0) return [];

      // Récupère les questions complètes avec réponses et explications
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          reponses (*),
          explications (*),
          sous_themes (
            *,
            themes (*)
          )
        `)
        .in('id', questionIds)
        .eq('actif', true);

      if (error) throw error;

      // Transforme les données pour correspondre au type QuestionWithReponses
      return (data || []).map(q => ({
        ...q,
        explication: q.explications?.[0] || undefined,
        sous_theme: q.sous_themes ? {
          ...q.sous_themes,
          theme: q.sous_themes.themes || undefined,
        } : undefined,
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des questions:', error);
      throw error;
    }
  }

  /**
   * Récupère une question spécifique avec toutes ses données
   */
  async getQuestionById(questionId: number): Promise<QuestionWithReponses | null> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          reponses (*),
          explications (*),
          sous_themes (
            *,
            themes (*)
          )
        `)
        .eq('id', questionId)
        .single();

      if (error) throw error;

      if (!data) return null;

      return {
        ...data,
        explication: data.explications?.[0] || undefined,
        sous_theme: data.sous_themes ? {
          ...data.sous_themes,
          theme: data.sous_themes.themes || undefined,
        } : undefined,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de la question:', error);
      return null;
    }
  }

  /**
   * Récupère les questions par sous-thème
   */
  async getQuestionsBySousTheme(sousThemeId: number): Promise<QuestionWithReponses[]> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          reponses (*),
          explications (*)
        `)
        .eq('sous_theme_id', sousThemeId)
        .eq('actif', true)
        .order('niveau_difficulte');

      if (error) throw error;

      return (data || []).map(q => ({
        ...q,
        explication: q.explications?.[0] || undefined,
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des questions:', error);
      throw error;
    }
  }

  // ============================================
  // GESTION DES SESSIONS
  // ============================================

  /**
   * Crée une nouvelle session de quiz
   */
  async createSession(
    profileId: string,
    typeSession: 'entrainement' | 'examen' | 'revision',
    themeId?: number,
    sousThemeId?: number
  ): Promise<Session | null> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          profile_id: profileId,
          type_session: typeSession,
          theme_id: themeId || null,
          sous_theme_id: sousThemeId || null,
          statut: 'en_cours',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la création de la session:', error);
      return null;
    }
  }

  /**
   * Met à jour une session existante
   */
  async updateSession(
    sessionId: number,
    updates: Partial<Session>
  ): Promise<Session | null> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la session:', error);
      return null;
    }
  }

  /**
   * Termine une session et calcule le score final
   */
  async endSession(sessionId: number): Promise<SessionWithDetails | null> {
    try {
      // Récupère les détails de la session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          *,
          reponses_utilisateur (*)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Calcule les statistiques
      const reponsesUtilisateur = sessionData.reponses_utilisateur || [];
      const nombreQuestions = reponsesUtilisateur.length;
      const nombreReponsesCorrectes = reponsesUtilisateur.filter(r => r.est_correcte).length;
      const score = nombreQuestions > 0 
        ? Math.round((nombreReponsesCorrectes / nombreQuestions) * 100)
        : 0;
      const tempsTotal = reponsesUtilisateur.reduce((sum, r) => sum + (r.temps_reponse || 0), 0);

      // Met à jour la session
      const { data, error } = await supabase
        .from('sessions')
        .update({
          statut: 'terminee',
          date_fin: new Date().toISOString(),
          score,
          nombre_questions: nombreQuestions,
          nombre_reponses_correctes: nombreReponsesCorrectes,
          temps_total: tempsTotal,
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      // Met à jour les points du profil
      if (data && data.profile_id) {
        await this.updateUserPoints(data.profile_id, nombreReponsesCorrectes);
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la fin de session:', error);
      return null;
    }
  }

  /**
   * Récupère les sessions d'un utilisateur
   */
  async getUserSessions(
    profileId: string,
    limit: number = 10
  ): Promise<SessionWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          themes (*),
          sous_themes (*)
        `)
        .eq('profile_id', profileId)
        .order('date_debut', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des sessions:', error);
      throw error;
    }
  }

  // ============================================
  // GESTION DES RÉPONSES UTILISATEUR
  // ============================================

  /**
   * Enregistre la réponse d'un utilisateur
   */
  async saveUserAnswer(
    sessionId: number,
    questionId: number,
    reponseId: number | null,
    estCorrecte: boolean,
    tempsReponse: number
  ): Promise<ReponseUtilisateur | null> {
    try {
      const { data, error } = await supabase
        .from('reponses_utilisateur')
        .upsert({
          session_id: sessionId,
          question_id: questionId,
          reponse_id: reponseId,
          est_correcte: estCorrecte,
          temps_reponse: tempsReponse,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la réponse:', error);
      return null;
    }
  }

  /**
   * Marque une question pour révision
   */
  async markQuestionForReview(
    sessionId: number,
    questionId: number,
    marked: boolean = true
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reponses_utilisateur')
        .update({ marquee_pour_revision: marked })
        .eq('session_id', sessionId)
        .eq('question_id', questionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur lors du marquage de la question:', error);
      return false;
    }
  }

  /**
   * Récupère les questions marquées pour révision
   */
  async getReviewQuestions(profileId: string): Promise<QuestionWithReponses[]> {
    try {
      const { data, error } = await supabase
        .from('reponses_utilisateur')
        .select(`
          questions (
            *,
            reponses (*),
            explications (*),
            sous_themes (
              *,
              themes (*)
            )
          )
        `)
        .eq('marquee_pour_revision', true)
        .eq('sessions.profile_id', profileId);

      if (error) throw error;

      // Extrait et formate les questions uniques
      const questionsMap = new Map<number, QuestionWithReponses>();
      
      (data || []).forEach(item => {
        if (item.questions) {
          const q = item.questions;
          if (!questionsMap.has(q.id)) {
            questionsMap.set(q.id, {
              ...q,
              explication: q.explications?.[0] || undefined,
              sous_theme: q.sous_themes ? {
                ...q.sous_themes,
                theme: q.sous_themes.themes || undefined,
              } : undefined,
            });
          }
        }
      });

      return Array.from(questionsMap.values());
    } catch (error) {
      console.error('Erreur lors de la récupération des questions de révision:', error);
      throw error;
    }
  }

  // ============================================
  // GESTION DES STATISTIQUES
  // ============================================

  /**
   * Récupère les statistiques d'un utilisateur
   */
  async getUserStats(profileId: string): Promise<UserStats | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_stats', {
          p_user_id: profileId,
        });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const stats = data[0];

      // Récupère les statistiques par thème
      const { data: themeStats, error: themeError } = await supabase
        .from('sessions')
        .select(`
          themes (nom),
          nombre_questions,
          nombre_reponses_correctes
        `)
        .eq('profile_id', profileId)
        .not('theme_id', 'is', null);

      if (themeError) throw themeError;

      // Calcule la progression par thème
      const progressionParTheme = new Map<string, {
        questions_repondues: number;
        questions_correctes: number;
      }>();

      (themeStats || []).forEach(session => {
        const themeName = session.themes?.nom;
        if (themeName) {
          const current = progressionParTheme.get(themeName) || {
            questions_repondues: 0,
            questions_correctes: 0,
          };
          current.questions_repondues += session.nombre_questions || 0;
          current.questions_correctes += session.nombre_reponses_correctes || 0;
          progressionParTheme.set(themeName, current);
        }
      });

      return {
        ...stats,
        progression_par_theme: Array.from(progressionParTheme.entries()).map(([theme, data]) => ({
          theme,
          pourcentage: data.questions_repondues > 0 
            ? Math.round((data.questions_correctes / data.questions_repondues) * 100)
            : 0,
          questions_repondues: data.questions_repondues,
        })),
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return null;
    }
  }

  /**
   * Met à jour les points d'un utilisateur
   */
  async updateUserPoints(profileId: string, pointsToAdd: number): Promise<boolean> {
    try {
      // Récupère les points actuels
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('points_total')
        .eq('id', profileId)
        .single();

      if (profileError) throw profileError;

      const newPoints = (profile?.points_total || 0) + pointsToAdd;

      // Met à jour les points
      const { error } = await supabase
        .from('profiles')
        .update({ points_total: newPoints })
        .eq('id', profileId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des points:', error);
      return false;
    }
  }

  /**
   * Récupère le classement des utilisateurs
   */
  async getLeaderboard(limit: number = 10): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('points_total', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération du classement:', error);
      throw error;
    }
  }

  // ============================================
  // GESTION DU PROFIL
  // ============================================

  /**
   * Met à jour le profil d'un utilisateur
   */
  async updateProfile(
    profileId: string,
    updates: Partial<Profile>
  ): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profileId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return null;
    }
  }

  /**
   * Récupère le profil d'un utilisateur
   */
  async getProfile(profileId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return null;
    }
  }
}

// Export de l'instance unique du service
export const databaseService = new DatabaseService();