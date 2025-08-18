import { supabase } from '../config/supabase';

export interface ThemeStats {
  theme_id: number;
  theme_nom: string;
  theme_couleur: string;
  theme_icone: string;
  total_questions: number;
  questions_correctes: number;
  taux_reussite: number;
  derniere_session: string | null;
  temps_total: number;
}

export interface SessionDetailed {
  session_id: number;
  created_at: string;
  type_session: string;
  nombre_questions: number;
  nombre_reponses_correctes: number;
  temps_total: number;
  score: number;
  statut: string;
  themes: string[];
  sous_themes: string[];
  niveau_moyen: number;
}

export interface UserObjectives {
  objectif_quotidien: number;
  questions_aujourdhui: number;
  temps_aujourdhui: number;
  taux_reussite_aujourdhui: number;
  serie_actuelle: number;
  meilleure_serie: number;
  total_sessions: number;
  total_questions: number;
  badges_gagnes: {
    premiere_session: boolean;
    serie_7_jours: boolean;
    serie_30_jours: boolean;
    centurion: boolean;
    millionaire: boolean;
    expert_maths: boolean;
    expert_francais: boolean;
    expert_metier: boolean;
    perfectionniste: boolean;
    marathonien: boolean;
  };
}

export interface WeeklyPerformance {
  jour_semaine: number;
  jour_nom: string;
  score_moyen: number;
  nombre_sessions: number;
  nombre_questions: number;
}

export interface SousThemeStats {
  sous_theme_id: number;
  sous_theme_nom: string;
  theme_nom: string;
  total_questions: number;
  questions_correctes: number;
  taux_reussite: number;
  niveau_moyen: number;
  derniere_pratique: string | null;
}

class ProgressService {
  async getUserStatsByTheme(userId: string): Promise<ThemeStats[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_stats_by_theme', { p_user_id: userId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching theme stats:', error);
      return [];
    }
  }

  async getUserSessionsDetailed(userId: string, limit: number = 50): Promise<SessionDetailed[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_sessions_detailed', { 
          p_user_id: userId,
          p_limit: limit 
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching detailed sessions:', error);
      return [];
    }
  }

  async getUserObjectivesAndBadges(userId: string): Promise<UserObjectives | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_objectives_and_badges', { p_user_id: userId });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching objectives and badges:', error);
      return null;
    }
  }

  async getWeeklyPerformance(userId: string): Promise<WeeklyPerformance[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_weekly_performance', { p_user_id: userId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching weekly performance:', error);
      return [];
    }
  }

  async getUserStatsBySousTheme(userId: string, themeId?: number): Promise<SousThemeStats[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_stats_by_sous_theme', { 
          p_user_id: userId,
          p_theme_id: themeId || null
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sous-theme stats:', error);
      return [];
    }
  }

  formatTimeAgo(dateString: string | null): string {
    if (!dateString) return 'Jamais';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Aujourd'hui";
    if (diffInHours < 24) return "Aujourd'hui";
    if (diffInHours < 48) return 'Hier';
    if (diffInHours < 168) return `Il y a ${Math.floor(diffInHours / 24)} jours`;
    if (diffInHours < 720) return `Il y a ${Math.floor(diffInHours / 168)} semaines`;
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  }

  formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}min`;
    }
    return `${minutes} min`;
  }

  getIconForTheme(themeName: string): string {
    const iconMap: { [key: string]: string } = {
      'Mathématiques': 'calculator',
      'Français': 'book',
      'Métier': 'flame',
      'Culture Générale': 'globe',
      'Sécurité Civile': 'shield-checkmark',
      'Droit Public': 'document-text',
      'Gestion Opérationnelle': 'settings'
    };
    
    return iconMap[themeName] || 'help-circle';
  }

  getBadgeInfo(badgeKey: string): { name: string; description: string; icon: string; color: string } {
    const badges: { [key: string]: any } = {
      premiere_session: {
        name: 'Première session',
        description: 'Complétez votre première session',
        icon: 'rocket',
        color: '#3B82F6'
      },
      serie_7_jours: {
        name: 'Série de 7 jours',
        description: 'Entraînez-vous 7 jours consécutifs',
        icon: 'flame',
        color: '#EF4444'
      },
      serie_30_jours: {
        name: 'Série de 30 jours',
        description: 'Entraînez-vous 30 jours consécutifs',
        icon: 'flame-sharp',
        color: '#DC2626'
      },
      centurion: {
        name: 'Centurion',
        description: 'Répondez à 100 questions',
        icon: 'medal',
        color: '#F59E0B'
      },
      millionaire: {
        name: 'Millionnaire',
        description: 'Répondez à 1000 questions',
        icon: 'trophy',
        color: '#FFD700'
      },
      expert_maths: {
        name: 'Expert Mathématiques',
        description: '50 bonnes réponses en Mathématiques',
        icon: 'calculator',
        color: '#3B82F6'
      },
      expert_francais: {
        name: 'Expert Français',
        description: '50 bonnes réponses en Français',
        icon: 'book',
        color: '#10B981'
      },
      expert_metier: {
        name: 'Expert Métier',
        description: '50 bonnes réponses en Métier',
        icon: 'flame',
        color: '#DC2626'
      },
      perfectionniste: {
        name: 'Perfectionniste',
        description: 'Obtenez 100% sur une session de 10+ questions',
        icon: 'star',
        color: '#8B5CF6'
      },
      marathonien: {
        name: 'Marathonien',
        description: "Étudiez pendant plus d'une heure",
        icon: 'time',
        color: '#EC4899'
      }
    };
    
    return badges[badgeKey] || {
      name: 'Badge inconnu',
      description: '',
      icon: 'help-circle',
      color: '#6B7280'
    };
  }
}

export const progressService = new ProgressService();