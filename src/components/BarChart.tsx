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
        <View style={[styles.barBackground, { height, width: barWidth * 0.7 }]} />
        <Animated.View 
          style={[
            styles.bar, 
            { 
              backgroundColor: item.color,
              width: barWidth * 0.7,
            }, 
            animatedStyle
          ]} 
        />
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
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: spacing.xs,
    width: '100%',
  },
  bar: {
    position: 'absolute',
    bottom: 0,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 2,
  },
  barBackground: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#E5E5E5',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    opacity: 0.3,
  },
  value: {
    ...typography.small,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    color: '#333',
  },
  label: {
    ...typography.caption,
    textAlign: 'center',
    color: '#666',
    fontSize: 10,
  },
});
