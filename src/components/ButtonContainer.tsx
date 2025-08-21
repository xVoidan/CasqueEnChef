import React from 'react';
import { View, ViewStyle, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../styles/theme';

/* eslint-disable react-native/no-inline-styles */

interface ButtonContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  borderColor?: string;
  hasBorder?: boolean;
  floating?: boolean; // Option pour un bouton flottant
}

export const ButtonContainer: React.FC<ButtonContainerProps> = ({
  children,
  style,
  backgroundColor,
  borderColor,
  hasBorder = true,
  floating = false,
}) => {
  const insets = useSafeAreaInsets();

  // Approche simplifiée : padding fixe qui fonctionne bien avec la navigation
  // On utilise un calcul simple qui garantit la visibilité sans chevauchement
  const bottomPadding = Math.max(110, insets.bottom + 90); // 110px minimum, ou insets + 90px pour éviter tout chevauchement

  if (floating) {
    // Style flottant pour les boutons qui doivent être au-dessus du contenu
    return (
      <View
        style={[
          styles.floatingContainer,
          {
            bottom: bottomPadding - 20, // Position absolue ajustée
            backgroundColor: backgroundColor ?? 'transparent',
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // Style standard avec padding
  return (
    <View
      style={[
        styles.standardContainer,
        {
          paddingBottom: bottomPadding,
          borderTopWidth: hasBorder ? StyleSheet.hairlineWidth : 0,
          borderTopColor: borderColor,
          backgroundColor,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  standardContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  floatingContainer: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    paddingHorizontal: 0,
    zIndex: 1000,
    elevation: Platform.OS === 'android' ? 5 : 0,
  },
});
