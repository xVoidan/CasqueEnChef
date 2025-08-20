import React, {
  /* eslint-disable react-hooks/exhaustive-deps */ useState,
  useEffect,
  useRef,
} from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../styles/theme';

interface TimerProps {
  duration: number; // en secondes
  onTimeUp: () => void;
  isPaused: boolean;
  onTick?: (remainingTime: number) => void;
}

export const Timer: React.FC<TimerProps> = ({ duration, onTimeUp, isPaused, onTick }) => {
  const { colors } = useTheme();
  const [timeLeft, setTimeLeft] = useState(duration);
  const animatedValue = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTimeLeft(duration);
    animatedValue.setValue(1);
  }, [duration]);

  // Appeler onTick dans un useEffect séparé pour éviter les mises à jour pendant le rendu
  useEffect(() => {
    if (onTick && timeLeft < duration) {
      onTick(timeLeft);
    }
  }, [timeLeft, onTick, duration]);

  useEffect(() => {
    if (!isPaused && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;

          if (newTime <= 0) {
            onTimeUp();
            return 0;
          }
          return newTime;
        });
      }, 1000);

      // Animation de la barre de progression
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: timeLeft * 1000,
        useNativeDriver: false,
      }).start();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      animatedValue.stopAnimation();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, timeLeft, onTimeUp, animatedValue]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    const percentage = (timeLeft / duration) * 100;
    if (percentage > 50) {
      return colors.success;
    }
    if (percentage > 25) {
      return '#F59E0B';
    }
    return colors.error;
  };

  const progressWidth = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Text style={[styles.timeText, { color: getTimerColor() }]}>{formatTime(timeLeft)}</Text>
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressWidth,
              backgroundColor: getTimerColor(),
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  timeText: {
    ...typography.h3,
    fontVariant: ['tabular-nums'],
    marginBottom: 8,
  },
  progressBar: {
    width: 120,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
