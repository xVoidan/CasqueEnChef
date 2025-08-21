import React, { memo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ViewStyle,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, AnimatedStyleProp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CircularProgress } from '../CircularProgress';
import { BarChart } from '../BarChart';
import { AnimatedCounter } from '../AnimatedCounter';
import { AchievementBadge, Achievement } from '../AchievementBadge';
import { COLORS } from '../../constants/styleConstants';
import { shadows, typography, spacing, borderRadius } from '../../styles/theme';
import { SessionStats } from '../../hooks/useSessionAnalytics';
import { ThemeColors } from '../../types/theme.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Couleurs pour le barème
const BAREME_COLORS = {
  correct: '#10B981',
  incorrect: '#EF4444',
  noAnswer: '#F59E0B',
  partial: '#3B82F6',
};

// Nouvelles interfaces pour les fonctionnalités avancées
interface ComparisonMetrics {
  userAverage: number;
  globalAverage: number;
  personalBest: number;
  targetScore: number;
  percentile: number;
  trend: number;
  streak: number;
}

interface InsightData {
  type: 'strength' | 'weakness' | 'tip' | 'prediction';
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface EnhancedOverviewTabProps {
  stats: SessionStats;
  achievements: Achievement[];
  barChartData: Array<{ value: number; label: string; color: string; fullLabel?: string }>;
  gradeColor: string;
  gradeEmoji: string;
  scoreMessage: string;
  formatTime: (seconds: number) => string;
  isAbandoned: boolean;
  colors: ThemeColors;
  celebrationAnimatedStyle: AnimatedStyleProp<ViewStyle>;
  starAnimatedStyle: AnimatedStyleProp<ViewStyle>;
  // Nouvelles props
  comparisonMetrics?: ComparisonMetrics;
  insights?: InsightData[];
  onActionPress?: (action: string) => void;
  scoring?: {
    correct: number;
    incorrect: number;
    noAnswer: number;
    partial: number;
  };
}

export const EnhancedOverviewTab = memo<EnhancedOverviewTabProps>(
  ({
    stats,
    achievements,
    barChartData,
    gradeColor,
    gradeEmoji,
    scoreMessage,
    formatTime,
    isAbandoned,
    colors,
    celebrationAnimatedStyle,
    starAnimatedStyle,
    comparisonMetrics,
    insights = [],
    onActionPress,
    scoring,
  }) => {
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    // Afficher le score réel, même s'il est négatif
    const displayScore = stats.score;

    // Calculer les métriques de progression
    const progressToNextRank = 75; // Exemple: 75% vers le prochain rang
    const currentRank = 'Sergent';
    const nextRank = 'Sergent-Chef';
    const xpGained = 250;
    const totalXpNeeded = 2000;
    const currentXp = 1750;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Score principal amélioré avec comparaison */}
        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.scoreSection}>
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

              <View style={styles.scoreContent}>
                <CircularProgress
                  percentage={stats.successRate}
                  size={140}
                  strokeWidth={12}
                  color="#FFF"
                  backgroundColor="rgba(255,255,255,0.3)"
                  delay={500}
                  showPercentage={false}
                />
                <View style={styles.scoreOverlay}>
                  <AnimatedCounter
                    value={stats.correctAnswers}
                    duration={1500}
                    delay={300}
                    style={styles.scoreText}
                    suffix={`/${stats.totalQuestions}`}
                    bounce={true}
                  />
                  <Animated.Text style={[styles.gradeEmoji, starAnimatedStyle]}>
                    {gradeEmoji}
                  </Animated.Text>
                </View>
              </View>

