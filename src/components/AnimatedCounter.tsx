import React, { useEffect } from 'react';
import { Text, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  style?: TextStyle;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  bounce?: boolean;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1500,
  delay = 0,
  style,
  prefix = '',
  suffix = '',
  decimals = 0,
  bounce = false,
}) => {
  const animatedValue = useSharedValue(0);
  const scale = useSharedValue(1);
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    animatedValue.value = withDelay(delay, withTiming(value, { duration }));

    if (bounce) {
      scale.value = withDelay(
        delay + duration - 200,
        withSequence(
          withSpring(1.2, { damping: 2, stiffness: 200 }),
          withSpring(1, { damping: 5, stiffness: 150 })
        )
      );
    }
  }, [animatedValue, scale, value, duration, delay, bounce]);

  // Update display value as animation progresses
  useDerivedValue(() => {
    runOnJS(setDisplayValue)(animatedValue.value);
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[style, animatedStyle]}>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </Animated.Text>
  );
};
