import { Platform } from 'react-native';

// Fix pour les fonts sur React Navigation
export const configureFonts = () => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    // Assure que les fonts par défaut sont disponibles
    const defaultFonts = {
      regular: {
        fontFamily: Platform.select({
          ios: 'System',
          android: 'Roboto',
          default: 'System',
        }),
        fontWeight: '400' as const,
      },
      medium: {
        fontFamily: Platform.select({
          ios: 'System',
          android: 'Roboto-Medium',
          default: 'System',
        }),
        fontWeight: '500' as const,
      },
      light: {
        fontFamily: Platform.select({
          ios: 'System',
          android: 'Roboto-Light',
          default: 'System',
        }),
        fontWeight: '300' as const,
      },
      thin: {
        fontFamily: Platform.select({
          ios: 'System',
          android: 'Roboto-Thin',
          default: 'System',
        }),
        fontWeight: '100' as const,
      },
    };

    // Patch global pour s'assurer que les fonts sont disponibles
    if (typeof global !== 'undefined') {
      (global as any).__REACT_NAVIGATION_FONTS__ = defaultFonts;
    }

    return defaultFonts;
  }
  
  return {};
};

// Initialise les fonts au démarrage
configureFonts();