import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../styles/theme';

/* eslint-disable react-native/no-inline-styles */

interface ButtonContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  borderColor?: string;
  hasBorder?: boolean;
}

export const ButtonContainer: React.FC<ButtonContainerProps> = ({
  children,
  style,
  backgroundColor,
  borderColor,
  hasBorder = true,
}) => {
  const insets = useSafeAreaInsets();

  // Assurer que le bouton est bien au-dessus de la barre de navigation
  // Si insets.bottom est 0 (pas de barre de navigation), on met un padding minimal
  // Si insets.bottom > 0 (barre de navigation présente), on ajoute les insets + un padding généreux pour éviter tout chevauchement
  const dynamicPaddingBottom =
    insets.bottom > 0 ? insets.bottom + spacing.xl + spacing.lg : spacing.lg;

  return (
    <View
      style={[
        {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: dynamicPaddingBottom,
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
