import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { typography, spacing } from '../styles/theme';
import Animated, {
  useAnimatedProps,
  withTiming,
  useSharedValue,
  withDelay,
  FadeInRight,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ThemeChartProps {
  data: {
    name: string;
    value: number;
    color: string;
    percentage: number;
  }[];
  size?: number;
  strokeWidth?: number;
}

// Composant séparé pour chaque segment du graphique
interface ChartSegmentProps {
  segment: {
    name: string;
    color: string;
    percentage: number;
    startAngle: number;
    angle: number;
  };
  index: number;
  size: number;
  radius: number;
  circumference: number;
  strokeWidth: number;
}

const ChartSegment: React.FC<ChartSegmentProps> = ({
  segment,
  index,
  size,
  radius,
  circumference,
  strokeWidth,
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * 200,
      withTiming(segment.percentage / 100, { duration: 1000 })
    );
  }, [index, segment.percentage, progress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeLength = (segment.angle / 360) * circumference;
    return {
      strokeDashoffset: circumference - strokeLength * progress.value,
    };
  });

  return (
    <AnimatedCircle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      stroke={segment.color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeDasharray={`${(segment.angle / 360) * circumference} ${circumference}`}
      animatedProps={animatedProps}
      rotation={segment.startAngle}
      origin={`${size / 2}, ${size / 2}`}
    />
  );
};

export const ThemeChart: React.FC<ThemeChartProps> = ({ data, size = 200, strokeWidth = 30 }) => {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculer les angles pour chaque segment
  let currentAngle = -90; // Commencer en haut
  const segments = data.map(item => {
    const angle = (item.percentage / 100) * 360;
    const segment = {
      ...item,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      angle,
    };
    currentAngle += angle;
    return segment;
  });

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {segments.map((segment, index) => (
            <ChartSegment
              key={segment.name}
              segment={segment}
              index={index}
              size={size}
              radius={radius}
              circumference={circumference}
              strokeWidth={strokeWidth}
            />
          ))}
        </G>
      </Svg>

      {/* Centre du graphique */}
      <View style={[styles.centerContent, { width: size, height: size }]}>
        <Text style={[styles.centerTitle, { color: colors.text }]}>Répartition</Text>
        <Text style={[styles.centerSubtitle, { color: colors.textSecondary }]}>par thème</Text>
      </View>

      {/* Légende */}
      <View style={styles.legend}>
        {data.map((item, index) => (
          <Animated.View
            key={item.name}
            entering={FadeInRight.duration(500).delay(1000 + index * 100)}
            style={styles.legendItem}
          >
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
              {item.percentage.toFixed(0)}%
            </Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerTitle: {
    ...typography.bodyBold,
  },
  centerSubtitle: {
    ...typography.small,
    marginTop: spacing.xs,
  },
  legend: {
    marginTop: spacing.lg,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  legendText: {
    ...typography.caption,
    flex: 1,
  },
  legendValue: {
    ...typography.caption,
    fontWeight: '600',
  },
});
