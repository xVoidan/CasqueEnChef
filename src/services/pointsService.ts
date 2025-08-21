import { supabase } from '../config/supabase';

export interface PointsCalculation {
  pointsBase: number;
  bonusReussite: number;
  bonusRapidite: number;
  bonusSerie: number;
  pointsTotal: number;
  nouveauGrade?: number;
}

class PointsService {
  /**
   * Calcule et attribue les points pour une session terminée
   */
  async calculateAndAwardPoints(
    profileId: string,
    score: number,
    tauxReussite: number,
    tempsTotal: number,
    nombreQuestions: number
  ): Promise<PointsCalculation> {
    try {
      // Appeler la fonction RPC pour calculer les points
      const { data, error } = await supabase.rpc('calculate_session_points', {
        p_profile_id: profileId,
        p_score: score,
        p_taux_reussite: tauxReussite,
        p_temps_total: tempsTotal,
        p_nombre_questions: nombreQuestions,
      });

      if (error) {
        console.error('Erreur calcul des points:', error);
        // Calcul fallback côté client
        return this.calculatePointsLocally(score, tauxReussite, tempsTotal, nombreQuestions);
      }

      // Récupérer le nouveau grade
      const { data: profileData } = await supabase
        .from('profiles')
        .select('grade_id, points_total')
        .eq('id', profileId)
        .single();

      return {
        pointsBase: Math.min(50, Math.max(10, score * 5)),
        bonusReussite: tauxReussite > 80 ? 20 : tauxReussite > 60 ? 10 : 0,
        bonusRapidite: tempsTotal < nombreQuestions * 30 ? 10 : 0,
        bonusSerie: 0, // Sera calculé côté serveur
        pointsTotal: data as number,
        nouveauGrade: profileData?.grade_id,
      };
    } catch (error) {
      console.error('Erreur service points:', error);
      return this.calculatePointsLocally(score, tauxReussite, tempsTotal, nombreQuestions);
    }
  }

  /**
   * Calcul des points en local (fallback)
   */
  private calculatePointsLocally(
    score: number,
    tauxReussite: number,
    tempsTotal: number,
    nombreQuestions: number
  ): PointsCalculation {
    // Points de base (10-50)
    const pointsBase = Math.min(50, Math.max(10, score * 5));

    // Bonus réussite
    let bonusReussite = 0;
    if (tauxReussite > 80) {
      bonusReussite = Math.floor(pointsBase * 0.5); // +50%
    } else if (tauxReussite > 60) {
      bonusReussite = Math.floor(pointsBase * 0.2); // +20%
    }

    // Bonus rapidité
    const tempsParQuestion = tempsTotal / nombreQuestions;
    const bonusRapidite = tempsParQuestion < 30 ? 10 : 0;

    // Total
    const pointsTotal = pointsBase + bonusReussite + bonusRapidite;

    return {
      pointsBase,
      bonusReussite,
      bonusRapidite,
      bonusSerie: 0,
      pointsTotal,
    };
  }

  /**
   * Attribue des points pour un badge obtenu
   */
  async awardBadgePoints(profileId: string, badgeId: number): Promise<void> {
    try {
      const POINTS_PAR_BADGE = 20;

      // Mettre à jour les points
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          points_total: supabase.rpc('increment', { x: POINTS_PAR_BADGE }),
          points_hebdo: supabase.rpc('increment', { x: POINTS_PAR_BADGE }),
          points_mensuel: supabase.rpc('increment', { x: POINTS_PAR_BADGE }),
        })
        .eq('id', profileId);

      if (updateError) {
        console.error('Erreur attribution points badge:', updateError);
        return;
      }

