import React, { memo } from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
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

interface ChartDataItem {
  label: string;
  value: number;
  color: string;
  fullLabel?: string;
}

interface OverviewTabProps {
  stats: SessionStats;
  achievements: Achievement[];
  barChartData: ChartDataItem[];
  gradeColor: string;
  gradeEmoji: string;
  scoreMessage: string;
  formatTime: (seconds: number) => string;
  isAbandoned: boolean;
  colors: ThemeColors;
  celebrationAnimatedStyle: ViewStyle;
  starAnimatedStyle: ViewStyle;
}

export const OverviewTab = memo<OverviewTabProps>(
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
  }) => {
    const displayScore = Math.max(0, stats.score);

    return (
      <>
        {/* Score principal avec graphique circulaire */}
        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.scoreSection}>
          <LinearGradient
            colors={isAbandoned ? ['#F59E0B', '#F59E0BCC'] : [gradeColor, `${gradeColor}CC`]}
            style={styles.scoreCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Animated.View style={celebrationAnimatedStyle}>
              <Text
                style={styles.scoreTitle}
                accessibilityRole="header"
                accessibilityLabel={isAbandoned ? 'Session Interrompue' : 'Score Final'}
              >
                {isAbandoned ? 'Session Interrompue' : 'Score Final'}
              </Text>

              <View
                style={styles.scoreContent}
                accessibilityLabel={`Score: ${stats.correctAnswers} sur ${stats.totalQuestions}, soit ${stats.successRate.toFixed(0)}%`}
              >
                <CircularProgress
                  percentage={stats.successRate}
                  size={120}
                  strokeWidth={10}
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
                  <Animated.Text
                    style={[styles.gradeEmoji, starAnimatedStyle]}
                    accessibilityLabel={`Évaluation: ${gradeEmoji}`}
                  >
                    {gradeEmoji}
                  </Animated.Text>
                </View>
              </View>

              <Text
                style={styles.scoreNote}
                accessibilityLabel={`Note: ${((stats.successRate * 20) / 100).toFixed(1)} sur 20`}
              >
                Note: {((stats.successRate * 20) / 100).toFixed(1)}/20
              </Text>

              <Text style={styles.scoreMessage}>{scoreMessage}</Text>
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* Achievements */}
        {achievements.length > 0 && (
          <Animated.View
            entering={FadeInUp.duration(600).delay(400)}
            style={[styles.achievementsCard, { backgroundColor: colors.surface }]}
            accessibilityLabel={`${achievements.length} badges débloqués`}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]} accessibilityRole="header">
              🏅 Badges débloqués
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="list">
              {achievements.map((achievement, index) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  index={index}
                  showAnimation={true}
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Graphique des performances par thème */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(600)}
          style={[styles.chartCard, { backgroundColor: colors.surface }]}
          accessibilityLabel="Graphique des performances par thème"
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]} accessibilityRole="header">
            Performance par thème
          </Text>
          <BarChart
            data={barChartData}
            height={120}
            maxValue={100}
            showValues={true}
            animated={true}
          />
        </Animated.View>

        {/* Stats rapides */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(800)}
          style={styles.quickStatsContainer}
          accessibilityLabel="Statistiques rapides"
        >
          <View
            style={[styles.quickStatCard, { backgroundColor: colors.surface }]}
            accessibilityLabel={`${stats.correctAnswers} réponses correctes`}
          >
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <AnimatedCounter
              value={stats.correctAnswers}
              duration={1000}
              delay={900}
              style={StyleSheet.flatten([styles.quickStatValue, { color: colors.text }])}
            />
            <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>Correct</Text>
          </View>

          <View
            style={[styles.quickStatCard, { backgroundColor: colors.surface }]}
            accessibilityLabel={`Temps total: ${stats.totalTime ? formatTime(stats.totalTime) : 'non disponible'}`}
          >
            <Ionicons name="time" size={24} color={COLORS.info} />
            <Text style={[styles.quickStatValue, { color: colors.text }]}>
              {stats.totalTime ? formatTime(stats.totalTime) : '--:--'}
            </Text>
            <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>Temps</Text>
          </View>

          <View
            style={[styles.quickStatCard, { backgroundColor: colors.surface }]}
            accessibilityLabel={`${displayScore} points gagnés`}
          >
            <Ionicons name="trophy" size={24} color={COLORS.warning} />
            <AnimatedCounter
              value={displayScore}
              duration={1000}
              delay={1100}
              style={StyleSheet.flatten([styles.quickStatValue, { color: colors.text }])}
              prefix="+"
            />
            <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>Points</Text>
          </View>
        </Animated.View>
      </>
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
  },
  scoreText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  gradeEmoji: {
    fontSize: 24,
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
  achievementsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  chartCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  quickStatCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  quickStatValue: {
    ...typography.h4,
    marginVertical: spacing.xs,
  },
  quickStatLabel: {
    ...typography.caption,
  },
});

OverviewTab.displayName = 'OverviewTab';
