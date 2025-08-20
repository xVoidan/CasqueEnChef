import React, {
  /* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/no-misused-promises */ useState,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { spacing, typography, borderRadius } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/styleConstants';
import { profileService } from '../services/profileService';
import { avatarService } from '../services/avatarService';
import * as Haptics from 'expo-haptics';

export const ProfileCompleteScreen: React.FC = () => {
  const { colors, isDark, setThemeMode } = useTheme();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<{
    nom_complet?: string;
    username?: string;
    email?: string;
    numero_permis?: string;
    date_naissance?: string;
    objectif_temps?: string;
    objectif_reussite?: number;
    concours_type?: string;
  } | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // Modals states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editField, setEditField] = useState<'username' | 'email' | null>(null);

  // Form states
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [_currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      void loadProfileData();
      void loadAvatar();
    }
  }, [user]);

  const toggleTheme = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Toggle between light and dark (not auto)
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const loadAvatar = async () => {
    if (!user) {
      return;
    }

    try {
      const avatar = await avatarService.getAvatar(user.id);
      if (avatar) {
        setAvatarUri(avatar);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'avatar:", error);
    }
  };

  const loadProfileData = async () => {
    if (!user || user.isGuest) {
      return;
    }

    setLoading(true);
    try {
      // Charger le profil
      const { data: profileData } = await profileService.getProfile(user.id);
      if (profileData) {
        setProfile(profileData);
        setNewUsername(profileData.username || '');
        setNewEmail(user.email || '');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    await loadAvatar();
    setRefreshing(false);
  };

  const handleAvatarChange = async () => {
    if (user?.isGuest) {
      Alert.alert('Mode invité', "Cette fonctionnalité n'est pas disponible en mode invité");
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Alert.alert("Changer l'avatar", 'Comment souhaitez-vous changer votre avatar ?', [
      {
        text: 'Prendre une photo',
        onPress: async () => {
          const result = await avatarService.takePhotoForAvatar(user!.id);
          if (result.success && result.uri) {
            setAvatarUri(result.uri);
            Alert.alert('Succès', 'Avatar mis à jour avec succès');
          }
        },
      },
      {
        text: 'Choisir de la galerie',
        onPress: async () => {
          const result = await avatarService.selectAndSaveAvatar(user!.id);
          if (result.success && result.uri) {
            setAvatarUri(result.uri);
            Alert.alert('Succès', 'Avatar mis à jour avec succès');
          }
        },
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  const handleEditProfile = (field: 'username' | 'email') => {
    if (user?.isGuest) {
      Alert.alert('Mode invité', "Cette fonctionnalité n'est pas disponible en mode invité");
      return;
    }

    setEditField(field);
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!user || user.isGuest) {
      return;
    }

    setLoading(true);
    try {
      if (editField === 'username') {
        const { error } = await profileService.updateProfile(user.id, {
          username: newUsername,
        });
        if (error) {
          Alert.alert('Erreur', error);
        } else {
          setProfile({ ...profile, username: newUsername });
          Alert.alert('Succès', 'Pseudo mis à jour');
        }
      } else if (editField === 'email') {
        const { error } = await profileService.updateEmail(newEmail);
        if (error) {
          Alert.alert('Erreur', error);
        } else {
          Alert.alert('Succès', 'Un email de confirmation a été envoyé');
        }
      }
      setEditModalVisible(false);
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      const { error } = await profileService.updatePassword(newPassword);
      if (error) {
        Alert.alert('Erreur', error);
      } else {
        Alert.alert('Succès', 'Mot de passe mis à jour');
        setPasswordModalVisible(false);
        setNewPassword('');
        setConfirmPassword('');
        setCurrentPassword('');
      }
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await signOut();
        },
      },
    ]);
  };

  if (loading && !profile) {
    return (
      <View
        style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentPadding}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header avec Avatar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleAvatarChange} activeOpacity={0.8}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.surface }]}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <Ionicons name="person" size={48} color={colors.primary} />
              )}
              {!user?.isGuest && (
                <View style={[styles.avatarBadge, { backgroundColor: colors.primary }]}>
                  <Ionicons name="camera" size={16} color={COLORS.white} />
                </View>
              )}
            </View>
          </TouchableOpacity>

          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.isGuest ? 'Mode Invité' : profile?.username || user?.email?.split('@')[0]}
          </Text>

          {!user?.isGuest && (
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
          )}

          {profile?.concours_type && (
            <View style={[styles.concoursChip, { backgroundColor: colors.primary }]}>
              <Text style={styles.concoursText}>
                Concours {profile.concours_type === 'caporal' ? 'Caporal' : 'Lieutenant'}
              </Text>
            </View>
          )}
        </View>

        {/* Informations du profil */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations</Text>

          <TouchableOpacity
            style={[styles.infoRow, { backgroundColor: colors.surface }]}
            onPress={() => handleEditProfile('username')}
            disabled={user?.isGuest}
          >
            <View style={styles.infoContent}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              <View style={styles.infoText}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Pseudo</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {user?.isGuest ? 'Mode invité' : profile?.username || '-'}
                </Text>
              </View>
            </View>
            {!user?.isGuest && (
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.infoRow, { backgroundColor: colors.surface }]}
            onPress={() => handleEditProfile('email')}
            disabled={user?.isGuest}
          >
            <View style={styles.infoContent}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              <View style={styles.infoText}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {user?.isGuest ? 'Non disponible' : user?.email}
                </Text>
              </View>
            </View>
            {!user?.isGuest && (
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          {!user?.isGuest && (
            <TouchableOpacity
              style={[styles.infoRow, { backgroundColor: colors.surface }]}
              onPress={() => setPasswordModalVisible(true)}
            >
              <View style={styles.infoContent}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                <View style={styles.infoText}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Mot de passe
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>••••••••</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Préférences */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Préférences</Text>

          <View style={[styles.preferenceRow, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={styles.preferenceContent}
              onPress={toggleTheme}
              activeOpacity={0.7}
            >
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={colors.primary} />
              <View style={styles.preferenceText}>
                <Text style={[styles.preferenceLabel, { color: colors.text }]}>Mode sombre</Text>
                <Text style={[styles.preferenceValue, { color: colors.textSecondary }]}>
                  {isDark ? 'Activé' : 'Désactivé'}
                </Text>
              </View>
            </TouchableOpacity>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDark ? '#FFFFFF' : '#F4F3F4'}
              ios_backgroundColor={colors.border}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>
              {user?.isGuest ? 'Quitter le mode invité' : 'Déconnexion'}
            </Text>
          </TouchableOpacity>

          {user?.isGuest && (
            <View style={[styles.guestInfo, { backgroundColor: `${colors.primary}10` }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.guestInfoText, { color: colors.text }]}>
                Créez un compte pour sauvegarder votre progression et débloquer toutes les
                fonctionnalités
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal Édition */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Modifier {editField === 'username' ? 'le pseudo' : "l'email"}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text }]}
              value={editField === 'username' ? newUsername : newEmail}
              onChangeText={editField === 'username' ? setNewUsername : setNewEmail}
              placeholder={editField === 'username' ? 'Nouveau pseudo' : 'Nouvel email'}
              placeholderTextColor={colors.textSecondary}
              keyboardType={editField === 'email' ? 'email-address' : 'default'}
              autoCapitalize="none"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.surface }]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={() => void handleSaveProfile()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.modalButtonText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Mot de passe */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Changer le mot de passe
              </Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text }]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nouveau mot de passe"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
            />

            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.surface }]}
                onPress={() => setPasswordModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.modalButtonText}>Changer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  concoursChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  concoursText: {
    ...typography.caption,
    color: COLORS.white,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  infoLabel: {
    ...typography.small,
    marginBottom: spacing.xs,
  },
  infoValue: {
    ...typography.body,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  actionText: {
    ...typography.bodyBold,
    marginLeft: spacing.sm,
  },
  guestInfo: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  guestInfoText: {
    ...typography.caption,
    marginLeft: spacing.sm,
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.overlay,
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h4,
  },
  modalInput: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...typography.body,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  modalButtonText: {
    ...typography.bodyBold,
    color: COLORS.white,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  preferenceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  preferenceLabel: {
    ...typography.bodyBold,
    marginBottom: spacing.xs,
  },
  preferenceValue: {
    ...typography.small,
  },
  scrollContentPadding: {
    paddingBottom: 100,
  },
});
