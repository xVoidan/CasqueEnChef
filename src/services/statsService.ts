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
   * Calcule la moyenne de l'utilisateur sur ses dernières sessions
   */
  async getUserAverage(userId: string, limit: number = 20): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('score, nombre_questions')
        .eq('user_id', userId)
        .eq('statut', 'termine')
        .order('date_fin', { ascending: false })
        .limit(limit);

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
          session.nombre_questions > 0 ? (session.score / session.nombre_questions) * 100 : 0;
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
        .from('sessions')
        .select('score, nombre_questions')
        .eq('statut', 'termine')
        .order('date_fin', { ascending: false })
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
          session.nombre_questions > 0 ? (session.score / session.nombre_questions) * 100 : 0;
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
        .from('sessions')
        .select('score, nombre_questions')
        .eq('user_id', userId)
        .eq('statut', 'termine')
        .order('score', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return 0;
      }

      return data.nombre_questions > 0 ? Math.round((data.score / data.nombre_questions) * 100) : 0;
    } catch (error) {
      console.error('Erreur récupération meilleur score:', error);
      return 0;
    }
  }

  /**
   * Calcule le percentile de l'utilisateur
   */
  async getUserPercentile(userId: string, currentScore: number): Promise<number> {
    try {
      // Compter combien de sessions ont un score inférieur
      const { count: lowerCount, error: lowerError } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('statut', 'termine')
        .lt('score', currentScore);

      const { count: totalCount, error: totalError } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('statut', 'termine');

      if (lowerError || totalError || !totalCount) {
        return 50; // Valeur par défaut
      }

      const percentile = Math.round((lowerCount! / totalCount) * 100);
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
        .from('sessions')
        .select('score, nombre_questions, date_fin')
        .eq('user_id', userId)
        .eq('statut', 'termine')
        .order('date_fin', { ascending: false })
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
            session.nombre_questions > 0 ? (session.score / session.nombre_questions) * 100 : 0;
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
        .select('jours_consecutifs')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return 0;
      }

      return profile.jours_consecutifs ?? 0;
    } catch (error) {
      console.error('Erreur récupération série:', error);
      return 0;
    }
  }

  /**
   * Récupère toutes les statistiques de comparaison pour une session
   */
  async getSessionComparison(userId: string, currentScore: number): Promise<SessionAverage> {
    const [userAverage, globalAverage, personalBest, percentile, trend, streak] = await Promise.all(
      [
        this.getUserAverage(userId),
        this.getGlobalAverage(),
        this.getPersonalBest(userId),
        this.getUserPercentile(userId, currentScore),
        this.getUserTrend(userId),
        this.getUserStreak(userId),
      ]
    );

    // Compter le nombre total de sessions
    const { count: totalSessions } = await supabase
      .from('sessions')
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
