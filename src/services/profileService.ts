import { supabase } from '../config/supabase';

interface ProfileData {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  concours_type?: 'caporal' | 'lieutenant';
  niveau?: 'debutant' | 'intermediaire' | 'avance';
  date_concours?: string;
  objectif_quotidien?: number;
}

interface ProfileStats {
  total_sessions: number;
  total_questions: number;
  questions_correctes: number;
  taux_reussite: number;
  temps_moyen: number;
  points_total: number;
  jours_consecutifs?: number;
  meilleur_score?: number;
}

class ProfileService {
  /**
   * Récupère le profil complet d'un utilisateur
   */
  async getProfile(userId: string) {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

      if (error) {
        throw error;
      }
      return { data, error: null };
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Une erreur est survenue',
      };
    }
  }

  /**
   * Met à jour le profil utilisateur
   */
  async updateProfile(userId: string, updates: ProfileData) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }
      return { data, error: null };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Une erreur est survenue',
      };
    }
  }

  /**
   * Change le mot de passe de l'utilisateur
   */
  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }
      return { success: true, error: null };
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue',
      };
    }
  }

  /**
   * Change l'email de l'utilisateur
   */
  async updateEmail(newEmail: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) {
        throw error;
      }
      return { success: true, error: null };
    } catch (error) {
      console.error("Erreur lors du changement d'email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue',
      };
    }
  }

  /**
   * Note: La gestion des avatars a été déplacée vers avatarService.ts
   * qui utilise le localStorage pour éviter les problèmes de RLS Supabase
   */

  /**
   * Récupère les statistiques de l'utilisateur
   */
  async getUserStats(userId: string): Promise<ProfileStats | null> {
    try {
      // Appel de la fonction RPC pour obtenir les stats de base
      const { data: statsData, error: statsError } = await supabase.rpc('get_user_stats', {
        p_user_id: userId,
      });

      if (statsError) {
        throw statsError;
      }
      if (!statsData || statsData.length === 0) {
        return {
          total_sessions: 0,
          total_questions: 0,
          questions_correctes: 0,
          taux_reussite: 0,
          temps_moyen: 0,
          points_total: 0,
          jours_consecutifs: 0,
          meilleur_score: 0,
        };
      }

      const stats = statsData[0];

      // Récupérer des stats supplémentaires
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('score, date_debut')
        .eq('profile_id', userId)
        .eq('statut', 'terminee')
        .order('score', { ascending: false })
        .limit(1);

      if (sessionsError) {
        throw sessionsError;
      }

      // Calculer les jours consécutifs
      const { data: recentSessions, error: recentError } = await supabase
        .from('sessions')
        .select('date_debut')
        .eq('profile_id', userId)
        .order('date_debut', { ascending: false })
        .limit(30);

      if (recentError) {
        throw recentError;
      }

      const joursConsecutifs = this.calculateConsecutiveDays(
        recentSessions?.map(s => ({ created_at: s.date_debut })) || []
      );
      const meilleurScore = sessionsData?.[0]?.score ?? 0;

      return {
        ...stats,
        jours_consecutifs: joursConsecutifs,
        meilleur_score: meilleurScore,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return null;
    }
  }

  /**
   * Calcule le nombre de jours consécutifs de pratique
   */
  private calculateConsecutiveDays(sessions: { created_at: string }[]): number {
    if (!sessions || sessions.length === 0) {
      return 0;
    }

    const dates = sessions.map(s => new Date(s.created_at).toDateString());
    const uniqueDates = [...new Set(dates)];

    let consecutiveDays = 0;
    const currentDate = new Date();

    for (let i = 0; i < uniqueDates.length; i++) {
      const sessionDate = new Date(uniqueDates[i]);
      const diffTime = Math.abs(currentDate.getTime() - sessionDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= i + 1) {
        consecutiveDays++;
      } else {
        break;
      }

      currentDate.setDate(currentDate.getDate() - 1);
    }

    return consecutiveDays;
  }

  /**
   * Récupère les badges/achievements de l'utilisateur
   */
  async getUserBadges(userId: string) {
    const stats = await this.getUserStats(userId);
    if (!stats) {
      return [];
    }

    const badges = [];

    // Badge débutant
    if (stats.total_sessions >= 1) {
      badges.push({
        id: 'first_session',
        name: 'Première fois',
        description: 'Première session complétée',
        icon: 'star-outline',
        color: '#F59E0B',
        unlocked: true,
      });
    }

    // Badge 10 sessions
    if (stats.total_sessions >= 10) {
      badges.push({
        id: 'ten_sessions',
        name: 'Persévérant',
        description: '10 sessions complétées',
        icon: 'medal-outline',
        color: '#8B5CF6',
        unlocked: true,
      });
    }

    // Badge taux de réussite
    if (stats.taux_reussite >= 80) {
      badges.push({
        id: 'high_score',
        name: 'Expert',
        description: 'Taux de réussite supérieur à 80%',
        icon: 'trophy-outline',
        color: '#10B981',
        unlocked: true,
      });
    }

    // Badge régularité
    if ((stats.jours_consecutifs ?? 0) >= 7) {
      badges.push({
        id: 'regular',
        name: 'Régulier',
        description: '7 jours consécutifs',
        icon: 'calendar-outline',
        color: '#3B82F6',
        unlocked: true,
      });
    }

    // Badge 100 questions
    if (stats.total_questions >= 100) {
      badges.push({
        id: 'hundred_questions',
        name: 'Centurion',
        description: '100 questions répondues',
        icon: 'shield-checkmark-outline',
        color: '#DC2626',
        unlocked: true,
      });
    }

    return badges;
  }

  /**
   * Supprime le compte utilisateur
   */
  async deleteAccount(userId: string) {
    try {
      // Supprimer d'abord le profil (cascade supprimera les sessions, etc.)
      const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);

      if (profileError) {
        throw profileError;
      }

      // Supprimer le compte auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        throw authError;
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue',
      };
    }
  }
}

export const profileService = new ProfileService();
