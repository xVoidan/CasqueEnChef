/* eslint-disable @typescript-eslint/prefer-nullish-coalescing, no-console */
import { supabase } from '../config/supabase';

export interface Badge {
  id: number;
  code: string;
  nom: string;
  description: string;
  categorie: 'progression' | 'performance' | 'social' | 'special';
  niveau: number;
  icone: string;
  couleur: string;
  points_requis: number;
  earned?: boolean;
  date_obtention?: string;
}

export interface Defi {
  defi_id: number;
  nom: string;
  description: string;
  type_defi: 'quotidien' | 'hebdomadaire' | 'mensuel' | 'special';
  progression_actuelle: number;
  objectif_valeur: number;
  points_recompense: number;
  icone: string;
  couleur: string;
  temps_restant: string;
  pourcentage_complete: number;
}

export interface Rang {
  rang_actuel: string;
  niveau_actuel: number;
  points_actuels: number;
  rang_suivant: string;
  points_requis_suivant: number;
  progression_rang: number;
  avantages: string[];
}

export interface NotificationRecompense {
  id: number;
  type_notification: 'badge' | 'defi' | 'niveau' | 'serie';
  titre: string;
  message: string;
  icone: string;
  couleur: string;
  lu: boolean;
  created_at: string;
}

class BadgesService {
  // Récupérer tous les badges avec leur statut pour un utilisateur
  async getUserBadges(userId: string): Promise<Badge[]> {
    try {
      const { data: badges, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .eq('actif', true)
        .order('categorie', { ascending: true })
        .order('niveau', { ascending: true });

      if (badgesError) {
        throw badgesError;
      }

      // Récupérer les badges gagnés par l'utilisateur
      const { data: earnedBadges, error: earnedError } = await supabase
        .from('badges_utilisateur')
        .select('badge_id, date_obtention')
        .eq('profile_id', userId);

      if (earnedError) {
        throw earnedError;
      }

      // Mapper les badges avec leur statut
      const earnedMap = new Map(earnedBadges?.map(eb => [eb.badge_id, eb.date_obtention]) || []);

      return (badges || []).map(badge => ({
        ...badge,
        earned: earnedMap.has(badge.id),
        date_obtention: earnedMap.get(badge.id),
      }));
    } catch (error) {
      console.error('Error fetching user badges:', error);
      return [];
    }
  }

  // Récupérer les défis actifs pour un utilisateur
  async getUserChallenges(userId: string): Promise<Defi[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_challenges', { p_user_id: userId });

      if (error) {
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching user challenges:', error);
      return [];
    }
  }

  // Récupérer le rang actuel de l'utilisateur
  async getUserRank(userId: string): Promise<Rang | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_rank', { p_user_id: userId });

      if (error) {
        throw error;
      }
      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching user rank:', error);
      return null;
    }
  }

  // Vérifier et attribuer les badges automatiquement
  async checkAndAwardBadges(
    userId: string
  ): Promise<{ new_badges: string[]; total_points_earned: number }> {
    try {
      // Récupérer d'abord les badges existants avant la vérification
      const badgesBefore = await this.getUserBadges(userId);
      const earnedBadgeIdsBefore = new Set(badgesBefore.filter(b => b.earned).map(b => b.id));

      const { data, error } = await supabase.rpc('check_and_award_badges', { p_user_id: userId });

      if (error) {
        console.error('Erreur lors de la vérification des badges:', error);

        // Si c'est une erreur RLS, on essaye de récupérer au moins les badges gagnés
        if (error.code === '42501') {
          return { new_badges: [], total_points_earned: 0 };
        }

        throw error;
      }

      const result = data?.[0] || { new_badges: [], total_points_earned: 0 };

      // Si pas de nouveaux badges selon la fonction SQL, vérifier manuellement
      // au cas où il y aurait un problème de détection
      if (result.new_badges.length === 0) {
        const badgesAfter = await this.getUserBadges(userId);
        const newlyEarnedBadges = badgesAfter.filter(
          b => b.earned && !earnedBadgeIdsBefore.has(b.id)
        );

        if (newlyEarnedBadges.length > 0) {
          console.log('Nouveaux badges détectés par comparaison:', newlyEarnedBadges);
          result.new_badges = newlyEarnedBadges.map(b => b.nom);
        }
      }

      return result;
    } catch (error) {
      console.error('Error checking badges:', error);
      return { new_badges: [], total_points_earned: 0 };
    }
  }

  // Mettre à jour la progression d'un défi
  async updateChallengeProgress(
    userId: string,
    defiId: number,
    progression: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from('defis_utilisateur').upsert(
        {
          profile_id: userId,
          defi_id: defiId,
          progression_actuelle: progression,
        },
        {
          onConflict: 'profile_id,defi_id',
        }
      );

      if (error) {
        throw error;
      }

      // Vérifier si le défi est complété
      const { data: defi } = await supabase
        .from('defis')
        .select('objectif_valeur, points_recompense')
        .eq('id', defiId)
        .single();

      if (defi && progression >= defi.objectif_valeur) {
        await this.completeChallenge(userId, defiId, defi.points_recompense);
      }

      return true;
    } catch (error) {
      console.error('Error updating challenge progress:', error);
      return false;
    }
  }

  // Marquer un défi comme complété
  private async completeChallenge(userId: string, defiId: number, points: number): Promise<void> {
    try {
      // Mettre à jour le défi (marquer comme complété via la progression)
      await supabase
        .from('defis_utilisateur')
        .update({
          date_complete: new Date().toISOString(),
          points_gagnes: points,
        })
        .eq('profile_id', userId)
        .eq('defi_id', defiId);

      // Ajouter les points au profil
      // D'abord récupérer les points actuels
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('points_total')
        .eq('id', userId)
        .single();

      if (currentProfile) {
        await supabase
          .from('profiles')
          .update({
            points_total: currentProfile.points_total + points,
          })
          .eq('id', userId);
      }

      // Créer une notification
      const { data: defi } = await supabase
        .from('defis')
        .select('nom, icone, couleur')
        .eq('id', defiId)
        .single();

      if (defi) {
        await this.createNotification(userId, {
          type_notification: 'defi',
          titre: 'Défi complété !',
          message: `Vous avez complété le défi "${defi.nom}" et gagné ${points} points !`,
          icone: defi.icone,
          couleur: defi.couleur,
          reference_id: defiId,
        });
      }
    } catch (error) {
      console.error('Error completing challenge:', error);
    }
  }

  // Créer une notification de récompense
  async createNotification(
    userId: string,
    notification: Omit<NotificationRecompense, 'id' | 'lu' | 'created_at'>
  ): Promise<void> {
    try {
      await supabase.from('notifications_recompenses').insert({
        profile_id: userId,
        ...notification,
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // Récupérer les notifications non lues
  async getUnreadNotifications(userId: string): Promise<NotificationRecompense[]> {
    try {
      const { data, error } = await supabase
        .from('notifications_recompenses')
        .select('*')
        .eq('profile_id', userId)
        .eq('lu', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Marquer les notifications comme lues
  async markNotificationsAsRead(userId: string, notificationIds: number[]): Promise<void> {
    try {
      await supabase
        .from('notifications_recompenses')
        .update({ lu: true })
        .eq('profile_id', userId)
        .in('id', notificationIds);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }

  // Obtenir les statistiques de badges
  getBadgeStats(badges: Badge[]): {
    total: number;
    earned: number;
    byCategory: { [key: string]: { total: number; earned: number } };
    percentageComplete: number;
  } {
    const stats = {
      total: badges.length,
      earned: badges.filter(b => b.earned).length,
      byCategory: {} as { [key: string]: { total: number; earned: number } },
      percentageComplete: 0,
    };

    // Grouper par catégorie
    badges.forEach(badge => {
      if (!stats.byCategory[badge.categorie]) {
        stats.byCategory[badge.categorie] = { total: 0, earned: 0 };
      }
      stats.byCategory[badge.categorie].total++;
      if (badge.earned) {
        stats.byCategory[badge.categorie].earned++;
      }
    });

    stats.percentageComplete = stats.total > 0 ? Math.round((stats.earned / stats.total) * 100) : 0;

    return stats;
  }

  // Obtenir le prochain badge à débloquer
  getNextBadgeToUnlock(badges: Badge[]): Badge | null {
    const unearned = badges.filter(b => !b.earned);
    if (unearned.length === 0) {
      return null;
    }

    // Prioriser par niveau puis par catégorie
    return unearned.sort((a, b) => {
      if (a.niveau !== b.niveau) {
        return a.niveau - b.niveau;
      }
      if (a.categorie !== b.categorie) {
        const categoryOrder = ['progression', 'performance', 'social', 'special'];
        return categoryOrder.indexOf(a.categorie) - categoryOrder.indexOf(b.categorie);
      }
      return 0;
    })[0];
  }

  // Formatter le temps restant pour un défi
  formatTimeRemaining(interval: string): string {
    if (!interval) {
      return 'Expiré';
    }

    // Le format PostgreSQL est comme "7 days", "1 day", etc.
    const match = interval.match(/(\d+)\s+(\w+)/);
    if (!match) {
      return interval;
    }

    const [, value, unit] = match;
    const num = parseInt(value);

    if (unit.startsWith('day')) {
      if (num === 0) {
        return "Aujourd'hui";
      }
      if (num === 1) {
        return '1 jour';
      }
      return `${num} jours`;
    }
    if (unit.startsWith('hour')) {
      if (num === 1) {
        return '1 heure';
      }
      return `${num} heures`;
    }

    return interval;
  }
}

export const badgesService = new BadgesService();
