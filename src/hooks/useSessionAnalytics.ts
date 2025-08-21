import { useMemo, useCallback } from 'react';
import { Achievement } from '../components/AchievementBadge';
import { Advice } from '../components/PersonalizedAdvice';

export interface SessionStats {
  sessionId: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  successRate: number;
  totalTime: number | null;
  averageTime: number | null;
  themeStats: ThemeStat[];
  failedQuestions: FailedQuestion[];
  pointsEarned: number;
}

export interface ThemeStat {
  themeId: number;
  themeName: string;
  themeColor: string;
  sousThemes: SousThemeStat[];
  totalQuestions: number;
  correctAnswers: number;
  successRate: number;
  points: number;
}

export interface SousThemeStat {
  sousThemeId: number;
  sousThemeName: string;
  totalQuestions: number;
  correctAnswers: number;
  successRate: number;
}

export interface FailedQuestion {
  questionId: number;
  enonce: string;
  themeName: string;
  sousThemeName: string;
  userAnswer: string | null;
  correctAnswer: string;
  explication: string;
}

export interface SessionTrend {
  improvement: number;
  streak: number;
  bestTheme: string;
  worstTheme: string;
  timeImprovement: number;
}

export const useSessionAnalytics = (
  stats: SessionStats | null,
  isAbandoned: boolean = false,
  onNavigate?: (screen: string) => void
) => {
  // Générer les achievements avec mémoisation
  const achievements = useMemo((): Achievement[] => {
    if (!stats) {
      return [];
    }

    const results: Achievement[] = [];

    // Perfect Score
    if (stats.successRate === 100 && !isAbandoned) {
      results.push({
        id: 'perfect',
        title: 'Parfait!',
        description: 'Aucune erreur',
        icon: 'star',
        color: '#FFD700',
        unlocked: true,
        rarity: 'legendary',
      });
    }

    // Speed Demon
    if (stats.averageTime && stats.averageTime < 30 && !isAbandoned) {
      results.push({
        id: 'speed',
        title: 'Éclair',
        description: 'Moins de 30s/question',
        icon: 'flash',
        color: '#3B82F6',
        unlocked: true,
        rarity: 'rare',
      });
    }

    // Expert (80% success)
    if (stats.correctAnswers >= stats.totalQuestions * 0.8 && !isAbandoned) {
      results.push({
        id: 'expert',
        title: 'Expert',
        description: '80% de réussite',
        icon: 'school',
        color: '#10B981',
        unlocked: true,
        rarity: 'epic',
      });
    }

    // Persistent (20+ questions)
    if (stats.totalQuestions >= 20) {
      results.push({
        id: 'persistent',
        title: 'Persévérant',
        description: '20+ questions',
        icon: 'trending-up',
        color: '#F59E0B',
        unlocked: true,
        rarity: 'common',
      });
    }

    // Focused (single theme mastery)
    const masteredThemes = stats.themeStats.filter(t => t.successRate >= 90);
    if (masteredThemes.length > 0 && !isAbandoned) {
      results.push({
        id: 'focused',
        title: 'Spécialiste',
        description: `Maîtrise de ${masteredThemes[0].themeName}`,
        icon: 'shield-checkmark',
        color: '#8B5CF6',
        unlocked: true,
        rarity: 'epic',
      });
    }

    // Comeback Kid (improvement from low score)
    if (stats.successRate >= 60 && stats.successRate < 70) {
      results.push({
        id: 'comeback',
        title: 'En progression',
        description: 'Continue comme ça!',
        icon: 'arrow-up-circle',
        color: '#06B6D4',
        unlocked: true,
        rarity: 'common',
      });
    }

    return results;
  }, [stats, isAbandoned]);

  // Générer les conseils personnalisés avec mémoisation
  const advices = useMemo((): Advice[] => {
    if (!stats) {
      return [];
    }

    const results: Advice[] = [];

    // Points forts
    const strongThemes = stats.themeStats.filter(t => t.successRate >= 80);
    if (strongThemes.length > 0) {
      results.push({
        id: 'strength1',
        type: 'strength',
        title: 'Points forts identifiés',
        description: `Excellent travail en ${strongThemes.map(t => t.themeName).join(', ')}! Continuez sur cette lancée.`,
      });
    }

    // Points faibles
    const weakThemes = stats.themeStats.filter(t => t.successRate < 60);
    if (weakThemes.length > 0) {
      results.push({
        id: 'weakness1',
        type: 'weakness',
        title: "Axes d'amélioration",
        description: `Concentrez vos révisions sur: ${weakThemes.map(t => t.themeName).join(', ')}.`,
        action: onNavigate
          ? {
              label: 'Réviser ces thèmes',
              onPress: () => onNavigate('TrainingConfig'),
            }
          : undefined,
      });

      // Conseil spécifique par thème faible
      weakThemes.slice(0, 2).forEach((theme, index) => {
        const worstSubThemes = theme.sousThemes
          .filter(st => st.successRate < 50)
          .map(st => st.sousThemeName);

        if (worstSubThemes.length > 0) {
          results.push({
            id: `weakness_detail_${index}`,
            type: 'weakness',
            title: `Focus ${theme.themeName}`,
            description: `Revoyez particulièrement: ${worstSubThemes.join(', ')}`,
          });
        }
      });
    }

    // Conseils de temps
    if (stats.averageTime) {
      if (stats.averageTime > 60) {
        results.push({
          id: 'time1',
          type: 'tip',
          title: 'Gestion du temps',
          description:
            'Essayez de répondre plus rapidement. Visez moins de 60 secondes par question.',
        });
      } else if (stats.averageTime < 20) {
        results.push({
          id: 'time2',
          type: 'tip',
          title: 'Prenez votre temps',
          description: 'Vous répondez très vite! Assurez-vous de bien lire chaque question.',
        });
      }
    }

    // Défis selon le niveau
    if (stats.successRate >= 90 && !isAbandoned) {
      results.push({
        id: 'challenge1',
        type: 'challenge',
        title: 'Défi ultime',
        description: 'Prêt pour le mode expert? Tentez 100% de réussite sur 50 questions!',
        action: onNavigate
          ? {
              label: 'Relever le défi',
              onPress: () => onNavigate('TrainingConfig'),
            }
          : undefined,
      });
    } else if (stats.successRate >= 70 && !isAbandoned) {
      results.push({
        id: 'challenge2',
        type: 'challenge',
        title: 'Nouveau défi',
        description: 'Prêt pour le niveau supérieur? Essayez le mode chronométré!',
        action: onNavigate
          ? {
              label: 'Essayer',
              onPress: () => onNavigate('TrainingConfig'),
            }
          : undefined,
      });
    }

    // Conseil de régularité
    if (stats.totalQuestions < 10) {
      results.push({
        id: 'tip2',
        type: 'tip',
        title: 'Entraînement régulier',
        description:
          'Faites au moins 10 questions par session pour un meilleur suivi de progression.',
      });
    }

    return results;
  }, [stats, isAbandoned, onNavigate]);

  // Calculer les tendances
  const trends = useMemo((): SessionTrend | null => {
    if (!stats) {
      return null;
    }

    const bestTheme = stats.themeStats.reduce((best, current) =>
      current.successRate > best.successRate ? current : best
    );

    const worstTheme = stats.themeStats.reduce((worst, current) =>
      current.successRate < worst.successRate ? current : worst
    );

    return {
      improvement: 0, // À calculer avec l'historique
      streak: 0, // À calculer avec l'historique
      bestTheme: bestTheme.themeName,
      worstTheme: worstTheme.themeName,
      timeImprovement: 0, // À calculer avec l'historique
    };
  }, [stats]);

  // Fonctions utilitaires
  const getGradeEmoji = useCallback((rate: number) => {
    if (rate >= 90) {
      return '🏆';
    }
    if (rate >= 80) {
      return '⭐';
    }
    if (rate >= 70) {
      return '👍';
    }
    if (rate >= 60) {
      return '💪';
    }
    return '📚';
  }, []);

  const getGradeColor = useCallback((rate: number) => {
    if (rate >= 90) {
      return '#FFD700';
    }
    if (rate >= 80) {
      return '#10B981';
    }
    if (rate >= 70) {
      return '#3B82F6';
    }
    if (rate >= 60) {
      return '#F59E0B';
    }
    return '#EF4444';
  }, []);

  const getGradeLabel = useCallback((rate: number) => {
    if (rate >= 90) {
      return 'Excellent';
    }
    if (rate >= 80) {
      return 'Très bien';
    }
    if (rate >= 70) {
      return 'Bien';
    }
    if (rate >= 60) {
      return 'Assez bien';
    }
    return 'À améliorer';
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getScoreMessage = useCallback((rate: number, isAbandoned: boolean) => {
    if (isAbandoned) {
      return 'Session interrompue - Continuez votre entraînement!';
    }
    if (rate >= 90) {
      return 'Performance exceptionnelle! Vous maîtrisez le sujet!';
    }
    if (rate >= 80) {
      return 'Excellent travail! Vous êtes sur la bonne voie!';
    }
    if (rate >= 70) {
      return 'Bon résultat! Continuez vos efforts!';
    }
    if (rate >= 60) {
      return 'Pas mal! Avec un peu plus de pratique, vous y arriverez!';
    }
    return 'Ne vous découragez pas! La pratique fait le maître!';
  }, []);

  // Préparer les données pour les graphiques
  const barChartData = useMemo(() => {
    if (!stats) {
      return [];
    }

    const defaultColors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    
    return stats.themeStats.map((theme, index) => ({
      label: theme.themeName.length > 8 ? theme.themeName.substring(0, 8) + '...' : theme.themeName,
      value: theme.successRate,
      color: theme.themeColor || defaultColors[index % defaultColors.length],
      fullLabel: theme.themeName,
    }));
  }, [stats]);

  return {
    achievements,
    advices,
    trends,
    getGradeEmoji,
    getGradeColor,
    getGradeLabel,
    formatTime,
    getScoreMessage,
    barChartData,
  };
};
