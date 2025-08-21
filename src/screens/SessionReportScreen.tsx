import React, {
  /* eslint-disable react-native/no-inline-styles, react-native/no-color-literals */ useEffect,
  useState,
  useRef as _useRef,
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
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  useEffect(() => {
    // Animation douce au chargement
    celebrationScale.value = withDelay(200, withSpring(1.05));
    starScale.value = withSequence(withDelay(400, withSpring(1.1)), withSpring(1));

    if (stats) {
      progressAnimation.value = withDelay(300, withTiming(stats.successRate, { duration: 1500 }));
    }
  }, [celebrationScale, starScale, progressAnimation, stats]);

  const getGradeColor = (rate: number) => {
    if (rate >= 80) {
      return COLORS.success;
    }
    if (rate >= 60) {
      return COLORS.warning;
    }
    if (rate >= 40) {
      return '#FFA500';
    }
    return COLORS.error;
  };

  const getGradeEmoji = (rate: number) => {
    if (rate >= 90) {
      return '🏆';
    }
    if (rate >= 80) {
      return '⭐';
    }
    if (rate >= 70) {
      return '✨';
    }
    if (rate >= 60) {
      return '👍';
    }
    if (rate >= 50) {
      return '💪';
    }
    if (rate >= 40) {
      return '📚';
    }
    return '🎯';
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleShare = async () => {
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

  const handleNewSession = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('TrainingConfig');
  };

  const handleGoHome = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('HomeScreen' as never);
  };

  const celebrationAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));

  const starAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }],
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressAnimation.value}%`,
  }));

  if (loading || !stats) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header compact avec navigation */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoHome} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isAbandoned ? 'Session Interrompue' : 'Résultats'}
          </Text>
          <TouchableOpacity onPress={() => void handleShare()} style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Score principal - Design compact */}
        <View style={[styles.scoreSection, { backgroundColor: colors.surface }]}>
          <Animated.View style={[styles.scoreCircle, celebrationAnimatedStyle]}>
            <LinearGradient
              colors={[gradeColor, `${gradeColor}88`]}
              style={styles.scoreGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Animated.Text style={[styles.scoreEmoji, starAnimatedStyle]}>
                {getGradeEmoji(stats.successRate)}
              </Animated.Text>
              <Text style={styles.scoreValue}>
                {stats.correctAnswers}/{stats.totalQuestions}
              </Text>
              <Text style={styles.scoreLabel}>{stats.successRate.toFixed(0)}% de réussite</Text>
            </LinearGradient>
          </Animated.View>

          {/* Note sur 20 */}
          <View style={styles.gradeContainer}>
            <Text style={[styles.gradeText, { color: colors.text }]}>
              Note: {((stats.successRate * 20) / 100).toFixed(1)}/20
            </Text>
            {displayScore > 0 && (
              <Text style={[styles.pointsText, { color: colors.primary }]}>
                +{displayScore.toFixed(0)} points
              </Text>
            )}
          </View>
        </View>

        {/* Statistiques détaillées */}
        <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistiques</Text>

          {/* Barre de progression */}
          <View style={styles.progressWrapper}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <Animated.View
                style={[styles.progressFill, { backgroundColor: gradeColor }, progressBarStyle]}
              />
            </View>
          </View>

          {/* Grille de stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.correctAnswers}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Correct</Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="close-circle" size={20} color={COLORS.error} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.totalQuestions - stats.correctAnswers}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Erreurs</Text>
            </View>

            {stats.totalTime && (
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={20} color={COLORS.info} />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {formatTime(stats.totalTime)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Temps</Text>
              </View>
            )}

            {stats.averageTime && (
              <View style={styles.statItem}>
                <Ionicons name="speedometer-outline" size={20} color={COLORS.warning} />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {formatTime(stats.averageTime)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Moy/Q</Text>
              </View>
            )}
          </View>
        </View>

        {/* Performance par thème */}
        <View style={[styles.themesContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Performance par thème</Text>

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
                <View style={styles.themeInfo}>
                  <View style={[styles.themeIcon, { backgroundColor: `${theme.themeColor}20` }]}>
                    <Text style={{ color: theme.themeColor }}>{theme.themeName.charAt(0)}</Text>
                  </View>
                  <Text style={[styles.themeName, { color: colors.text }]}>{theme.themeName}</Text>
                </View>
                <View style={styles.themeScore}>
                  <Text style={[styles.themeScoreText, { color: colors.text }]}>
                    {theme.correctAnswers}/{theme.totalQuestions}
                  </Text>
                  <Ionicons
                    name={selectedTheme === theme.themeId ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.textSecondary}
                  />
                </View>
              </View>

              {/* Détails du thème (expandable) */}
              {selectedTheme === theme.themeId && (
                <Animated.View entering={FadeInDown.duration(300)} style={styles.themeDetails}>
                  {theme.sousThemes.map(sousTheme => (
                    <View key={sousTheme.sousThemeId} style={styles.sousThemeItem}>
                      <Text style={[styles.sousThemeName, { color: colors.textSecondary }]}>
                        {sousTheme.sousThemeName}
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
        </View>

        {/* Questions échouées */}
        {stats.failedQuestions.length > 0 && (
          <View style={[styles.failedContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              À revoir ({stats.failedQuestions.length})
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.failedScroll}
            >
              {stats.failedQuestions.map(question => (
                <View
                  key={question.questionId}
                  style={[styles.failedCard, { backgroundColor: colors.background }]}
                >
                  <Text style={[styles.failedQuestion, { color: colors.text }]} numberOfLines={3}>
                    {question.enonce}
                  </Text>
                  <View style={styles.failedInfo}>
                    <Text style={[styles.failedTheme, { color: colors.textSecondary }]}>
                      {question.themeName}
                    </Text>
                    <Text style={[styles.failedAnswer, { color: COLORS.error }]}>
                      ❌ {question.userAnswer ?? 'Pas de réponse'}
                    </Text>
                    <Text style={[styles.correctAnswer, { color: COLORS.success }]}>
                      ✓ {question.correctAnswer}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Espace pour les boutons */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Boutons d'action */}
      <ButtonContainer
        backgroundColor={colors.background}
        borderColor={colors.border}
        floating={false}
      >
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton, { borderColor: colors.primary }]}
            onPress={handleGoHome}
          >
            <Ionicons name="home-outline" size={20} color={colors.primary} />
            <Text style={[styles.buttonText, { color: colors.primary }]}>Accueil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleNewSession}
          >
            <Ionicons name="reload" size={20} color="#FFF" />
            <Text style={[styles.buttonText, { color: '#FFF' }]}>Nouvelle session</Text>
          </TouchableOpacity>
        </View>
      </ButtonContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h4,
    fontWeight: '600',
  },
  scoreSection: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  scoreCircle: {
    width: 140,
    height: 140,
    marginBottom: spacing.md,
  },
  scoreGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  gradeContainer: {
    alignItems: 'center',
  },
  gradeText: {
    ...typography.h4,
    fontWeight: '600',
  },
  pointsText: {
    ...typography.body,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  statsContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.bodyBold,
    marginBottom: spacing.md,
  },
  progressWrapper: {
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h4,
    marginVertical: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
  },
  themesContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
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
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  themeName: {
    ...typography.body,
  },
  themeScore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeScoreText: {
    ...typography.bodyBold,
    marginRight: spacing.xs,
  },
  themeDetails: {
    paddingLeft: spacing.xl + spacing.lg,
    paddingVertical: spacing.xs,
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
  failedContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  failedScroll: {
    marginHorizontal: -spacing.sm,
  },
  failedCard: {
    width: SCREEN_WIDTH * 0.7,
    padding: spacing.md,
    marginHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    ...shadows.xs,
  },
  failedQuestion: {
    ...typography.small,
    marginBottom: spacing.sm,
  },
  failedInfo: {
    gap: spacing.xs,
  },
  failedTheme: {
    ...typography.caption,
  },
  failedAnswer: {
    ...typography.caption,
  },
  correctAnswer: {
    ...typography.caption,
    fontWeight: '600',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  secondaryButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  buttonText: {
    ...typography.bodyBold,
  },
});
