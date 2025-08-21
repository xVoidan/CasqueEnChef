import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PersonalizedAdvice, Advice } from '../PersonalizedAdvice';
import { typography, spacing } from '../../styles/theme';
import { ThemeColors } from '../../types/theme.types';

interface AdviceTabProps {
  advices: Advice[];
  colors: ThemeColors;
}

export const AdviceTab = memo<AdviceTabProps>(({ advices, colors }) => {
  return (
    <View style={styles.adviceContainer} accessibilityLabel="Conseils personnalisés">
      {advices.map((advice, index) => (
        <PersonalizedAdvice key={advice.id} advice={advice} index={index} colors={colors} />
      ))}

      {advices.length === 0 && (
        <View
          style={styles.emptyAdvice}
          accessibilityRole="text"
          accessibilityLabel="Aucun conseil disponible. Continuez comme ça, vos performances sont excellentes."
        >
          <Ionicons name="bulb-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyAdviceText, { color: colors.textSecondary }]}>
            Continuez comme ça ! Vos performances sont excellentes.
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  adviceContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  emptyAdvice: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyAdviceText: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

AdviceTab.displayName = 'AdviceTab';
