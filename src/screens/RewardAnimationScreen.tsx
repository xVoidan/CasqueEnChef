import React, {
  /* eslint-disable react-hooks/exhaustive-deps, react-native/no-inline-styles, react-native/no-color-literals */ useEffect,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius, typography, spacing } from '../styles/theme';
import { TrainingStackScreenProps } from '../types/navigation';

const { width: SCREEN_WIDTH, height: _SCREEN_HEIGHT } = Dimensions.get('window');

interface Reward {
  type: 'badge' | 'challenge' | 'rank';
  id: number;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  points?: number;
}

export const RewardAnimationScreen: React.FC<TrainingStackScreenProps<'RewardAnimation'>> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const { rewards = [], sessionStats } = route.params || {};
  const [currentRewardIndex, setCurrentRewardIndex] = useState(0);
  const [showingReward, setShowingReward] = useState(true);

  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const particleOpacity = useSharedValue(0);

  const currentReward = rewards[currentRewardIndex];

  useEffect(() => {
    if (currentReward) {
      animateReward();
    }
  }, [currentRewardIndex]);

  const animateReward = () => {
    // Haptic feedback
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Reset values
    scale.value = 0;
    rotation.value = 0;
    glowOpacity.value = 0;
    particleOpacity.value = 0;

    // Animate entrance
    scale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 100 }),
      withSpring(1, { damping: 15, stiffness: 150 })
    );

    rotation.value = withSequence(withTiming(360, { duration: 800 }), withSpring(0));

    glowOpacity.value = withSequence(
      withTiming(1, { duration: 400 }),
      withDelay(1000, withTiming(0.6, { duration: 600 }))
    );

    particleOpacity.value = withSequence(
      withDelay(200, withTiming(1, { duration: 400 })),
      withDelay(1200, withTiming(0, { duration: 600 }))
    );
  };

  const handleNext = () => {
    if (currentRewardIndex < rewards.length - 1) {
      setShowingReward(false);
      void setTimeout(() => {
        setCurrentRewardIndex(currentRewardIndex + 1);
        setShowingReward(true);
      }, 300);
    } else {
      // Naviguer vers l'écran de rapport avec les stats
      navigation.replace('SessionReport', {
        stats: sessionStats,
        isAbandoned: false,
      });
    }
  };

  const handleSkipAll = () => {
    navigation.replace('SessionReport', {
      stats: sessionStats,
      isAbandoned: false,
    });
  };

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'legendary':
        return ['#FFD700', '#FFA500'];
      case 'epic':
        return ['#9C27B0', '#E91E63'];
      case 'rare':
        return ['#2196F3', '#00BCD4'];
      default:
        return ['#4CAF50', '#8BC34A'];
    }
  };

  const getRarityGlow = (rarity?: string) => {
    switch (rarity) {
      case 'legendary':
        return '#FFD700';
      case 'epic':
        return '#E91E63';
      case 'rare':
        return '#00BCD4';
      default:
        return '#4CAF50';
    }
  };

  const getRewardIcon = (reward: Reward) => {
    if (reward.type === 'badge') {
      return reward.icon ?? 'medal';
    } else if (reward.type === 'challenge') {
      return 'flag';
    } else {
      return 'star';
    }
  };

  const rewardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: interpolate(glowOpacity.value, [0, 1], [0.8, 1.5]) }],
  }));

  const particleStyle = useAnimatedStyle(() => ({
    opacity: particleOpacity.value,
  }));

  if (!currentReward) {
    // Si pas de récompenses, aller directement au rapport
    navigation.replace('SessionReport', {
      stats: sessionStats,
      isAbandoned: false,
    });
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.background, `${colors.primary}15`]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Particules d'arrière-plan */}
      <Animated.View style={[styles.particlesContainer, particleStyle]}>
        {[...Array(8)].map((_, i) => (
          <Animated.View
            key={i}
            entering={SlideInUp.delay(i * 100).springify()}
            style={[
              styles.particle,
              {
                position: 'absolute',
                left: `${10 + i * 11}%`,
                top: `${20 + (i % 3) * 20}%`,
              },
            ]}
          >
            <Ionicons name="sparkles" size={24} color={getRarityGlow(currentReward.rarity)} />
          </Animated.View>
        ))}
      </Animated.View>

      <View style={styles.content}>
        {/* Header */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.header}>
          <Text style={[styles.congratsText, { color: colors.text }]}>🎉 Félicitations ! 🎉</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Vous avez débloqué une nouvelle récompense !
          </Text>
        </Animated.View>

        {/* Récompense principale */}
        {showingReward && (
          <View style={styles.rewardContainer}>
            {/* Effet de lueur */}
            <Animated.View
              style={[
                styles.glowEffect,
                glowAnimatedStyle,
                {
                  backgroundColor: getRarityGlow(currentReward.rarity),
                  shadowColor: getRarityGlow(currentReward.rarity),
                },
              ]}
            />

            {/* Badge/Icône de récompense */}
            <Animated.View style={[styles.rewardCard, rewardAnimatedStyle]}>
              <LinearGradient
                colors={getRarityColor(currentReward.rarity)}
                style={styles.rewardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons
                  name={getRewardIcon(currentReward) as keyof typeof Ionicons.glyphMap}
                  size={80}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </Animated.View>

            {/* Infos de la récompense */}
            <Animated.View entering={FadeIn.delay(800)} style={styles.rewardInfo}>
              <Text style={[styles.rewardType, { color: colors.textSecondary }]}>
                {currentReward.type === 'badge'
                  ? 'BADGE'
                  : currentReward.type === 'challenge'
                    ? 'DÉFI COMPLÉTÉ'
                    : 'NOUVEAU RANG'}
              </Text>
              <Text style={[styles.rewardName, { color: colors.text }]}>
                {currentReward.name || 'Nouvelle récompense'}
              </Text>
              <Text style={[styles.rewardDescription, { color: colors.textSecondary }]}>
                {currentReward.description || 'Félicitations pour votre progression !'}
              </Text>
              {currentReward.points !== undefined &&
                currentReward.points !== null &&
                currentReward.points > 0 && (
                  <View
                    style={[styles.pointsContainer, { backgroundColor: `${colors.primary}20` }]}
                  >
                    <Ionicons name="trophy" size={20} color={colors.primary} />
                    <Text style={[styles.pointsText, { color: colors.primary }]}>
                      +{currentReward.points} points
                    </Text>
                  </View>
                )}
            </Animated.View>
          </View>
        )}

        {/* Indicateur de progression */}
        <Animated.View entering={FadeIn.delay(1000)} style={styles.progressIndicator}>
          <View style={styles.dots}>
            {rewards.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index <= currentRewardIndex ? colors.primary : colors.border,
                    width: index === currentRewardIndex ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeIn.delay(1200)} style={styles.actions}>
          <TouchableOpacity
            onPress={handleNext}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {currentRewardIndex < rewards.length - 1 ? 'Suivant' : 'Voir les résultats'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {rewards.length > 1 && currentRewardIndex < rewards.length - 1 && (
            <TouchableOpacity onPress={handleSkipAll} style={styles.skipButton} activeOpacity={0.7}>
              <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
                Passer tout
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  congratsText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  rewardContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  glowEffect: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  rewardCard: {
    width: 160,
    height: 160,
    marginBottom: spacing.xl,
  },
  rewardGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  rewardInfo: {
    alignItems: 'center',
    maxWidth: SCREEN_WIDTH * 0.8,
    marginTop: spacing.xl * 2,
  },
  rewardType: {
    ...typography.small,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  rewardName: {
    ...typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  rewardDescription: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  pointsText: {
    ...typography.bodyBold,
    marginLeft: spacing.xs,
  },
  progressIndicator: {
    marginBottom: spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    ...typography.bodyBold,
    color: '#FFFFFF',
    marginRight: spacing.xs,
  },
  skipButton: {
    padding: spacing.md,
  },
  skipButtonText: {
    ...typography.body,
  },
});
