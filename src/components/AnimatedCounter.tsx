import React, { useEffect } from 'react';
import { Text, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

const AnimatedText = Animated.createAnimatedComponent(Text);

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

  const animatedProps = useAnimatedProps(() => {
    const text = `${prefix}${animatedValue.value.toFixed(decimals)}${suffix}`;
    return {
      text,
      defaultProps: {
        text,
      },
    };
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <AnimatedText style={[style, animatedStyle]} animatedProps={animatedProps} />;
};
