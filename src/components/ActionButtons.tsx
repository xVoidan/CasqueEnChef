import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { typography, spacing, borderRadius, shadows } from '../styles/theme';
import { ThemeColors } from '../types/theme.types';

interface ActionButtonsProps {
  onShare: () => void;
  onExportPDF: () => void;
  onNewSession: () => void;
  onHome: () => void;
  exportLoading?: boolean;
  colors: ThemeColors;
  style?: ViewStyle;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onShare,
  onExportPDF,
  onNewSession,
  onHome,
  exportLoading = false,
  colors,
  style,
}) => {
  return (
    <Animated.View entering={FadeInUp.duration(600).delay(900)} style={[styles.container, style]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions</Text>

      <View style={styles.buttonsGrid}>
        {/* Première ligne */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={onShare}
          disabled={exportLoading}
          accessibilityRole="button"
          accessibilityLabel="Partager les résultats"
          accessibilityHint="Partage vos résultats via les applications disponibles"
        >
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="share-outline" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.buttonLabel, { color: colors.text }]}>Partager</Text>
          <Text style={[styles.buttonDescription, { color: colors.textSecondary }]}>Résultats</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={onExportPDF}
          disabled={exportLoading}
          accessibilityRole="button"
          accessibilityLabel="Exporter en PDF"
          accessibilityHint="Génère un rapport PDF détaillé de votre session"
        >
          {exportLoading ? (
            <View style={styles.iconContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <View style={[styles.iconContainer, { backgroundColor: `${colors.secondary}15` }]}>
              <Ionicons name="document-text-outline" size={24} color={colors.secondary} />
            </View>
          )}
          <Text style={[styles.buttonLabel, { color: colors.text }]}>Exporter</Text>
          <Text style={[styles.buttonDescription, { color: colors.textSecondary }]}>PDF</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonsGrid}>
        {/* Deuxième ligne */}
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={onNewSession}
          accessibilityRole="button"
          accessibilityLabel="Nouvelle session"
          accessibilityHint="Démarre une nouvelle session d'entraînement"
        >
          <View style={[styles.iconContainer, styles.iconContainerLight]}>
            <Ionicons name="refresh" size={24} color="#FFF" />
          </View>
          <Text style={[styles.buttonLabel, styles.whiteText]}>Nouvelle</Text>
          <Text style={[styles.buttonDescription, styles.whiteTextTranslucent]}>Session</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={onHome}
          accessibilityRole="button"
          accessibilityLabel="Retour à l'accueil"
          accessibilityHint="Retourne à l'écran principal"
        >
          <View style={[styles.iconContainer, { backgroundColor: `${colors.textSecondary}15` }]}>
            <Ionicons name="home" size={24} color={colors.textSecondary} />
          </View>
          <Text style={[styles.buttonLabel, { color: colors.text }]}>Retour</Text>
          <Text style={[styles.buttonDescription, { color: colors.textSecondary }]}>Accueil</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  buttonsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  actionButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    ...shadows.sm,
  },
  primaryButton: {
    borderWidth: 0,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  buttonLabel: {
    ...typography.bodyBold,
    marginTop: spacing.xs,
  },
  buttonDescription: {
    ...typography.caption,
    marginTop: 2,
  },
  iconContainerLight: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  whiteText: {
    color: '#FFF',
  },
  whiteTextTranslucent: {
    color: 'rgba(255,255,255,0.9)',
  },
});
