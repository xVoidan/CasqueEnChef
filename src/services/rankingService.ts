import { supabase } from '../config/supabase';

export type RankingType = 'global' | 'hebdomadaire' | 'mensuel';
export type Evolution = 'up' | 'down' | 'stable' | 'new';

export interface RankingUser {
  rang: number;
  user_id: string;
  username: string;
  avatar_url?: string;
  points_total?: number;
  points_periode?: number;
  niveau: string;
  concours_type?: string;
  evolution?: Evolution;
  est_utilisateur_actuel: boolean;
}

export interface UserPosition {
  type_classement: string;
  rang: number;
  points: number;
  total_participants: number;
}

export interface ThemeRanking {
  rang: number;
  user_id: string;
  username: string;
  avatar_url?: string;
  questions_reussies: number;
  taux_reussite: number;
  temps_moyen: number;
  est_utilisateur_actuel: boolean;
}

class RankingService {
  /**
   * Récupère le classement global
   */
  async getGlobalRanking(limit: number = 100, offset: number = 0): Promise<RankingUser[]> {
    try {
      const { data, error } = await supabase.rpc('get_classement_global', {
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        console.error('Erreur récupération classement global:', error);
        return [];
      }

      return data ?? [];
    } catch (error) {
      console.error('Erreur service classement global:', error);
      return [];
    }
  }

  /**
   * Récupère le classement par type de concours
   */
  async getRankingByConcours(
    concoursType: 'caporal' | 'lieutenant',
    limit: number = 100,
    offset: number = 0
  ): Promise<RankingUser[]> {
    try {
      const { data, error } = await supabase.rpc('get_classement_par_concours', {
        p_concours_type: concoursType,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        console.error('Erreur récupération classement par concours:', error);
        return this.getMockRankings(concoursType);
      }

      return data ?? this.getMockRankings(concoursType);
    } catch (error) {
      console.error('Erreur service classement par concours:', error);
      return this.getMockRankings(concoursType);
    }
  }

  /**
   * Récupère le classement hebdomadaire
   */
  async getWeeklyRanking(limit: number = 100, offset: number = 0): Promise<RankingUser[]> {
    try {
      const { data, error } = await supabase.rpc('get_classement_hebdomadaire', {
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        console.error('Erreur récupération classement hebdomadaire:', error);
        return [];
      }

      return data ?? [];
    } catch (error) {
      console.error('Erreur service classement hebdomadaire:', error);
      return [];
    }
  }

  /**
   * Récupère le classement mensuel
   */
  async getMonthlyRanking(limit: number = 100, offset: number = 0): Promise<RankingUser[]> {
    try {
      const { data, error } = await supabase.rpc('get_classement_mensuel', {
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        console.error('Erreur récupération classement mensuel:', error);
        return [];
      }

      return data ?? [];
    } catch (error) {
      console.error('Erreur service classement mensuel:', error);
      return [];
    }
  }

  /**
   * Récupère la position de l'utilisateur dans différents classements
   */
  async getUserPositions(userId?: string): Promise<UserPosition[]> {
    try {
      const { data, error } = await supabase.rpc('get_position_utilisateur', {
        p_user_id: userId ?? null,
      });

      if (error) {
        console.error('Erreur récupération position utilisateur:', error);
        return [];
      }

      return data ?? [];
    } catch (error) {
      console.error('Erreur service position utilisateur:', error);
      return [];
    }
  }

  /**
   * Récupère le classement par thématique
   */
  async getRankingByTheme(
    themeId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<ThemeRanking[]> {
    try {
      const { data, error } = await supabase.rpc('get_classement_par_theme', {
        p_theme_id: themeId,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        console.error('Erreur récupération classement par thème:', error);
        return [];
      }

      return data ?? [];
    } catch (error) {
      console.error('Erreur service classement par thème:', error);
      return [];
    }
  }

  /**
   * Recherche un utilisateur dans le classement
   */
  async searchUserInRanking(searchTerm: string): Promise<RankingUser[]> {
    try {
      const { data, error } = await supabase.rpc('rechercher_utilisateur_classement', {
        p_search_term: searchTerm,
      });

      if (error) {
        console.error('Erreur recherche utilisateur:', error);
        return [];
      }

      return (
        data?.map(
          (user: {
            rang_global: number;
            user_id: string;
            username: string;
            avatar_url: string | null;
            points_total: number;
            streak_actuel: number;
            sessions_terminees: number;
            taux_reussite: number;
          }) => ({
            rang: user.rang_global,
            user_id: user.user_id,
            username: user.username,
            avatar_url: user.avatar_url,
            points_total: user.points_total,
            est_utilisateur_actuel: false,
          })
        ) ?? []
      );
    } catch (error) {
      console.error('Erreur service recherche utilisateur:', error);
      return [];
    }
  }

  /**
   * Génère des données de classement fictives
   */
  private getMockRankings(type: RankingType | 'caporal' | 'lieutenant'): RankingUser[] {
    const mockUsers = [
      { name: 'Sophie Martin', avatar: '👩', points: 2850, evolution: 'up' as Evolution },
      { name: 'Lucas Dubois', avatar: '👨', points: 2720, evolution: 'up' as Evolution },
      { name: 'Emma Bernard', avatar: '👩‍🦰', points: 2680, evolution: 'down' as Evolution },
      { name: 'Thomas Petit', avatar: '🧑', points: 2550, evolution: 'stable' as Evolution },
      { name: 'Marie Durand', avatar: '👩‍🦱', points: 2480, evolution: 'up' as Evolution },
      { name: 'Pierre Leroy', avatar: '👨‍🦱', points: 2420, evolution: 'new' as Evolution },
      { name: 'Julie Moreau', avatar: '👩‍🦳', points: 2380, evolution: 'down' as Evolution },
      { name: 'Alexandre Simon', avatar: '🧔', points: 2320, evolution: 'up' as Evolution },
      { name: 'Camille Laurent', avatar: '👱‍♀️', points: 2280, evolution: 'stable' as Evolution },
      { name: 'Nicolas Michel', avatar: '👨‍🦲', points: 2150, evolution: 'down' as Evolution },
    ];

    return mockUsers.map((user, index) => ({
      rang: index + 1,
      user_id: `mock-${index}`,
      username: user.name,
      avatar_url: user.avatar,
      points_total:
        type === 'hebdomadaire'
          ? Math.floor(user.points / 10)
          : type === 'mensuel'
            ? Math.floor(user.points / 3)
            : user.points,
      points_periode:
        type === 'hebdomadaire' || type === 'mensuel'
          ? Math.floor(user.points / (type === 'hebdomadaire' ? 10 : 3))
          : undefined,
      niveau: index < 3 ? 'avance' : index < 6 ? 'intermediaire' : 'debutant',
      concours_type:
        type === 'caporal'
          ? 'caporal'
          : type === 'lieutenant'
            ? 'lieutenant'
            : index % 2 === 0
              ? 'caporal'
              : 'lieutenant',
      evolution: user.evolution,
      est_utilisateur_actuel: index === 3,
    }));
  }

  /**
   * Génère des positions fictives pour l'utilisateur
   */
  private getMockUserPositions(): UserPosition[] {
    return [
      {
        type_classement: 'global',
        rang: 42,
        points: 1850,
        total_participants: 523,
      },
      {
        type_classement: 'hebdomadaire',
        rang: 15,
        points: 185,
        total_participants: 287,
      },
      {
        type_classement: 'mensuel',
        rang: 28,
        points: 620,
        total_participants: 412,
      },
    ];
  }

  /**
   * Génère des données de classement par thème fictives
   */
  private getMockThemeRankings(): ThemeRanking[] {
    const mockUsers = [
      { name: 'Sophie Martin', avatar: '👩', reussies: 145, taux: 92.5, temps: 35 },
      { name: 'Lucas Dubois', avatar: '👨', reussies: 138, taux: 89.2, temps: 42 },
      { name: 'Emma Bernard', avatar: '👩‍🦰', reussies: 132, taux: 87.8, temps: 38 },
      { name: 'Thomas Petit', avatar: '🧑', reussies: 125, taux: 85.3, temps: 45 },
      { name: 'Marie Durand', avatar: '👩‍🦱', reussies: 118, taux: 83.1, temps: 40 },
    ];

    return mockUsers.map((user, index) => ({
      rang: index + 1,
      user_id: `mock-${index}`,
      username: user.name,
      avatar_url: user.avatar,
      questions_reussies: user.reussies,
      taux_reussite: user.taux,
      temps_moyen: user.temps,
      est_utilisateur_actuel: index === 2,
    }));
  }

  /**
   * Met à jour les rangs (à appeler périodiquement)
   */
  async updateRanks(): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('update_rangs');

      if (error) {
        console.error('Erreur mise à jour des rangs:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur service mise à jour des rangs:', error);
      return false;
    }
  }
}

export const rankingService = new RankingService();
