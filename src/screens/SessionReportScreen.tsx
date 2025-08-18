import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { spacing, typography, borderRadius, shadows } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { ButtonContainer } from '../components/ButtonContainer';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  BounceIn,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { TrainingStackScreenProps } from '../types/navigation';

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
  route 
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [stats, setStats] = useState<SessionStats | null>(route.params?.stats || null);
  const [loading, setLoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<number | null>(null);
  const isAbandoned = route.params?.isAbandoned || false;
  
  const celebrationScale = useSharedValue(1); // Initialiser à 1 pour être visible
  const starScale = useSharedValue(1); // Initialiser à 1 pour être visible
  const progressAnimation = useSharedValue(0);

  useEffect(() => {
    if (stats) {
      // Animation d'entrée depuis 0
      celebrationScale.value = 0;
      starScale.value = 0;
      
      // Puis animer vers 1 avec effet approprié
      celebrationScale.value = withDelay(
        200,
        withSpring(1, { damping: 15, stiffness: 150 })
      );
      
      starScale.value = withDelay(
        400,
        withSpring(1, { damping: 15, stiffness: 150 })
      );
      
      // Déclencher les animations spécifiques selon le score
      if (stats.successRate >= 80 && !isAbandoned) {
        // Célébration pour les bons scores
        setTimeout(() => triggerCelebration(), 600);
      } else if (stats.successRate < 50 && !isAbandoned) {
        // Animation d'encouragement pour les mauvais scores
        setTimeout(() => triggerEncouragement(), 600);
      }
      
      // Animer la progression
      progressAnimation.value = withDelay(500, withTiming(stats.successRate, { duration: 1500 }));
    }
  }, [stats]);

  // Fonction supprimée car les stats viennent maintenant des params

  const triggerCelebration = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    celebrationScale.value = withSequence(
      withSpring(1.2),
      withSpring(1)
    );
    
    starScale.value = withDelay(
      200,
      withSequence(
        withSpring(1.3),
        withSpring(1)
      )
    );
  };
  
  const triggerEncouragement = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    celebrationScale.value = withSequence(
      withTiming(0.95, { duration: 200 }),
      withSpring(1)
    );
    
    starScale.value = withDelay(
      100,
      withSequence(
        withTiming(0.8, { duration: 200 }),
        withSpring(1)
      )
    );
  };

  const getGradeEmoji = (rate: number) => {
    if (rate >= 90) return '🏆';
    if (rate >= 80) return '⭐';
    if (rate >= 70) return '👍';
    if (rate >= 60) return '💪';
    return '📚';
  };

  const getGradeColor = (rate: number) => {
    if (rate >= 90) return '#FFD700';
    if (rate >= 80) return '#10B981';
    if (rate >= 70) return '#3B82F6';
    if (rate >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const shareResults = async () => {
    if (!stats) return;
    
    try {
      const message = `🚒 Casque En Main - Résultats de session\n\n` +
        `📊 Score: ${stats.score}/${stats.totalQuestions} (${stats.successRate}%)\n` +
        `⏱️ Temps: ${formatTime(stats.totalTime || 0)}\n` +
        `🏆 Points gagnés: ${stats.pointsEarned}\n\n` +
        `Je m'entraîne pour le concours de Sapeur-Pompier avec Casque En Main !`;
      
      await Share.share({
        message,
        title: 'Mes résultats Casque En Main',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const startNewSession = (sameParams: boolean) => {
    if (sameParams) {
      navigation.replace('TrainingSession', route.params?.sessionParams || {});
    } else {
      navigation.navigate('TrainingConfig');
    }
  };

  const reviewFailedQuestions = () => {
    if (stats?.failedQuestions) {
      navigation.navigate('ReviewQuestions', { questions: stats.failedQuestions });
    }
  };

  const celebrationAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
    opacity: interpolate(
      celebrationScale.value,
      [0, 0.5, 1],
      [0, 0.8, 1]
    ),
  }));

  const starAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }],
    opacity: interpolate(
      starScale.value,
      [0, 0.5, 1],
      [0, 0.8, 1]
    ),
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

  const isGoodScore = stats.successRate >= 70;
  const gradeColor = getGradeColor(stats.successRate);
  const displayScore = Math.max(0, stats.score); // Éviter l'affichage de scores négatifs

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header avec score principal */}
        <Animated.View 
          entering={FadeInDown.duration(600).delay(200)}
          style={styles.header}
        >
          <LinearGradient
            colors={isAbandoned 
              ? ['#F59E0B', '#F59E0BCC'] 
              : [gradeColor, `${gradeColor}CC`]} // Toujours utiliser la couleur appropriée au score
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
              <Text style={styles.scoreNote}>
                Note: {(stats.successRate * 20 / 100).toFixed(1)}/20
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
            <Ionicons name="information-circle" size={24} color="#F59E0B" />
            <Text style={[styles.abandonedText, { color: colors.text }]}>
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
                style={[
                  styles.progressFill,
                  { backgroundColor: gradeColor },
                  progressBarStyle
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.text }]}>
              {stats.successRate.toFixed(0)}% de réussite
            </Text>
          </View>

          {/* Stats en grille */}
          <View style={styles.statsGrid}>
            <Animated.View 
              entering={SlideInRight.duration(500).delay(600)}
              style={styles.statItem}
            >
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.correctAnswers}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Bonnes réponses
              </Text>
            </Animated.View>

            <Animated.View 
              entering={SlideInRight.duration(500).delay(700)}
              style={styles.statItem}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.totalQuestions - stats.correctAnswers}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Erreurs
              </Text>
            </Animated.View>

            {stats.totalTime && (
              <Animated.View 
                entering={SlideInRight.duration(500).delay(800)}
                style={styles.statItem}
              >
                <Ionicons name="time" size={24} color="#3B82F6" />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {formatTime(stats.totalTime)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Temps total
                </Text>
              </Animated.View>
            )}

            {stats.averageTime && (
              <Animated.View 
                entering={SlideInRight.duration(500).delay(900)}
                style={styles.statItem}
              >
                <Ionicons name="speedometer" size={24} color="#F59E0B" />
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
          <Text style={[styles.themeTitle, { color: colors.text }]}>
            Répartition par thème
          </Text>

          {stats.themeStats.map((theme, index) => (
            <TouchableOpacity
              key={theme.themeId}
              onPress={() => setSelectedTheme(
                selectedTheme === theme.themeId ? null : theme.themeId
              )}
              activeOpacity={0.7}
            >
              <Animated.View 
                entering={SlideInRight.duration(500).delay(1300 + index * 100)}
                style={[
                  styles.themeItem,
                  { backgroundColor: `${theme.themeColor}10` }
                ]}
              >
                <View style={styles.themeHeader}>
                  <View style={styles.themeInfo}>
                    <View 
                      style={[
                        styles.themeColorDot, 
                        { backgroundColor: theme.themeColor }
                      ]} 
                    />
                    <Text style={[styles.themeName, { color: colors.text }]}>
                      {theme.themeName}
                    </Text>
                  </View>
                  <View style={styles.themeStats}>
                    <Text style={[styles.themeScore, { color: colors.text }]}>
                      {theme.correctAnswers}/{theme.totalQuestions}
                    </Text>
                    <Text style={[styles.themeRate, { color: theme.themeColor }]}>
                      {theme.successRate.toFixed(0)}%
                    </Text>
                    <Ionicons 
                      name={selectedTheme === theme.themeId ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                  </View>
                </View>

                {/* Sous-thèmes détaillés */}
                {selectedTheme === theme.themeId && (
                  <Animated.View 
                    entering={FadeInDown.duration(300)}
                    style={styles.sousThemeContainer}
                  >
                    {theme.sousThemes.map((sousTheme) => (
                      <View key={sousTheme.sousThemeId} style={styles.sousThemeItem}>
                        <Text style={[styles.sousThemeName, { color: colors.textSecondary }]}>
                          {sousTheme.sousThemeName}
                        </Text>
                        <View style={styles.sousThemeStats}>
                          <Text style={[styles.sousThemeScore, { color: colors.text }]}>
                            {sousTheme.correctAnswers}/{sousTheme.totalQuestions}
                          </Text>
                          <Text style={[
                            styles.sousThemeRate, 
                            { color: sousTheme.successRate >= 70 ? '#10B981' : '#F59E0B' }
                          ]}>
                            {sousTheme.successRate.toFixed(0)}%
                          </Text>
                        </View>
                      </View>
                    ))}
                  </Animated.View>
                )}
              </Animated.View>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Questions échouées */}
        {stats.failedQuestions.length > 0 && (
          <Animated.View 
            entering={FadeInUp.duration(600).delay(1600)}
            style={[styles.failedCard, { backgroundColor: colors.surface }, shadows.sm]}
          >
            <View style={styles.failedHeader}>
              <Text style={[styles.failedTitle, { color: colors.text }]}>
                Questions à réviser
              </Text>
              <TouchableOpacity
                onPress={reviewFailedQuestions}
                style={[styles.reviewButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.reviewButtonText}>Réviser</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.failedCount, { color: colors.textSecondary }]}>
              {stats.failedQuestions.length} question{stats.failedQuestions.length > 1 ? 's' : ''} à revoir
            </Text>
          </Animated.View>
        )}

        {/* Actions */}
        <ButtonContainer 
          backgroundColor={colors.background} 
          borderColor="transparent"
          hasBorder={false}
          style={{ backgroundColor: 'transparent' }}
        >
          <Animated.View 
            entering={FadeInUp.duration(600).delay(1800)}
          >
            <TouchableOpacity
              onPress={() => startNewSession(true)}
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
            <Ionicons name="refresh" size={2} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Nouvelle session</Text>
            <Text style={styles.primaryButtonSubtext}>Mêmes paramètres</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              onPress={() => startNewSession(false)}
              style={[styles.secondaryButton, { backgroundColor: colors.surface}, shadows.sm]}
              activeOpacity={0.7}
            >
              <Ionicons name="settings" size={32} color={colors.primary} />
              <Text style={[styles.secondaryButtonText, { color: colors.text}]}>
              Nouveaux paramètres
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={shareResults}
              style={[styles.secondaryButton, { backgroundColor: colors.surface }, shadows.sm]}
              activeOpacity={0.7}
            >
              <Ionicons name="share-social" size={32} color={colors.primary} />
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                Partager
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('HomeScreen')}
            style={styles.homeButton}
            activeOpacity={0.7}
          >
            <Text style={[styles.homeButtonText, { color: colors.textSecondary }]}>
              Retour à l'accueil
            </Text>
          </TouchableOpacity>
          </Animated.View>
        </ButtonContainer>
      </ScrollView>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  scoreCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  scoreTitle: {
    ...typography.h4,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  gradeEmoji: {
    fontSize: 36,
    marginLeft: spacing.md,
  },
  scoreNote: {
    ...typography.h3,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
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
    ...typography.small,
  },
  themeCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  themeTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  themeItem: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  themeName: {
    ...typography.bodyBold,
  },
  themeStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeScore: {
    ...typography.body,
    marginRight: spacing.sm,
  },
  themeRate: {
    ...typography.bodyBold,
    marginRight: spacing.sm,
  },
  sousThemeContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  sousThemeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingLeft: spacing.lg,
  },
  sousThemeName: {
    ...typography.caption,
    flex: 1,
  },
  sousThemeStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sousThemeScore: {
    ...typography.small,
    marginRight: spacing.sm,
  },
  sousThemeRate: {
    ...typography.small,
    fontWeight: '600',
  },
  failedCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  failedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  failedTitle: {
    ...typography.h4,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  reviewButtonText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  failedCount: {
    ...typography.caption,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    ...typography.bodyBold,
    color: '#FFFFFF',
    marginLeft: spacing.sm,
  },
  primaryButtonSubtext: {
    ...typography.small,
    color: '#FFFFFF',
    opacity: 0.8,
    marginLeft: spacing.xs,
  },
  secondaryActions: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
  },
  secondaryButtonText: {
    ...typography.caption,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  homeButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  homeButtonText: {
    ...typography.body,
  },
  abandonedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  abandonedText: {
    ...typography.caption,
    flex: 1,
    marginLeft: spacing.sm,
  },
});