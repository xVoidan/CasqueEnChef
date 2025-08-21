import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../styles/theme';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface ThemeColors {
  primary: string;
  text: string;
  textSecondary: string;
  [key: string]: string;
}

export interface Advice {
  id: string;
  type: 'strength' | 'weakness' | 'tip' | 'challenge';
  title: string;
  description: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface PersonalizedAdviceProps {
  advice: Advice;
  index?: number;
  colors: ThemeColors;
}

export const PersonalizedAdvice: React.FC<PersonalizedAdviceProps> = ({
  advice,
  index = 0,
  colors,
}) => {
  const getIcon = () => {
    switch (advice.type) {
      case 'strength':
        return 'trophy';
      case 'weakness':
        return 'alert-circle';
      case 'tip':
        return 'bulb';
      case 'challenge':
        return 'flag';
      default:
        return 'information-circle';
    }
  };

  const getColor = () => {
    switch (advice.type) {
      case 'strength':
        return '#10B981';
      case 'weakness':
        return '#F59E0B';
      case 'tip':
        return '#3B82F6';
      case 'challenge':
        return '#9333EA';
      default:
        return colors.primary;
    }
  };

  const getBackgroundColor = () => {
    const color = getColor();
    return `${color}15`;
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(500).delay(index * 100)}
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderLeftColor: getColor(),
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: getColor() }]}>
          <Ionicons name={getIcon()} size={20} color="#FFF" />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{advice.title}</Text>
      </View>

      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {advice.description}
      </Text>

      {advice.action && (
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: getColor() }]}
          onPress={advice.action.onPress}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionText, { color: getColor() }]}>{advice.action.label}</Text>
          <Ionicons name="arrow-forward" size={16} color={getColor()} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  title: {
    ...typography.bodyBold,
    flex: 1,
  },
  description: {
    ...typography.body,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  actionText: {
    ...typography.small,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
});
