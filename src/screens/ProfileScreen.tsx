import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { spacing, typography, borderRadius, shadows } from '../styles/theme';
import { ProfileStackScreenProps } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';

/* eslint-disable react-native/no-inline-styles */

export const ProfileScreen: React.FC<ProfileStackScreenProps<'ProfileScreen'>> = ({
  navigation: _navigation,
}) => {
  const { colors, setThemeMode, themeMode } = useTheme();
  const { user, signOut } = useAuth();

  const menuItems = [
    { id: '1', title: 'Informations personnelles', icon: 'person-outline' as const },
    { id: '2', title: 'Formation et certifications', icon: 'ribbon-outline' as const },
    { id: '3', title: 'Historique des gardes', icon: 'time-outline' as const },
    { id: '4', title: 'Documents', icon: 'document-outline' as const },
    { id: '5', title: 'Notifications', icon: 'notifications-outline' as const },
    { id: '6', title: 'Aide et support', icon: 'help-circle-outline' as const },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.surface }]}>
            <Ionicons name="person" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.username ?? user?.email ?? 'Utilisateur'}
          </Text>
          <Text style={[styles.userRole, { color: colors.textSecondary }]}>
            {user?.isGuest ? 'Mode invité' : 'Sapeur-Pompier 1ère classe'}
          </Text>
          <Text style={[styles.userStation, { color: colors.textSecondary }]}>
            Centre de secours principal
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>127</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Interventions</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>8</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Années service</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>24</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Formations</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                {
                  backgroundColor: colors.surface,
                  borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemContent}>
                <Ionicons name={item.icon} size={22} color={colors.textSecondary} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.themeSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.themeSectionTitle, { color: colors.text }]}>Apparence</Text>
          <View style={styles.themeOptions}>
            {(['auto', 'light', 'dark'] as const).map(mode => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: themeMode === mode ? colors.primary : colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setThemeMode(mode)}
              >
                <Ionicons
                  name={
                    mode === 'auto'
                      ? 'phone-portrait-outline'
                      : mode === 'light'
                        ? 'sunny-outline'
                        : 'moon-outline'
                  }
                  size={20}
                  color={themeMode === mode ? '#FFFFFF' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    { color: themeMode === mode ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {mode === 'auto' ? 'Auto' : mode === 'light' ? 'Clair' : 'Sombre'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.surface }]}
          activeOpacity={0.7}
          onPress={() => {
            Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
              { text: 'Annuler', style: 'cancel' },
              {
                text: 'Déconnexion',
                style: 'destructive',
                onPress: () => {
                  void (async () => {
                    try {
                      await signOut();
                    } catch {
                      Alert.alert('Erreur', 'Impossible de se déconnecter');
                    }
                  })();
                },
              },
            ]);
          }}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.primary} />
          <Text style={[styles.logoutText, { color: colors.primary }]}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  userName: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  userRole: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  userStation: {
    ...typography.caption,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  statValue: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.small,
  },
  menuSection: {
    marginBottom: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    ...typography.body,
    marginLeft: spacing.md,
  },
  themeSection: {
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  themeSectionTitle: {
    ...typography.bodyBold,
    marginBottom: spacing.md,
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  themeOptionText: {
    ...typography.caption,
    marginLeft: spacing.xs,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  logoutText: {
    ...typography.bodyBold,
    marginLeft: spacing.sm,
  },
});