      // Enregistrer dans l'historique
      await supabase.from('points_history').insert({
        profile_id: profileId,
        points_gagnes: POINTS_PAR_BADGE,
        type_action: 'badge',
        description: `Badge obtenu (#${badgeId})`,
      });
    } catch (error) {
      console.error('Erreur service points badge:', error);
    }
  }

  /**
   * Récompense pour série de jours consécutifs
   */
  async checkAndAwardStreakBonus(profileId: string): Promise<number> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('derniere_activite, serie_actuelle')
        .eq('id', profileId)
        .single();

      if (!profile) {
        return 0;
      }

      const lastActivity = new Date(profile.derniere_activite);
      const today = new Date();
      const daysSinceLastActivity = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Si c'est le jour suivant, continuer la série
      if (daysSinceLastActivity === 1) {
        const newStreak = (profile.serie_actuelle || 0) + 1;
        const bonusPoints = newStreak * 5;

        await supabase
          .from('profiles')
          .update({
            serie_actuelle: newStreak,
            points_total: supabase.rpc('increment', { x: bonusPoints }),
            points_hebdo: supabase.rpc('increment', { x: bonusPoints }),
            points_mensuel: supabase.rpc('increment', { x: bonusPoints }),
            derniere_activite: today.toISOString(),
          })
          .eq('id', profileId);

        await supabase.from('points_history').insert({
          profile_id: profileId,
          points_gagnes: bonusPoints,
          type_action: 'serie',
          description: `Série de ${newStreak} jours`,
        });

        return bonusPoints;
      }
      // Si c'est le même jour, pas de bonus
      else if (daysSinceLastActivity === 0) {
        return 0;
      }
      // Si la série est cassée, la réinitialiser
      else {
        await supabase
          .from('profiles')
          .update({
            serie_actuelle: 1,
            derniere_activite: today.toISOString(),
          })
          .eq('id', profileId);
        return 0;
      }
    } catch (error) {
      console.error('Erreur vérification série:', error);
      return 0;
    }
  }

  /**
   * Récupère l'historique des points
   */
  async getPointsHistory(
    profileId: string,
    limit: number = 50
  ): Promise<
    Array<{
      id: number;
      points_gagnes: number;
      type_action: string;
      description: string;
      created_at: string;
    }>
  > {
    try {
      const { data, error } = await supabase
        .from('points_history')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erreur récupération historique:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur service historique points:', error);
      return [];
    }
  }

  /**
   * Récupère les statistiques de points
   */
  async getPointsStats(profileId: string): Promise<{
    totalGagne: number;
    moyenneParSession: number;
    meilleureSession: number;
    pointsCetteSemaine: number;
    pointsCeMois: number;
  }> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('points_total, points_hebdo, points_mensuel')
        .eq('id', profileId)
        .single();

      const { data: history } = await supabase
        .from('points_history')
        .select('points_gagnes, type_action')
        .eq('profile_id', profileId)
        .eq('type_action', 'session');

      const sessionPoints = history?.map(h => h.points_gagnes) || [];
      const totalSessions = sessionPoints.length;
      const totalGagne = profile?.points_total || 0;
      const moyenneParSession =
        totalSessions > 0
          ? Math.round(sessionPoints.reduce((a, b) => a + b, 0) / totalSessions)
          : 0;
      const meilleureSession = totalSessions > 0 ? Math.max(...sessionPoints) : 0;

      return {
        totalGagne,
        moyenneParSession,
        meilleureSession,
        pointsCetteSemaine: profile?.points_hebdo || 0,
        pointsCeMois: profile?.points_mensuel || 0,
      };
    } catch (error) {
      console.error('Erreur statistiques points:', error);
      return {
        totalGagne: 0,
        moyenneParSession: 0,
        meilleureSession: 0,
        pointsCetteSemaine: 0,
        pointsCeMois: 0,
      };
    }
  }

  /**
   * Reset hebdomadaire (à appeler chaque lundi)
   */
  async resetWeeklyPoints(): Promise<void> {
    try {
      await supabase.rpc('reset_points_hebdomadaires');
    } catch (error) {
      console.error('Erreur reset hebdomadaire:', error);
    }
  }

  /**
   * Reset mensuel (à appeler chaque 1er du mois)
   */
  async resetMonthlyPoints(): Promise<void> {
    try {
      await supabase.rpc('reset_points_mensuels');
    } catch (error) {
      console.error('Erreur reset mensuel:', error);
    }
  }
}

export const pointsService = new PointsService();
