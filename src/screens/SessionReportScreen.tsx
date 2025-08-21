import React, {
  /* eslint-disable react-native/no-inline-styles, react-native/no-color-literals */ useEffect,
  useState,
  useRef as _useRef,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
  BounceIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { shadows, typography, spacing, borderRadius } from '../styles/theme';
import { COLORS } from '../constants/styleConstants';
import { TrainingStackScreenProps } from '../types/navigation';
import { ButtonContainer } from '../components/ButtonContainer';

const { width: _SCREEN_WIDTH } = Dimensions.get('window');

interface SessionStats {
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

interface ThemeStat {
  themeId: number;
  themeName: string;
  themeColor: string;
  sousThemes: SousThemeStat[];
  totalQuestions: number;
  correctAnswers: number;
  successRate: number;
  points: number;
}

interface SousThemeStat {
  sousThemeId: number;
  sousThemeName: string;
  totalQuestions: number;
  correctAnswers: number;
  successRate: number;
}

interface FailedQuestion {
  questionId: number;
  enonce: string;
  themeName: string;
  sousThemeName: string;
  userAnswer: string | null;
  correctAnswer: string;
  explication: string;
}

export const SessionReportScreen: React.FC<TrainingStackScreenProps<'SessionReport'>> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const { user: _user } = useAuth();
  const [stats, _setStats] = useState<SessionStats | null>(
    (route.params?.stats as SessionStats | null) ?? null
  );
  const [loading, _setLoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<number | null>(null);
  const isAbandoned = route.params?.isAbandoned ?? false;

  const celebrationScale = useSharedValue(1);
  const starScale = useSharedValue(1);
  const progressAnimation = useSharedValue(0);

  const triggerCelebration = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    celebrationScale.value = withSequence(withSpring(1.2), withSpring(1));
    starScale.value = withDelay(200, withSequence(withSpring(1.3), withSpring(1)));
  }, [celebrationScale, starScale]);

  const triggerEncouragement = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    celebrationScale.value = withSequence(withTiming(0.95, { duration: 200 }), withSpring(1));
    starScale.value = withDelay(
      100,
      withSequence(withTiming(0.8, { duration: 200 }), withSpring(1))
    );
  }, [celebrationScale, starScale]);

  useEffect(() => {
    if (stats) {
      // Animation d'entrée depuis 0
      celebrationScale.value = 0;
      starScale.value = 0;

      // Puis animer vers 1 avec effet approprié
      celebrationScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 150 }));
      starScale.value = withDelay(400, withSpring(1, { damping: 15, stiffness: 150 }));

      // Déclencher les animations spécifiques selon le score
      if (stats.successRate >= 80 && !isAbandoned) {
        setTimeout(() => triggerCelebration(), 600);
      } else if (stats.successRate < 50 && !isAbandoned) {
        setTimeout(() => triggerEncouragement(), 600);
      }

      // Animer la progression
      progressAnimation.value = withDelay(500, withTiming(stats.successRate, { duration: 1500 }));
    }
  }, [
    stats,
    celebrationScale,
    starScale,
    progressAnimation,
    triggerCelebration,
    triggerEncouragement,
    isAbandoned,
  ]);

  const getGradeEmoji = (rate: number) => {
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
  };

  const getGradeColor = (rate: number) => {
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
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const shareResults = async () => {
    if (!stats) {
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const message =
        `🎯 Résultats de ma session CasqueEnMain !\n\n` +
        `📊 Score: ${stats.correctAnswers}/${stats.totalQuestions}\n` +
        `✨ Taux de réussite: ${stats.successRate.toFixed(0)}%\n` +
        `🏆 Points gagnés: ${stats.pointsEarned}\n\n` +
        `#CasqueEnMain #Formation #Sécurité`;

      await Share.share({ message });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  const startNewSession = (sameParams: boolean) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (sameParams && route.params?.sessionParams) {
      navigation.replace('TrainingSession', route.params.sessionParams);
    } else {
      navigation.navigate('TrainingConfig');
    }
  };

  const celebrationAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
    opacity: interpolate(celebrationScale.value, [0, 0.5, 1], [0, 0.8, 1]),
  }));

  const starAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }],
    opacity: interpolate(starScale.value, [0, 0.5, 1], [0, 0.8, 1]),
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressAnimation.value}%`,
  }));

  if (loading || !stats) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Calcul de vos résultats...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const gradeColor = getGradeColor(stats.successRate);
  const displayScore = Math.max(0, stats.score);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: 120 }}
      >
        {/* Header avec score principal */}
        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.header}>
          <LinearGradient
            colors={isAbandoned ? ['#F59E0B', '#F59E0BCC'] : [gradeColor, `${gradeColor}CC`]}
            style={styles.scoreCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Animated.View style={celebrationAnimatedStyle}>
              <Text style={styles.scoreTitle}>
                {isAbandoned ? 'Session Interrompue' : 'Score Final'}
              </Text>
              <View style={styles.scoreContainer}>
                <Animated.Text style={[styles.scoreText, starAnimatedStyle]}>
                  {stats.correctAnswers}/{stats.totalQuestions}
                </Animated.Text>
                <Animated.Text style={[styles.gradeEmoji, starAnimatedStyle]}>
                  {getGradeEmoji(stats.successRate)}
                </Animated.Text>
              </View>
              {isAbandoned && (
                <Text style={[styles.abandonedText, { color: colors.textSecondary }]}>
                  (Session abandonnée)
                </Text>
              )}
              <Text style={styles.scoreNote}>
                Note: {((stats.successRate * 20) / 100).toFixed(1)}/20
              </Text>
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* Message pour session abandonnée */}
        {isAbandoned && (
          <Animated.View
            entering={FadeInUp.duration(500).delay(300)}
            style={[styles.abandonedCard, { backgroundColor: '#F59E0B15' }]}
          >
            <Ionicons name="information-circle" size={24} color={COLORS.warning} />
            <Text style={[styles.abandonedMessageText, { color: colors.text }]}>
              Session interrompue avant la fin. Vos résultats partiels sont enregistrés.
            </Text>
          </Animated.View>
        )}

        {/* Statistiques principales */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(400)}
          style={[styles.statsCard, { backgroundColor: colors.surface }, shadows.sm]}
        >
          <Text style={[styles.statsTitle, { color: colors.text }]}>
            {isAbandoned ? 'Performance Partielle' : 'Performance'}
          </Text>

          {/* Barre de progression */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <Animated.View
                style={[styles.progressFill, { backgroundColor: gradeColor }, progressBarStyle]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.text }]}>
              {stats.successRate.toFixed(0)}% de réussite
            </Text>
          </View>

          {/* Stats en grille */}
          <View style={styles.statsGrid}>
            <Animated.View entering={SlideInRight.duration(500).delay(600)} style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.correctAnswers}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Bonnes réponses
              </Text>
            </Animated.View>

            <Animated.View entering={SlideInRight.duration(500).delay(700)} style={styles.statItem}>
              <Ionicons name="close-circle" size={24} color={COLORS.error} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.totalQuestions - stats.correctAnswers}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Erreurs</Text>
            </Animated.View>

            {stats.totalTime && (
              <Animated.View
                entering={SlideInRight.duration(500).delay(800)}
                style={styles.statItem}
              >
                <Ionicons name="time" size={24} color={COLORS.info} />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {formatTime(stats.totalTime)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Temps total</Text>
              </Animated.View>
            )}

            {stats.averageTime && (
              <Animated.View
                entering={SlideInRight.duration(500).delay(900)}
                style={styles.statItem}
              >
                <Ionicons name="speedometer" size={24} color={COLORS.warning} />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {formatTime(stats.averageTime)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Moy. par question
                </Text>
              </Animated.View>
            )}
          </View>

          {/* Points gagnés */}
          <Animated.View
            entering={BounceIn.duration(800).delay(1000)}
            style={[styles.pointsCard, { backgroundColor: `${colors.primary}15` }]}
          >
            <Ionicons name="trophy" size={28} color={colors.primary} />
            <View style={styles.pointsContent}>
              <Text style={[styles.pointsValue, { color: colors.primary }]}>
                {displayScore > 0 ? `+${displayScore.toFixed(0)}` : '0'} points
              </Text>
              <Text style={[styles.pointsLabel, { color: colors.textSecondary }]}>
                ajoutés à votre score total
              </Text>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Répartition par thème */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(1200)}
          style={[styles.themeCard, { backgroundColor: colors.surface }, shadows.sm]}
        >
          <Text style={[styles.themeTitle, { color: colors.text }]}>Répartition par thème</Text>

          {stats.themeStats.map(theme => (
            <TouchableOpacity
              key={theme.themeId}
              style={styles.themeItem}
              onPress={() =>
                setSelectedTheme(selectedTheme === theme.themeId ? null : theme.themeId)
              }
              activeOpacity={0.7}
            >
              <View style={styles.themeHeader}>
                <View style={styles.themeLeft}>
                  <View
                    style={[styles.themeColorIndicator, { backgroundColor: theme.themeColor }]}
                  />
                  <Text style={[styles.themeName, { color: colors.text }]}>{theme.themeName}</Text>
                </View>
                <View style={styles.themeRight}>
                  <Text style={[styles.themeScore, { color: colors.text }]}>
                    {theme.correctAnswers}/{theme.totalQuestions}
                  </Text>
                  <Text style={[styles.themePercentage, { color: colors.textSecondary }]}>
                    {theme.successRate.toFixed(0)}%
                  </Text>
                  <Ionicons
                    name={selectedTheme === theme.themeId ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
              </View>

              {selectedTheme === theme.themeId && (
                <Animated.View entering={FadeInDown.duration(300)} style={styles.sousThemesList}>
                  {theme.sousThemes.map(sousTheme => (
                    <View key={sousTheme.sousThemeId} style={styles.sousThemeItem}>
                      <Text style={[styles.sousThemeName, { color: colors.textSecondary }]}>
                        • {sousTheme.sousThemeName}
                      </Text>
                      <Text style={[styles.sousThemeScore, { color: colors.text }]}>
                        {sousTheme.correctAnswers}/{sousTheme.totalQuestions}
                      </Text>
                    </View>
                  ))}
                </Animated.View>
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Questions échouées */}
        {stats.failedQuestions.length > 0 && (
          <Animated.View
            entering={FadeInUp.duration(600).delay(1400)}
            style={[styles.failedQuestionsCard, { backgroundColor: colors.surface }, shadows.sm]}
          >
            <Text style={[styles.failedQuestionsTitle, { color: colors.text }]}>
              Questions à revoir
            </Text>
            <Text style={[styles.failedQuestionsCount, { color: colors.textSecondary }]}>
              {stats.failedQuestions.length} question{stats.failedQuestions.length > 1 ? 's' : ''} à
              réviser
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* Boutons d'action fixes en bas */}
      <ButtonContainer
        backgroundColor={colors.background}
        borderColor={colors.border}
        floating={false}
      >
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => void shareResults()}
          >
            <Ionicons name="share-outline" size={20} color={colors.primary} />
            <Text style={[styles.buttonText, { color: colors.primary }]}>Partager</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => startNewSession(false)}
          >
            <Ionicons name="refresh" size={20} color="#FFF" />
            <Text style={[styles.buttonText, { color: '#FFF' }]}>Nouvelle session</Text>
          </TouchableOpacity>
        </View>

        {route.params?.sessionParams && (
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.primary }]}
            onPress={() => startNewSession(true)}
          >
            <Ionicons name="reload" size={18} color={colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
              Refaire avec les mêmes paramètres
            </Text>
          </TouchableOpacity>
        )}
      </ButtonContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    marginBottom: spacing.xs,
  },
  scoreCard: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  scoreTitle: {
    ...typography.bodyBold,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  gradeEmoji: {
    fontSize: 26,
    marginLeft: spacing.sm,
  },
  scoreNote: {
    ...typography.body,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '500',
  },
  abandonedText: {
    ...typography.body,
    marginTop: spacing.xs,
    textAlign: 'center',
    opacity: 0.8,
  },
  abandonedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  abandonedMessageText: {
    ...typography.small,
    marginLeft: spacing.sm,
    flex: 1,
  },
  statsCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  statsTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    ...typography.caption,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm,
  },
  statItem: {
    width: '50%',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.small,
    textAlign: 'center',
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  pointsContent: {
    marginLeft: spacing.md,
  },
  pointsValue: {
    ...typography.h4,
    fontWeight: 'bold',
  },
  pointsLabel: {
    ...typography.caption,
  },
  themeCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  themeTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  themeItem: {
    marginBottom: spacing.sm,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeColorIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  themeName: {
    ...typography.body,
    flex: 1,
  },
  themeRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeScore: {
    ...typography.bodyBold,
    marginRight: spacing.sm,
  },
  themePercentage: {
    ...typography.small,
    marginRight: spacing.sm,
  },
  sousThemesList: {
    paddingLeft: spacing.xl,
    paddingTop: spacing.xs,
  },
  sousThemeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  sousThemeName: {
    ...typography.small,
    flex: 1,
  },
  sousThemeScore: {
    ...typography.small,
    fontWeight: '600',
  },
  failedQuestionsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  failedQuestionsTitle: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  failedQuestionsCount: {
    ...typography.body,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  buttonText: {
    ...typography.bodyBold,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  secondaryButtonText: {
    ...typography.small,
    fontWeight: '600',
  },
});