              {/* Nouvelle section: Comparaison */}
              {comparisonMetrics && (
                <View style={styles.comparisonContainer}>
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonLabel}>Votre moyenne</Text>
                    <Text style={styles.comparisonValue}>{comparisonMetrics.userAverage}%</Text>
                  </View>
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonLabel}>Moyenne globale</Text>
                    <Text style={styles.comparisonValue}>{comparisonMetrics.globalAverage}%</Text>
                  </View>
                  <View style={styles.comparisonHighlight}>
                    <Ionicons name="trophy" size={16} color="#FFD700" />
                    <Text style={styles.comparisonHighlightText}>
                      Top {comparisonMetrics.percentile}% des utilisateurs
                    </Text>
                  </View>
                </View>
              )}

              <Text style={styles.scoreNote}>
                Note: {((stats.successRate * stats.totalQuestions) / 100).toFixed(1)}/
                {stats.totalQuestions}
              </Text>
              <Text style={styles.scoreMessage}>{scoreMessage}</Text>
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* Section Barème */}
        {scoring && (
          <Animated.View
            entering={FadeInUp.duration(600).delay(250)}
            style={[styles.baremeCard, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📝 Barème utilisé</Text>
            <View style={styles.baremeGrid}>
              <View style={styles.baremeItem}>
                <View
                  style={[styles.baremeIndicator, { backgroundColor: BAREME_COLORS.correct }]}
                />
                <Text style={[styles.baremeLabel, { color: colors.textSecondary }]}>
                  Bonne réponse
                </Text>
                <Text style={[styles.baremeValue, { color: colors.text }]}>
                  {scoring.correct > 0 ? '+' : ''}
                  {scoring.correct} point{Math.abs(scoring.correct) !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.baremeItem}>
                <View
                  style={[styles.baremeIndicator, { backgroundColor: BAREME_COLORS.incorrect }]}
                />
                <Text style={[styles.baremeLabel, { color: colors.textSecondary }]}>
                  Mauvaise réponse
                </Text>
                <Text style={[styles.baremeValue, { color: colors.text }]}>
                  {scoring.incorrect} point{Math.abs(scoring.incorrect) !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.baremeItem}>
                <View
                  style={[styles.baremeIndicator, { backgroundColor: BAREME_COLORS.noAnswer }]}
                />
                <Text style={[styles.baremeLabel, { color: colors.textSecondary }]}>
                  Sans réponse
                </Text>
                <Text style={[styles.baremeValue, { color: colors.text }]}>
                  {scoring.noAnswer} point{Math.abs(scoring.noAnswer) !== 1 ? 's' : ''}
                </Text>
              </View>
              {scoring.partial !== 0 && (
                <View style={styles.baremeItem}>
                  <View
                    style={[styles.baremeIndicator, { backgroundColor: BAREME_COLORS.partial }]}
                  />
                  <Text style={[styles.baremeLabel, { color: colors.textSecondary }]}>
                    Réponse partielle
                  </Text>
                  <Text style={[styles.baremeValue, { color: colors.text }]}>
                    {scoring.partial > 0 ? '+' : ''}
                    {scoring.partial} point{Math.abs(scoring.partial) !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Nouvelle section: Progression & Rang */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(300)}
          style={[styles.progressionCard, { backgroundColor: colors.surface }]}
        >
          <View style={styles.progressionHeader}>
            <View style={styles.rankInfo}>
              <Text style={[styles.currentRank, { color: colors.text }]}>{currentRank}</Text>
              <Text style={[styles.rankLevel, { color: colors.textSecondary }]}>Niveau 5</Text>
            </View>
            <View style={styles.xpInfo}>
              <Text style={[styles.xpGained, { color: colors.primary }]}>+{xpGained} XP</Text>
              <Text style={[styles.xpTotal, { color: colors.textSecondary }]}>
                {currentXp}/{totalXpNeeded}
              </Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <LinearGradient
                colors={[colors.primary, `${colors.primary}CC`]}
                style={[styles.progressBarFill, { width: `${progressToNextRank}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {progressToNextRank}% vers {nextRank}
            </Text>
          </View>

          {comparisonMetrics && comparisonMetrics.streak > 0 && (
            <View style={styles.streakContainer}>
              <Ionicons name="flame" size={20} color="#FF6B6B" />
              <Text style={[styles.streakText, { color: colors.text }]}>
                {comparisonMetrics.streak} jours consécutifs!
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Smart Insights */}
        {insights.length > 0 && (
          <Animated.View
            entering={FadeInUp.duration(600).delay(400)}
            style={[styles.insightsCard, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              💡 Analyse Intelligente
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {insights.map((insight, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.insightItem,
                    {
                      backgroundColor: `${colors.primary}10`,
                      borderLeftColor: colors.primary,
                    },
                  ]}
                  onPress={() => insight.action?.onPress()}
                  activeOpacity={0.7}
                >
                  <View style={styles.insightHeader}>
                    <Ionicons name={insight.icon} size={20} color={colors.primary} />
                    <Text style={[styles.insightTitle, { color: colors.text }]}>
                      {insight.title}
                    </Text>
                  </View>
                  <Text style={[styles.insightMessage, { color: colors.textSecondary }]}>
                    {insight.message}
                  </Text>
                  {insight.action && (
                    <Text style={[styles.insightAction, { color: colors.primary }]}>
                      {insight.action.label} →
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Achievements améliorés */}
        {achievements.length > 0 && (
          <Animated.View
            entering={FadeInUp.duration(600).delay(500)}
            style={[styles.achievementsCard, { backgroundColor: colors.surface }]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🏅 Badges débloqués</Text>
              <TouchableOpacity onPress={() => onActionPress?.('viewAllBadges')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>Voir tous</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {achievements.map((achievement, index) => (
                <TouchableOpacity
                  key={achievement.id}
                  onPress={() => onActionPress?.(`badge:${achievement.id}`)}
                  activeOpacity={0.8}
                >
                  <AchievementBadge achievement={achievement} index={index} showAnimation={true} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Graphique amélioré avec légende interactive */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(600)}
          style={[styles.chartCard, { backgroundColor: colors.surface }]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Performance par thème</Text>
            <TouchableOpacity
              style={styles.chartToggle}
              onPress={() => setExpandedSection(expandedSection === 'chart' ? null : 'chart')}
            >
              <Ionicons
                name={expandedSection === 'chart' ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <BarChart
            data={barChartData}
            height={expandedSection === 'chart' ? 180 : 120}
            maxValue={100}
            showValues={true}
            animated={true}
          />

          {expandedSection === 'chart' && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.chartDetails}>
              {barChartData.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.chartLegendItem}
                  onPress={() => onActionPress?.(`theme:${item.label}`)}
                >
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendLabel, { color: colors.text }]}>
                    {item.fullLabel ?? item.label}
                  </Text>
                  <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
                    {item.value}%
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}
        </Animated.View>

        {/* Actions rapides */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(700)}
          style={styles.quickActionsContainer}
        >
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: colors.surface }]}
            onPress={() => onActionPress?.('reviewMistakes')}
          >
            <View style={[styles.quickActionIcon, styles.quickActionIconRed]}>
              <Ionicons name="refresh-circle" size={24} color="#FF6B6B" />
            </View>
            <Text style={[styles.quickActionLabel, { color: colors.text }]}>Revoir erreurs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: colors.surface }]}
            onPress={() => onActionPress?.('dailyChallenge')}
          >
            <View style={[styles.quickActionIcon, styles.quickActionIconTeal]}>
              <Ionicons name="rocket" size={24} color="#4ECDC4" />
            </View>
            <Text style={[styles.quickActionLabel, { color: colors.text }]}>Défi du jour</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: colors.surface }]}
            onPress={() => onActionPress?.('practiceWeak')}
          >
            <View style={[styles.quickActionIcon, styles.quickActionIconYellow]}>
              <Ionicons name="book" size={24} color="#FFD93D" />
            </View>
            <Text style={[styles.quickActionLabel, { color: colors.text }]}>Réviser faible</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats détaillées améliorées */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, marginHorizontal: spacing.lg, marginBottom: spacing.md },
          ]}
        >
          Performance détaillée
        </Text>
        <Animated.View
          entering={FadeInUp.duration(600).delay(800)}
          style={styles.detailedStatsGrid}
        >
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="speedometer" size={24} color={COLORS.info} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.averageTime ? `${stats.averageTime.toFixed(1)}s` : '--'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Moy/Question</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="analytics" size={24} color={COLORS.success} />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.correctAnswers}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Correctes</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="time" size={24} color={COLORS.warning} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.totalTime ? formatTime(stats.totalTime) : '--:--'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Durée totale</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="trending-up" size={24} color={COLORS.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {displayScore >= 0 ? `+${displayScore}` : `${displayScore}`}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Points XP</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="fitness" size={24} color="#9333EA" />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {Math.round((stats.correctAnswers / stats.totalQuestions) * 100)}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Efficacité</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="pulse" size={24} color="#EC4899" />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.streakCount}/{stats.totalQuestions}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Série</Text>
          </View>
        </Animated.View>
      </ScrollView>
    );
  }
);

const styles = StyleSheet.create({
  scoreSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  scoreCard: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.md,
  },
  scoreTitle: {
    ...typography.h4,
    color: '#FFFFFF',
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  scoreContent: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  gradeEmoji: {
    fontSize: 28,
    marginTop: spacing.xs,
  },
  scoreNote: {
    ...typography.body,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: spacing.md,
    fontWeight: '500',
  },
  scoreMessage: {
    ...typography.small,
    color: '#FFFFFF',
    opacity: 0.95,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  comparisonContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    width: '100%',
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  comparisonLabel: {
    ...typography.small,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  comparisonValue: {
    ...typography.small,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  comparisonHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderRadius: borderRadius.md,
  },
  comparisonHighlightText: {
    ...typography.caption,
    color: '#FFD700',
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  progressionCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  progressionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  rankInfo: {
    flex: 1,
  },
  currentRank: {
    ...typography.h4,
    fontWeight: 'bold',
  },
  rankLevel: {
    ...typography.caption,
  },
  xpInfo: {
    alignItems: 'flex-end',
  },
  xpGained: {
    ...typography.bodyBold,
  },
  xpTotal: {
    ...typography.caption,
  },
  progressBarContainer: {
    marginBottom: spacing.sm,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(255,107,107,0.1)',
    borderRadius: borderRadius.md,
  },
  streakText: {
    ...typography.small,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  insightsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  insightItem: {
    width: SCREEN_WIDTH * 0.7,
    marginRight: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  insightTitle: {
    ...typography.bodyBold,
    marginLeft: spacing.sm,
  },
  insightMessage: {
    ...typography.small,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  insightAction: {
    ...typography.small,
    fontWeight: '600',
  },
  achievementsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
  },
  seeAllText: {
    ...typography.small,
    fontWeight: '600',
  },
  chartCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  chartToggle: {
    padding: spacing.xs,
  },
  chartDetails: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  legendLabel: {
    ...typography.small,
    flex: 1,
  },
  legendValue: {
    ...typography.small,
    fontWeight: '600',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  quickActionLabel: {
    ...typography.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
  detailedStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    justifyContent: 'space-between',
  },
  statCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 2) / 3,
    minWidth: 95,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  statValue: {
    ...typography.bodyBold,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    fontSize: 16,
  },
  statLabel: {
    ...typography.caption,
    textAlign: 'center',
    fontSize: 11,
  },
  quickActionIconRed: {
    backgroundColor: '#FF6B6B20',
  },
  quickActionIconTeal: {
    backgroundColor: '#4ECDC420',
  },
  quickActionIconYellow: {
    backgroundColor: '#FFD93D20',
  },
  baremeCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  baremeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  baremeItem: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 3) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  baremeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  baremeLabel: {
    ...typography.caption,
    flex: 1,
  },
  baremeValue: {
    ...typography.bodyBold,
    fontSize: 14,
  },
});

EnhancedOverviewTab.displayName = 'EnhancedOverviewTab';
