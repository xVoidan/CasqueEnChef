import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { typography, spacing } from '../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BarData {
  label: string;
  value: number;
  color: string;
}

interface BarChartProps {
  data: BarData[];
  height?: number;
  maxValue?: number;
  showValues?: boolean;
  animated?: boolean;
}

const Bar: React.FC<{
  item: BarData;
  maxValue: number;
  index: number;
  barWidth: number;
  height: number;
  showValues: boolean;
  animated: boolean;
}> = ({ item, maxValue, index, barWidth, height, showValues, animated }) => {
  const barHeight = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      barHeight.value = withDelay(
        index * 100,
        withTiming((item.value / maxValue) * height, { duration: 800 })
      );
    } else {
      barHeight.value = (item.value / maxValue) * height;
    }
  }, [animated, barHeight, item.value, maxValue, height, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: barHeight.value,
  }));

  return (
    <View style={[styles.barContainer, { width: barWidth }]}>
      {showValues && <Text style={styles.value}>{Math.round(item.value)}%</Text>}
      <View style={[styles.barWrapper, { height }]}>
        <Animated.View style={[styles.bar, { backgroundColor: item.color }, animatedStyle]} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {item.label}
      </Text>
    </View>
  );
};

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 150,
  maxValue,
  showValues = true,
  animated = true,
}) => {
  const calculatedMaxValue = maxValue ?? Math.max(...data.map(d => d.value));
  const barWidth = (SCREEN_WIDTH - spacing.lg * 3) / data.length;

  return (
    <View style={styles.container}>
      <View style={styles.chart}>
        {data.map((item, index) => (
          <Bar
            key={index}
            item={item}
            maxValue={calculatedMaxValue}
            index={index}
            barWidth={barWidth}
            height={height}
            showValues={showValues}
            animated={animated}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barContainer: {
    alignItems: 'center',
  },
  barWrapper: {
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
  },
  bar: {
    width: '80%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  value: {
    ...typography.small,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.caption,
    textAlign: 'center',
  },
});
