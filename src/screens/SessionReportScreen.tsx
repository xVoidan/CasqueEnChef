import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Contexts et Hooks
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSessionAnalytics, SessionStats, FailedQuestion } from '../hooks/useSessionAnalytics';

// Composants
import { EnhancedOverviewTab } from '../components/tabs/EnhancedOverviewTab';
import { DetailsTab } from '../components/tabs/DetailsTab';
import { AdviceTab } from '../components/tabs/AdviceTab';
import { ReviewQuestionsModal } from '../components/ReviewQuestionsModal';
import { ActionButtons } from '../components/ActionButtons';

// Services
import { ExportService } from '../services/exportService';

// Styles et Types
import { typography, spacing, borderRadius } from '../styles/theme';
import { TrainingStackScreenProps } from '../types/navigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACTIVE_TAB_KEY = '@SessionReport:activeTab';

type TabType = 'overview' | 'details' | 'advice';

export const SessionReportScreen: React.FC<TrainingStackScreenProps<'SessionReport'>> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [stats] = useState<SessionStats | null>(
    (route.params?.stats as SessionStats | null) ?? null
  );
  const [loading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [questionsToReview, setQuestionsToReview] = useState<FailedQuestion[]>([]);
  const [exportLoading, setExportLoading] = useState(false);

  const isAbandoned = route.params?.isAbandoned ?? false;
  const confettiRef = useRef<ConfettiCannon>(null);

  // Animations
  const celebrationScale = useSharedValue(1);
  const starScale = useSharedValue(1);
  const progressAnimation = useSharedValue(0);

  // Hook pour l'analyse de session avec mémoisation
  const {
    achievements,
    advices,
    getGradeEmoji,
    getGradeColor,
    formatTime,
    getScoreMessage,
    barChartData,
  } = useSessionAnalytics(stats, isAbandoned, screen => {
    navigation.navigate(screen as never);
  });

  // Mémorisation des calculs coûteux
  const gradeColor = useMemo(
    () => (stats ? getGradeColor(stats.successRate) : '#666'),
    [stats, getGradeColor]
  );

  const gradeEmoji = useMemo(
    () => (stats ? getGradeEmoji(stats.successRate) : '📚'),
    [stats, getGradeEmoji]
  );

  const scoreMessage = useMemo(
    () => (stats ? getScoreMessage(stats.successRate, isAbandoned) : ''),
    [stats, getScoreMessage, isAbandoned]
  );

  // Charger la préférence de tab sauvegardée
  useEffect(() => {
    const loadTabPreference = async () => {
      try {
        const savedTab = await AsyncStorage.getItem(ACTIVE_TAB_KEY);
        if (savedTab && ['overview', 'details', 'advice'].includes(savedTab)) {
          setActiveTab(savedTab as TabType);
        }
      } catch {
        console.error('Erreur lors du chargement de la préférence de tab');
      }
    };

    void loadTabPreference();
  }, []);

  // Sauvegarder la préférence de tab
  const handleTabChange = useCallback(async (tab: TabType) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);

    try {
      await AsyncStorage.setItem(ACTIVE_TAB_KEY, tab);
    } catch {
      console.error('Erreur lors de la sauvegarde de la préférence de tab');
    }
  }, []);

  // Animations de célébration
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

  // Effets d'entrée avec animations optimisées
  useEffect(() => {
    if (stats) {
      // Animation d'entrée
      celebrationScale.value = 0;
      starScale.value = 0;

      celebrationScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 150 }));
      starScale.value = withDelay(400, withSpring(1, { damping: 15, stiffness: 150 }));

      // Déclencher les animations selon le score
      if (stats.successRate >= 90 && !isAbandoned) {
        setTimeout(() => {
          confettiRef.current?.start();
          triggerCelebration();
        }, 800);
      } else if (stats.successRate >= 80 && !isAbandoned) {
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

  // Partage des résultats avec achievements
  const shareResults = useCallback(async () => {
    if (!stats) {
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const achievementText =
        achievements.length > 0
          ? `\n🏅 ${achievements.length} badge${achievements.length > 1 ? 's' : ''} débloqué${achievements.length > 1 ? 's' : ''} !`
          : '';

      const message =
        `🎯 Résultats CasqueEnMain !\n\n` +
        `📊 Score: ${stats.correctAnswers}/${stats.totalQuestions}\n` +
        `✨ Réussite: ${stats.successRate.toFixed(0)}%\n` +
        `🏆 Points: ${stats.pointsEarned}${achievementText}\n\n` +
        `#CasqueEnMain #Formation #Sécurité`;

      await Share.share({ message });
    } catch {
      console.error('Erreur partage');
    }
  }, [stats, achievements]);

  // Export PDF avec gestion d'erreur
  const exportPDF = useCallback(async () => {
    if (!stats) {
      return;
    }

    setExportLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await ExportService.exportSessionPDF(stats, user?.email);
    } catch {
      Alert.alert('Erreur', "Impossible d'exporter le rapport. Veuillez réessayer.", [
        { text: 'OK' },
      ]);
    } finally {
      setExportLoading(false);
    }
  }, [stats, user]);

  // Générer les données de comparaison
  const comparisonMetrics = useMemo(() => {
    if (!stats) {
      return null;
    }
    return {
      userAverage: 75, // À calculer depuis l'historique
      globalAverage: 68,
      personalBest: 92,
      targetScore: 80,
      percentile: 15,
      trend: 12,
      streak: 7,
    };
  }, [stats]);

  // Générer les insights
  const insights = useMemo(() => {
    if (!stats) {
      return [];
    }
    const results = [];

    // Identifier les forces
    const strongThemes = stats.themeStats.filter(t => t.successRate >= 80);
    if (strongThemes.length > 0) {
      results.push({
        type: 'strength' as const,
        icon: 'trophy',
        title: 'Point fort',
        message: `Excellent en ${strongThemes[0].themeName} (+15% vs moyenne)`,
      });
    }

    // Identifier les faiblesses
    const weakThemes = stats.themeStats.filter(t => t.successRate < 60);
    if (weakThemes.length > 0) {
      results.push({
        type: 'tip' as const,
        icon: 'bulb',
        title: 'Conseil',
        message: `Révisez ${weakThemes[0].themeName} pour progresser`,
        action: {
          label: 'Commencer',
          onPress: () => navigation.navigate('TrainingConfig'),
        },
      });
    }

    return results;
  }, [stats, navigation]);

  // Gestion des actions du nouveau composant
  const handleActionPress = useCallback(
    (action: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (action === 'reviewMistakes' && stats?.failedQuestions.length) {
        handleReviewQuestions(stats.failedQuestions);
      } else if (action === 'dailyChallenge') {
        navigation.navigate('TrainingConfig');
      } else if (action === 'practiceWeak' && stats) {
        const weakestTheme = stats.themeStats.reduce((min, curr) =>
          curr.successRate < min.successRate ? curr : min
        );
        navigation.navigate('TrainingConfig', {
          preselectedTheme: weakestTheme.themeId,
        } as never);
      } else if (action === 'viewAllBadges') {
        navigation.navigate('BadgesScreen' as never);
      } else if (action.startsWith('badge:')) {
        // Afficher les détails du badge
        Alert.alert('Badge', 'Détails du badge (à implémenter)');
      } else if (action.startsWith('theme:')) {
        // Afficher les détails du thème
        Alert.alert('Thème', 'Détails du thème (à implémenter)');
      }
    },
    [stats, navigation, handleReviewQuestions]
  );

  // Gestion de la révision des questions
  const handleReviewQuestions = useCallback((questions: FailedQuestion[]) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuestionsToReview(questions);
    setReviewModalVisible(true);
  }, []);

  // Navigation optimisée
  const startNewSession = useCallback(
    (sameParams: boolean) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (sameParams && route.params?.sessionParams) {
        navigation.replace('TrainingSession', route.params.sessionParams);
      } else {
        navigation.navigate('TrainingConfig');
      }
    },
    [navigation, route.params]
  );

  // Styles animés
  const celebrationAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
    opacity: interpolate(celebrationScale.value, [0, 0.5, 1], [0, 0.8, 1]),
  }));

  const starAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }],
    opacity: interpolate(starScale.value, [0, 0.5, 1], [0, 0.8, 1]),
  }));

  // Écran de chargement accessible
  if (loading || !stats) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Calcul de vos résultats...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Confetti pour les excellents scores */}
      {stats.successRate >= 90 && !isAbandoned && (
        <ConfettiCannon
          ref={confettiRef}
          count={200}
          origin={{ x: SCREEN_WIDTH / 2, y: -10 }}
          fadeOut={true}
          fallSpeed={2000}
        />
      )}

      {/* Modal de révision des questions */}
      <ReviewQuestionsModal
        visible={reviewModalVisible}
        questions={questionsToReview}
        onClose={() => setReviewModalVisible(false)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* Header avec tabs accessibles */}
        <View style={styles.header}>
          <View style={styles.tabsContainer} accessibilityRole="tablist">
            {(['overview', 'details', 'advice'] as TabType[]).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  activeTab === tab && { backgroundColor: `${colors.primary}20` },
                ]}
                onPress={() => void handleTabChange(tab)}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === tab }}
                accessibilityLabel={
                  tab === 'overview' ? "Vue d'ensemble" : tab === 'details' ? 'Détails' : 'Conseils'
                }
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === tab ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {tab === 'overview'
                    ? "Vue d'ensemble"
                    : tab === 'details'
                      ? 'Détails'
                      : 'Conseils'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contenu des tabs avec composants optimisés */}
        {activeTab === 'overview' && (
          <EnhancedOverviewTab
            stats={stats}
            achievements={achievements}
            barChartData={barChartData}
            gradeColor={gradeColor}
            gradeEmoji={gradeEmoji}
            scoreMessage={scoreMessage}
            formatTime={formatTime}
            isAbandoned={isAbandoned}
            colors={colors}
            celebrationAnimatedStyle={celebrationAnimatedStyle}
            starAnimatedStyle={starAnimatedStyle}
            comparisonMetrics={comparisonMetrics}
            insights={insights}
            onActionPress={handleActionPress}
          />
        )}

        {activeTab === 'details' && (
          <DetailsTab stats={stats} colors={colors} onReviewQuestions={handleReviewQuestions} />
        )}

        {activeTab === 'advice' && <AdviceTab advices={advices} colors={colors} />}

        {/* Boutons d'action intégrés dans le contenu */}
        <ActionButtons
          onShare={() => void shareResults()}
          onExportPDF={() => void exportPDF()}
          onNewSession={() => startNewSession(false)}
          onHome={() => navigation.navigate('HomeScreen' as never)}
          exportLoading={exportLoading}
          colors={colors}
          style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}
        />
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
    marginTop: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  tabText: {
    ...typography.small,
    fontWeight: '600',
  },
});
