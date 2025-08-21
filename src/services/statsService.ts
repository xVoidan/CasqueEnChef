import { supabase } from '../config/supabase';

interface SessionAverage {
  userAverage: number;
  globalAverage: number;
  personalBest: number;
  totalSessions: number;
  percentile: number;
  trend: number; // Pourcentage de variation par rapport à la moyenne précédente
  streak: number;
}

class StatsService {
  /**
   * Calcule la moyenne de l'utilisateur sur toutes ses sessions terminées
   */
  async getUserAverage(userId: string, limit?: number): Promise<number> {
    try {
      let query = supabase
        .from('sessions_quiz')
        .select('reponses_correctes, questions_repondues')
        .eq('user_id', userId)
        .eq('statut', 'termine')
        .order('completed_at', { ascending: false });

      // Si limite spécifiée, l'appliquer, sinon prendre toutes les sessions
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors du calcul de la moyenne utilisateur:', error);
        return 0;
      }

      if (!data || data.length === 0) {
        return 0;
      }

      // Calculer le taux de réussite moyen
      const totalSuccessRate = data.reduce((acc, session) => {
        const successRate =
          session.questions_repondues > 0
            ? (session.reponses_correctes / session.questions_repondues) * 100
            : 0;
        return acc + successRate;
      }, 0);

      return Math.round(totalSuccessRate / data.length);
    } catch (error) {
      console.error('Erreur service moyenne utilisateur:', error);
      return 0;
    }
  }

  /**
   * Calcule la moyenne globale de tous les utilisateurs
   */
  async getGlobalAverage(): Promise<number> {
    try {
      // Utiliser une fonction RPC si elle existe, sinon calculer directement
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_global_average');

      if (!rpcError && rpcData) {
        return Math.round(rpcData);
      }

      // Fallback: calcul direct
      const { data, error } = await supabase
        .from('sessions_quiz')
        .select('reponses_correctes, questions_repondues')
        .eq('statut', 'termine')
        .order('completed_at', { ascending: false })
        .limit(500); // Prendre les 500 dernières sessions pour la moyenne

      if (error) {
        console.error('Erreur lors du calcul de la moyenne globale:', error);
        return 68; // Valeur par défaut
      }

      if (!data || data.length === 0) {
        return 68;
      }

      const totalSuccessRate = data.reduce((acc, session) => {
        const successRate =
          session.questions_repondues > 0
            ? (session.reponses_correctes / session.questions_repondues) * 100
            : 0;
        return acc + successRate;
      }, 0);

      return Math.round(totalSuccessRate / data.length);
    } catch (error) {
      console.error('Erreur service moyenne globale:', error);
      return 68; // Valeur par défaut
    }
  }

  /**
   * Récupère le meilleur score de l'utilisateur
   */
  async getPersonalBest(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('sessions_quiz')
        .select('reponses_correctes, questions_repondues')
        .eq('user_id', userId)
        .eq('statut', 'termine');

      if (error || !data || data.length === 0) {
        return 0;
      }

      // Calculer le taux de réussite pour chaque session et trouver le meilleur
      const bestRate = Math.max(
        ...data
          .filter(session => session.questions_repondues > 0)
          .map(session => (session.reponses_correctes / session.questions_repondues) * 100)
      );

      return Math.round(bestRate);
    } catch (error) {
      console.error('Erreur récupération meilleur score:', error);
      return 0;
    }
  }

  /**
   * Calcule le percentile de l'utilisateur basé sur le taux de réussite
   */
  async getUserPercentile(userId: string, currentSuccessRate: number): Promise<number> {
    try {
      // Récupérer toutes les sessions pour calculer leur taux de réussite
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions_quiz')
        .select('reponses_correctes, questions_repondues')
        .eq('statut', 'termine');

      if (sessionsError || !sessions || sessions.length === 0) {
        return 50; // Valeur par défaut
      }

      // Calculer le taux de réussite pour chaque session
      const successRates = sessions
        .filter(s => s.questions_repondues > 0)
        .map(s => (s.reponses_correctes / s.questions_repondues) * 100);

      // Compter combien de sessions ont un taux inférieur
      const lowerCount = successRates.filter(rate => rate < currentSuccessRate).length;
      const totalCount = successRates.length;

      if (totalCount === 0) {
        return 50;
      }

      const percentile = Math.round((lowerCount / totalCount) * 100);
      return 100 - percentile; // Inverser pour avoir le top X%
    } catch (error) {
      console.error('Erreur calcul percentile:', error);
      return 50;
    }
  }

  /**
   * Calcule la tendance (évolution par rapport aux sessions précédentes)
   */
  async getUserTrend(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('sessions_quiz')
        .select('reponses_correctes, questions_repondues, completed_at')
        .eq('user_id', userId)
        .eq('statut', 'termine')
        .order('completed_at', { ascending: false })
        .limit(10);

      if (error || !data || data.length < 2) {
        return 0;
      }

      // Diviser en deux groupes: récent (5 premières) et ancien (5 suivantes)
      const recentSessions = data.slice(0, 5);
      const olderSessions = data.slice(5);

      const calculateAverage = (sessions: typeof data) => {
        const total = sessions.reduce((acc, session) => {
          const rate =
            session.questions_repondues > 0
              ? (session.reponses_correctes / session.questions_repondues) * 100
              : 0;
          return acc + rate;
        }, 0);
        return sessions.length > 0 ? total / sessions.length : 0;
      };

      const recentAvg = calculateAverage(recentSessions);
      const olderAvg = calculateAverage(olderSessions);

      if (olderAvg === 0) {
        return 0;
      }

      return Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
    } catch (error) {
      console.error('Erreur calcul tendance:', error);
      return 0;
    }
  }

  /**
   * Récupère la série de jours consécutifs
   */
  async getUserStreak(userId: string): Promise<number> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('serie_actuelle')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return 0;
      }

      return profile.serie_actuelle ?? 0;
    } catch (error) {
      console.error('Erreur récupération série:', error);
      return 0;
    }
  }

  /**
   * Récupère toutes les statistiques de comparaison pour une session
   */
  async getSessionComparison(userId: string, currentSuccessRate: number): Promise<SessionAverage> {
    const [userAverage, globalAverage, personalBest, percentile, trend, streak] = await Promise.all(
      [
        this.getUserAverage(userId),
        this.getGlobalAverage(),
        this.getPersonalBest(userId),
        this.getUserPercentile(userId, currentSuccessRate),
        this.getUserTrend(userId),
        this.getUserStreak(userId),
      ]
    );

    // Compter le nombre total de sessions
    const { count: totalSessions } = await supabase
      .from('sessions_quiz')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('statut', 'termine');

    return {
      userAverage,
      globalAverage,
      personalBest,
      totalSessions: totalSessions ?? 0,
      percentile,
      trend,
      streak,
    };
  }
}

export const statsService = new StatsService();
