import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, typography, borderRadius, shadows } from '../styles/theme';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface BadgeNotificationProps {
  visible: boolean;
  badge: {
    nom: string;
    description: string;
    icone: string;
    couleur: string;
    points?: number;
  } | null;
  onClose: () => void;
}

export const BadgeNotification: React.FC<BadgeNotificationProps> = ({
  visible,
  badge,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible && badge) {
      // Haptic feedback pour nouveau badge
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Animation d'entrée
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
      ]).start();

      // Auto-fermeture après 5 secondes
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      // Animation de sortie
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -200,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, badge]);

  const handleClose = () => {
    // Animation de sortie
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!badge) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={handleClose}>
        <LinearGradient
          colors={isDark 
            ? ['#1F2937', '#111827']
            : ['#FFFFFF', '#F9FAFB']
          }
          style={[styles.notification, shadows.lg]}
        >
          {/* Particules d'effet */}
          <View style={styles.particles}>
            {[...Array(6)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.particle,
                  {
                    backgroundColor: badge.couleur,
                    transform: [
                      { rotate: `${i * 60}deg` },
                      { translateX: 30 },
                    ],
                  },
                ]}
              />
            ))}
          </View>

          {/* Contenu */}
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: badge.couleur + '20' }]}>
                <Ionicons name={badge.icone as any} size={32} color={badge.couleur} />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.text }]}>
                  Nouveau badge débloqué !
                </Text>
                <Text style={[styles.badgeName, { color: badge.couleur }]}>
                  {badge.nom}
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {badge.description}
            </Text>

            {badge.points && badge.points > 0 && (
              <View style={[styles.pointsContainer, { backgroundColor: colors.primary + '10' }]}>
                <Ionicons name="star" size={16} color={colors.primary} />
                <Text style={[styles.pointsText, { color: colors.primary }]}>
                  +{badge.points} points
                </Text>
              </View>
            )}

            {/* Barre de progression pour l'auto-fermeture */}
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { 
                    backgroundColor: badge.couleur,
                    width: visible ? '100%' : '0%',
                  }
                ]}
              />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
  },
  notification: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  particles: {
    position: 'absolute',
    top: '50%',
    left: 60,
    width: 60,
    height: 60,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.3,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.caption.fontSize,
    marginBottom: 2,
  },
  badgeName: {
    fontSize: typography.h3.fontSize,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: spacing.xs,
  },
  description: {
    fontSize: typography.body.fontSize,
    marginBottom: spacing.sm,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  pointsText: {
    fontSize: typography.caption.fontSize,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    animationDuration: '5s',
    animationTimingFunction: 'linear',
  },
});