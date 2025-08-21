import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../styles/theme';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementBadgeProps {
  achievement: Achievement;
  index?: number;
  showAnimation?: boolean;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  index = 0,
  showAnimation = true,
}) => {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (showAnimation && achievement.unlocked) {
      scale.value = withDelay(
        index * 100,
        withSequence(
          withSpring(1.2, { damping: 2, stiffness: 200 }),
          withSpring(1, { damping: 5, stiffness: 150 })
        )
      );
      rotation.value = withDelay(
        index * 100,
        withSequence(withSpring(10), withSpring(-10), withSpring(0))
      );
      opacity.value = withDelay(index * 100, withSpring(1));
    } else {
      scale.value = achievement.unlocked ? 1 : 0.8;
      opacity.value = achievement.unlocked ? 1 : 0.5;
    }
  }, [scale, rotation, opacity, achievement.unlocked, index, showAnimation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotateZ: `${rotation.value}deg` }],
    opacity: opacity.value,
  }));

  const getRarityColor = () => {
    switch (achievement.rarity) {
      case 'legendary':
        return '#FFD700';
      case 'epic':
        return '#9333EA';
      case 'rare':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const getRarityGlow = () => {
    if (!achievement.unlocked) {
      return {};
    }

    switch (achievement.rarity) {
      case 'legendary':
        return {
          shadowColor: '#FFD700',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 10,
          elevation: 10,
        };
      case 'epic':
        return {
          shadowColor: '#9333EA',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        };
      case 'rare':
        return {
          shadowColor: '#3B82F6',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 6,
        };
      default:
        return {};
    }
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View
        style={[
          styles.badge,
          styles.badgeBackground,
          achievement.unlocked && { backgroundColor: achievement.color },
          { borderColor: getRarityColor() },
          getRarityGlow(),
        ]}
      >
        <Ionicons
          name={achievement.icon}
          size={32}
          color={achievement.unlocked ? '#FFF' : '#9CA3AF'}
        />
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {achievement.title}
      </Text>
      {achievement.unlocked && (
        <View style={[styles.rarityBadge, { backgroundColor: getRarityColor() }]}>
          <Text style={styles.rarityText}>{achievement.rarity.toUpperCase()}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 90,
    margin: spacing.sm,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.caption,
    textAlign: 'center',
    fontWeight: '600',
  },
  rarityBadge: {
    position: 'absolute',
    top: -5,
    right: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  rarityText: {
    ...typography.caption,
    fontSize: 8,
    fontWeight: 'bold',
  },
  badgeBackground: {
    backgroundColor: '#E5E5E5',
  },
});
