import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  Text as SvgText,
  G,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { typography, spacing, borderRadius } from '../styles/theme';
import { ThemeColors } from '../types/theme.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DataPoint {
  date: Date;
  score: number;
  sessionId: number;
}

interface ProgressChartProps {
  data: DataPoint[];
  height?: number;
  width?: number;
  colors: ThemeColors;
  animated?: boolean;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  data,
  height = 200,
  width = SCREEN_WIDTH - spacing.lg * 2,
  colors,
  animated = true,
}) => {
  const chartPadding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - chartPadding.left - chartPadding.right;
  const chartHeight = height - chartPadding.top - chartPadding.bottom;

  // Calcul des données du graphique
  const chartData = useMemo(() => {
    if (data.length === 0) {
      return null;
    }

    const scores = data.map(d => d.score);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const scoreRange = maxScore - minScore || 1;

    // Créer les points pour le tracé
    const points = data.map((point, index) => {
      const x = (index / (data.length - 1 || 1)) * chartWidth;
      const y = chartHeight - ((point.score - minScore) / scoreRange) * chartHeight;
      return { x, y, ...point };
    });

    // Créer le path SVG
    const pathData = points.reduce((path, point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      // Courbe de Bézier pour un tracé lisse
      const prevPoint = points[index - 1];
      const cp1x = prevPoint.x + (point.x - prevPoint.x) / 3;
      const cp1y = prevPoint.y;
      const cp2x = prevPoint.x - (point.x - prevPoint.x) / 3;
      const cp2y = point.y;
      return `${path} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
    }, '');

    // Path pour le gradient
    const areaPath = `${pathData} L ${points[points.length - 1].x} ${chartHeight} L 0 ${chartHeight} Z`;

    return {
      points,
      pathData,
      areaPath,
      minScore,
      maxScore,
      average: scores.reduce((a, b) => a + b, 0) / scores.length,
      trend: scores[scores.length - 1] - scores[0],
    };
  }, [data, chartWidth, chartHeight]);

  if (!chartData || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Pas encore de données de progression
        </Text>
      </View>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const Container = animated ? Animated.View : View;

  return (
    <Container
      entering={animated ? FadeInUp.duration(600) : undefined}
      style={[styles.container, { backgroundColor: colors.surface }]}
    >
      {/* Header avec statistiques */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Progression sur {data.length} sessions
        </Text>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {chartData.average.toFixed(0)}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Moyenne</Text>
          </View>
          <View style={styles.statItem}>
            <Text
              style={[
                styles.statValue,
                chartData.trend >= 0 ? styles.trendPositive : styles.trendNegative,
              ]}
            >
              {chartData.trend >= 0 ? '+' : ''}
              {chartData.trend.toFixed(0)}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tendance</Text>
          </View>
        </View>
      </View>

      {/* Graphique SVG */}
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        <G x={chartPadding.left} y={chartPadding.top}>
          {/* Grille horizontale */}
          {[0, 25, 50, 75, 100].map(value => {
            const y = chartHeight - (value / 100) * chartHeight;
            return (
              <G key={value}>
                <Line
                  x1={0}
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke={colors.border}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  opacity={0.3}
                />
                <SvgText
                  x={-10}
                  y={y + 4}
                  fontSize={10}
                  fill={colors.textSecondary}
                  textAnchor="end"
                >
                  {value}%
                </SvgText>
              </G>
            );
          })}

          {/* Zone de gradient */}
          <Path d={chartData.areaPath} fill="url(#gradient)" />

          {/* Ligne principale */}
          <Path
            d={chartData.pathData}
            stroke={colors.primary}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points et labels */}
          {chartData.points.map((point, index) => (
            <G key={point.sessionId}>
              {/* Point */}
              <Circle
                cx={point.x}
                cy={point.y}
                r={4}
                fill={colors.primary}
                stroke={colors.background}
                strokeWidth={2}
              />

              {/* Valeur au-dessus du point */}
              <SvgText
                x={point.x}
                y={point.y - 10}
                fontSize={10}
                fill={colors.text}
                textAnchor="middle"
                fontWeight="600"
              >
                {point.score.toFixed(0)}%
              </SvgText>

              {/* Date en bas */}
              {(index === 0 || index === chartData.points.length - 1 || index % 2 === 0) && (
                <SvgText
                  x={point.x}
                  y={chartHeight + 20}
                  fontSize={9}
                  fill={colors.textSecondary}
                  textAnchor="middle"
                >
                  {formatDate(point.date)}
                </SvgText>
              )}
            </G>
          ))}

          {/* Ligne de moyenne */}
          <Line
            x1={0}
            y1={
              chartHeight -
              ((chartData.average - chartData.minScore) /
                (chartData.maxScore - chartData.minScore)) *
                chartHeight
            }
            x2={chartWidth}
            y2={
              chartHeight -
              ((chartData.average - chartData.minScore) /
                (chartData.maxScore - chartData.minScore)) *
                chartHeight
            }
            stroke={colors.warning}
            strokeWidth={1}
            strokeDasharray="5 5"
            opacity={0.5}
          />
        </G>
      </Svg>

      {/* Légende */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Score de session</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: colors.warning }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Moyenne</Text>
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.bodyBold,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h4,
    fontWeight: 'bold',
  },
  statLabel: {
    ...typography.caption,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLine: {
    width: 16,
    height: 2,
  },
  legendText: {
    ...typography.caption,
  },
  trendPositive: {
    color: '#10B981',
  },
  trendNegative: {
    color: '#EF4444',
  },
});
