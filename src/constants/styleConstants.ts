// Constantes pour les styles et couleurs
import { StyleSheet } from 'react-native';

export const COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  primary: '#DC2626',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  overlay: 'rgba(0, 0, 0, 0.5)',
  backgroundDarkSubtle: 'rgba(255, 255, 255, 0.05)',
  borderDarkSubtle: 'rgba(255, 255, 255, 0.1)',
  backgroundLightSubtle: 'rgba(0, 0, 0, 0.03)',
  borderLightSubtle: 'rgba(0, 0, 0, 0.06)',
} as const;

export const INLINE_STYLES = {
  flex1: { flex: 1 },
  row: { flexDirection: 'row' as const },
  center: { justifyContent: 'center' as const, alignItems: 'center' as const },
  borderHairline: { borderWidth: StyleSheet.hairlineWidth },
} as const;
