import React from /* eslint-disable @typescript-eslint/no-explicit-any */ 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { shadows, borderRadius } from '../../styles/theme';

const { width } = Dimensions.get('window');

interface OverviewTabProps {
  weeklyData: { name: string; value: number; color: string; percentage: number };
  totalStats: {
    totalSessions: number;
    totalQuestions: number;
    averageScore: number;
    totalTime: number;
    streak: number;
    bestScore: number;
  };
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ weeklyData, totalStats }) => {
  const { colors } = useTheme();

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins} min`;
  };

  const quickStats = [
    {
      icon: 'trophy',
      value: `${totalStats.bestScore}%`,
      label: 'Meilleur score',
      color: '#FFD700',
    },
    {
      icon: 'flame',
      value: `${totalStats.streak}`,
      label: 'Jours consécutifs',
      color: '#FF6B6B',
    },
    {
      icon: 'trending-up',
      value: `${totalStats.averageScore}%`,
      label: 'Moyenne',
      color: '#4ECDC4',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Quick Stats Row */}
      <View style={styles.quickStatsRow}>
        {quickStats.map((stat, index) => (
          <Animated.View
            key={stat.label}
            entering={FadeInDown.delay(index * 100)}
            style={[styles.quickStatCard, { backgroundColor: colors.surface }, shadows.sm]}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${stat.color}15` }]}>
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
            </View>
            <Text style={[styles.quickStatValue, { color: colors.text }]}>{stat.value}</Text>
            <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
              {stat.label}
            </Text>
          </Animated.View>
        ))}
      </View>

      {/* Performance Chart */}
      <Animated.View
        entering={FadeInDown.delay(300)}
        style={[styles.chartCard, { backgroundColor: colors.surface }, shadows.sm]}
      >
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Performance hebdomadaire</Text>
          <View style={[styles.badge, { backgroundColor: `${colors.primary}15` }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>7 derniers jours</Text>
          </View>
        </View>

        {weeklyData.datasets[0].data.some((val: number) => val > 0) ? (
          <LineChart
            data={weeklyData}
            width={width - 60}
            height={200}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 0,
              color: (_opacity = 1) => colors.primary,
              labelColor: (_opacity = 1) => colors.textSecondary,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: colors.primary,
              },
              propsForBackgroundLines: {
                strokeDasharray: '5, 5',
                stroke: colors.border,
                strokeOpacity: 0.3,
              },
            }}
            bezier
            style={styles.chart}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            withInnerLines={true}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={true}
          />
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
              Pas encore de données cette semaine
            </Text>
            <Text style={[styles.noDataSubtext, { color: colors.textSecondary }]}>
              Commencez un entraînement pour voir vos progrès
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        <Animated.View
          entering={FadeInDown.delay(400)}
          style={[styles.statCard, { backgroundColor: colors.surface }, shadows.sm]}
        >
          <Ionicons name="school-outline" size={32} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{totalStats.totalSessions}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sessions totales</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(500)}
          style={[styles.statCard, { backgroundColor: colors.surface }, shadows.sm]}
        >
          <Ionicons name="help-circle-outline" size={32} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {totalStats.totalQuestions}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Questions répondues
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(600)}
          style={[styles.statCard, { backgroundColor: colors.surface }, shadows.sm]}
        >
          <Ionicons name="checkmark-circle-outline" size={32} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{totalStats.averageScore}%</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Taux de réussite</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(700)}
          style={[styles.statCard, { backgroundColor: colors.surface }, shadows.sm]}
        >
          <Ionicons name="time-outline" size={32} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {formatTime(totalStats.totalTime)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Temps total</Text>
        </Animated.View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  quickStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    padding: 12,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  chartCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: borderRadius.xl,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  noDataSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    gap: 10,
  },
  statCard: {
    width: '47%',
    padding: 20,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});
