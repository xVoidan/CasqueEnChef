import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../styles/theme';

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
  
  // Calcul dynamique : insets.bottom + padding minimal, avec minimum de 90px
  const dynamicPaddingBottom = Math.max(insets.bottom + spacing.lg + 10, 90);
  
  return (
    <View
      style={[
        {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: dynamicPaddingBottom,
          borderTopWidth: hasBorder ? 1 : 0,
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