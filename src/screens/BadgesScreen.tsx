import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { badgesService, Badge, Defi, Rang } from '../services/badgesService';
import { spacing, typography, borderRadius, shadows } from '../styles/theme';

/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-native/no-color-literals */

const { width } = Dimensions.get('window');

export const BadgesScreen = () => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'badges' | 'challenges' | 'rank'>('badges');
  const [badges, setBadges] = useState<Badge[]>([]);
  const [challenges, setChallenges] = useState<Defi[]>([]);
  const [rank, setRank] = useState<Rang | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const loadData = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    try {
      const [badgesData, challengesData, rankData] = await Promise.all([
        badgesService.getUserBadges(user.id),
        badgesService.getUserChallenges(user.id),
        badgesService.getUserRank(user.id),
      ]);

      setBadges(badgesData);
      setChallenges(challengesData);
      setRank(rankData);

      // Vérifier les nouveaux badges
      const result = await badgesService.checkAndAwardBadges(user.id);
      if (result.new_badges.length > 0) {
        // Recharger les badges si de nouveaux ont été attribués
        const updatedBadges = await badgesService.getUserBadges(user.id);
        setBadges(updatedBadges);
      }
    } catch (error) {
      console.error('Error loading badges data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      void loadData();
    }
  }, [user, loadData]);

  const renderTabButton = (tab: 'badges' | 'challenges' | 'rank', title: string, icon: string) => (
    <TouchableOpacity
      onPress={() => setSelectedTab(tab)}
      style={[
        styles.tabButton,
        selectedTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
      ]}
    >
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={24}
        color={selectedTab === tab ? colors.primary : colors.textSecondary}
      />
      <Text
        style={[
          styles.tabButtonText,
          { color: selectedTab === tab ? colors.primary : colors.textSecondary },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderBadges = () => {
    const stats = badgesService.getBadgeStats(badges);
    const filteredBadges =
      selectedCategory === 'all' ? badges : badges.filter(b => b.categorie === selectedCategory);

    const categories = [
      { key: 'all', label: 'Tous', icon: 'apps' },
      { key: 'progression', label: 'Progression', icon: 'trending-up' },
      { key: 'performance', label: 'Performance', icon: 'stats-chart' },
      { key: 'special', label: 'Spéciaux', icon: 'star' },
    ];

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Statistiques globales */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface }, shadows.sm]}>
          <View style={styles.statsHeader}>
            <Text style={[styles.statsTitle, { color: colors.text }]}>Collection de badges</Text>
            <View style={[styles.statsBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.statsBadgeText, { color: colors.primary }]}>
                {stats.earned}/{stats.total}
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${stats.percentageComplete}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {stats.percentageComplete}% complété
            </Text>
          </View>
        </View>

        {/* Filtres par catégorie */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.key}
              onPress={() => setSelectedCategory(cat.key)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selectedCategory === cat.key ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name={cat.icon as keyof typeof Ionicons.glyphMap}
                size={16}
                color={selectedCategory === cat.key ? '#FFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  { color: selectedCategory === cat.key ? '#FFF' : colors.textSecondary },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Grille de badges */}
        <View style={styles.badgesGrid}>
          {filteredBadges.map((badge, index) => (
            <Animated.View
              key={badge.id}
              entering={FadeInDown.delay(index * 50)}
              style={styles.badgeWrapper}
            >
              <TouchableOpacity
                onPress={() => setSelectedBadge(badge)}
                style={[
                  styles.badgeCard,
                  {
                    backgroundColor: colors.surface,
                    opacity: badge.earned ? 1 : 0.6,
                  },
                  shadows.sm,
                ]}
              >
                <View
                  style={[
                    styles.badgeIconContainer,
                    {
                      backgroundColor: badge.earned ? badge.couleur + '20' : colors.background,
                    },
                  ]}
                >
                  <Ionicons
                    name={badge.icone as keyof typeof Ionicons.glyphMap}
                    size={32}
                    color={badge.earned ? badge.couleur : colors.textSecondary}
                  />
                  {badge.earned && (
                    <View style={[styles.badgeCheck, { backgroundColor: badge.couleur }]}>
                      <Ionicons name="checkmark" size={12} color="#FFF" />
                    </View>
                  )}
                </View>

                <Text
                  style={[
                    styles.badgeName,
                    { color: badge.earned ? colors.text : colors.textSecondary },
                  ]}
                  numberOfLines={2}
                >
                  {badge.nom}
                </Text>

                {/* Niveau du badge */}
                <View style={styles.badgeLevelContainer}>
                  {[...Array(4)].map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.badgeLevelDot,
                        {
                          backgroundColor: i < badge.niveau ? badge.couleur : colors.border,
                        },
                      ]}
                    />
                  ))}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderChallenges = () => {
    const dailyChallenges = challenges.filter(c => c.type_defi === 'quotidien');
    const weeklyChallenges = challenges.filter(c => c.type_defi === 'hebdomadaire');

    const renderChallengeCard = (challenge: Defi, index: number) => (
      <Animated.View
        key={challenge.defi_id}
        entering={FadeInDown.delay(index * 100)}
        style={[styles.challengeCard, { backgroundColor: colors.surface }, shadows.sm]}
      >
        <View style={styles.challengeHeader}>
          <View
            style={[styles.challengeIconContainer, { backgroundColor: challenge.couleur + '20' }]}
          >
            <Ionicons
              name={challenge.icone as keyof typeof Ionicons.glyphMap}
              size={24}
              color={challenge.couleur}
            />
          </View>
          <View style={styles.challengeInfo}>
            <Text style={[styles.challengeName, { color: colors.text }]}>{challenge.nom}</Text>
            <Text style={[styles.challengeDescription, { color: colors.textSecondary }]}>
              {challenge.description}
            </Text>
          </View>
          <View style={styles.challengeReward}>
            <Text style={[styles.challengePoints, { color: colors.primary }]}>
              +{challenge.points_recompense}
            </Text>
            <Text style={[styles.challengePointsLabel, { color: colors.textSecondary }]}>
              points
            </Text>
          </View>
        </View>

        <View style={styles.challengeProgress}>
          <View style={styles.challengeProgressInfo}>
            <Text style={[styles.challengeProgressText, { color: colors.text }]}>
              {challenge.progression_actuelle}/{challenge.objectif_valeur}
            </Text>
            <Text style={[styles.challengeTimeRemaining, { color: colors.textSecondary }]}>
              {badgesService.formatTimeRemaining(challenge.temps_restant)}
            </Text>
          </View>
          <View style={[styles.challengeProgressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.challengeProgressFill,
                {
                  backgroundColor: challenge.couleur,
                  width: `${Math.min(challenge.pourcentage_complete, 100)}%`,
                },
              ]}
            />
          </View>
        </View>
      </Animated.View>
    );

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Défis quotidiens */}
        {dailyChallenges.length > 0 && (
          <View style={styles.challengeSection}>
            <View style={styles.challengeSectionHeader}>
              <Ionicons name="today" size={24} color={colors.primary} />
              <Text style={[styles.challengeSectionTitle, { color: colors.text }]}>
                Défis quotidiens
              </Text>
              <View style={[styles.challengeCount, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.challengeCountText, { color: colors.primary }]}>
                  {dailyChallenges.length}
                </Text>
              </View>
            </View>
            {dailyChallenges.map((challenge, index) => renderChallengeCard(challenge, index))}
          </View>
        )}

        {/* Défis hebdomadaires */}
        {weeklyChallenges.length > 0 && (
          <View style={styles.challengeSection}>
            <View style={styles.challengeSectionHeader}>
              <Ionicons name="calendar" size={24} color={colors.warning} />
              <Text style={[styles.challengeSectionTitle, { color: colors.text }]}>
                Défis hebdomadaires
              </Text>
              <View style={[styles.challengeCount, { backgroundColor: colors.warning + '20' }]}>
                <Text style={[styles.challengeCountText, { color: colors.warning }]}>
                  {weeklyChallenges.length}
                </Text>
              </View>
            </View>
            {weeklyChallenges.map((challenge, index) => renderChallengeCard(challenge, index))}
          </View>
        )}

        {challenges.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Aucun défi disponible pour le moment
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderRank = () => {
    if (!rank) {
      return null;
    }

    const rankColors = {
      gradient: isDark ? ['#1F2937', '#111827'] : ['#F3F4F6', '#E5E7EB'],
    };

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={rankColors.gradient} style={[styles.rankCard, shadows.md]}>
          <View style={styles.rankHeader}>
            <Text style={[styles.rankTitle, { color: colors.text }]}>Votre rang actuel</Text>
            <View style={[styles.rankBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="trophy" size={24} color="#FFF" />
            </View>
          </View>

          <View style={styles.rankInfo}>
            <Text style={[styles.rankName, { color: colors.primary }]}>{rank.rang_actuel}</Text>
            <Text style={[styles.rankLevel, { color: colors.textSecondary }]}>
              Niveau {rank.niveau_actuel}
            </Text>
          </View>

          <View style={styles.rankProgressContainer}>
            <View style={styles.rankProgressInfo}>
              <Text style={[styles.rankProgressText, { color: colors.text }]}>
                {rank.points_actuels} points
              </Text>
              {rank.rang_suivant && (
                <Text style={[styles.rankNextText, { color: colors.textSecondary }]}>
                  Prochain: {rank.rang_suivant} ({rank.points_requis_suivant} pts)
                </Text>
              )}
            </View>
            <View style={[styles.rankProgressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.rankProgressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.min(rank.progression_rang, 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.rankProgressPercentage, { color: colors.primary }]}>
              {Math.round(rank.progression_rang)}%
            </Text>
          </View>

          {/* Avantages du rang */}
          {rank.avantages && (
            <View style={styles.rankAdvantages}>
              <Text style={[styles.rankAdvantagesTitle, { color: colors.text }]}>
                Avantages débloqués
              </Text>
              <View style={styles.rankAdvantagesList}>
                {rank.avantages.timer_bonus && (
                  <View style={[styles.rankAdvantageItem, { backgroundColor: colors.surface }]}>
                    <Ionicons name="time" size={20} color={colors.primary} />
                    <Text style={[styles.rankAdvantageText, { color: colors.text }]}>
                      +{rank.avantages.timer_bonus}s bonus temps
                    </Text>
                  </View>
                )}
                {rank.avantages.hints && (
                  <View style={[styles.rankAdvantageItem, { backgroundColor: colors.surface }]}>
                    <Ionicons name="bulb" size={20} color={colors.warning} />
                    <Text style={[styles.rankAdvantageText, { color: colors.text }]}>
                      {rank.avantages.hints} indices disponibles
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </LinearGradient>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement des récompenses...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeIn} style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Récompenses</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Badges, défis et progression
        </Text>
      </Animated.View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {renderTabButton('badges', 'Badges', 'medal')}
        {renderTabButton('challenges', 'Défis', 'flag')}
        {renderTabButton('rank', 'Rang', 'trophy')}
      </View>

      <View style={styles.content}>
        {selectedTab === 'badges' && renderBadges()}
        {selectedTab === 'challenges' && renderChallenges()}
        {selectedTab === 'rank' && renderRank()}
      </View>

      {/* Modal pour détails du badge */}
      <Modal
        visible={selectedBadge !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedBadge(null)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {selectedBadge && (
              <>
                <View
                  style={[styles.modalBadgeIcon, { backgroundColor: selectedBadge.couleur + '20' }]}
                >
                  <Ionicons
                    name={selectedBadge.icone as keyof typeof Ionicons.glyphMap}
                    size={48}
                    color={selectedBadge.couleur}
                  />
                </View>
                <Text style={[styles.modalBadgeName, { color: colors.text }]}>
                  {selectedBadge.nom}
                </Text>
                <Text style={[styles.modalBadgeDescription, { color: colors.textSecondary }]}>
                  {selectedBadge.description}
                </Text>
                {selectedBadge.earned && selectedBadge.date_obtention && (
                  <Text style={[styles.modalBadgeDate, { color: colors.primary }]}>
                    Obtenu le {new Date(selectedBadge.date_obtention).toLocaleDateString('fr-FR')}
                  </Text>
                )}
                {!selectedBadge.earned && (
                  <Text style={[styles.modalBadgeLocked, { color: colors.warning }]}>
                    Badge verrouillé
                  </Text>
                )}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.body.fontSize,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.h1.fontSize,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: spacing.lg,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  tabButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  statsCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statsTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
  },
  statsBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statsBadgeText: {
    fontSize: typography.caption.fontSize,
    fontWeight: 'bold',
  },
  progressContainer: {
    gap: spacing.xs,
  },
  progressBar: {
    height: 8,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: typography.caption.fontSize,
  },
  categoriesContainer: {
    marginBottom: spacing.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: 1,
    gap: spacing.xs,
  },
  categoryChipText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  badgeWrapper: {
    width: (width - spacing.lg * 2 - spacing.md * 2) / 3,
  },
  badgeCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  badgeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeCheck: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeName: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    textAlign: 'center',
  },
  badgeLevelContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  badgeLevelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  challengeSection: {
    marginBottom: spacing.xl,
  },
  challengeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  challengeSectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
    flex: 1,
  },
  challengeCount: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  challengeCountText: {
    fontSize: typography.caption.fontSize,
    fontWeight: 'bold',
  },
  challengeCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  challengeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeInfo: {
    flex: 1,
  },
  challengeName: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    marginBottom: 2,
  },
  challengeDescription: {
    fontSize: typography.caption.fontSize,
  },
  challengeReward: {
    alignItems: 'center',
  },
  challengePoints: {
    fontSize: typography.h3.fontSize,
    fontWeight: 'bold',
  },
  challengePointsLabel: {
    fontSize: 10,
  },
  challengeProgress: {
    gap: spacing.xs,
  },
  challengeProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeProgressText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  challengeTimeRemaining: {
    fontSize: typography.caption.fontSize,
  },
  challengeProgressBar: {
    height: 6,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  challengeProgressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  rankCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
  },
  rankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  rankTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankInfo: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  rankName: {
    fontSize: typography.h1.fontSize,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  rankLevel: {
    fontSize: typography.body.fontSize,
  },
  rankProgressContainer: {
    gap: spacing.sm,
  },
  rankProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankProgressText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  rankNextText: {
    fontSize: typography.caption.fontSize,
  },
  rankProgressBar: {
    height: 12,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  rankProgressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  rankProgressPercentage: {
    fontSize: typography.caption.fontSize,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rankAdvantages: {
    marginTop: spacing.xl,
  },
  rankAdvantagesTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  rankAdvantagesList: {
    gap: spacing.sm,
  },
  rankAdvantageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  rankAdvantageText: {
    fontSize: typography.caption.fontSize,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 3,
  },
  emptyStateText: {
    fontSize: typography.body.fontSize,
    marginTop: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  modalBadgeIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  modalBadgeName: {
    fontSize: typography.h2.fontSize,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalBadgeDescription: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalBadgeDate: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  modalBadgeLocked: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
});
