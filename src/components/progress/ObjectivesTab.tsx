import React, {
  /* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */ useState,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { shadows, borderRadius } from '../../styles/theme';
import { progressService, UserObjectives } from '../../services/progressService';
import { COLORS } from '../../constants/styleConstants';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
  progress: number;
  maxProgress: number;
  earnedDate?: string;
  max?: number;
  radius?: number;
  strokeWidth?: number;
}

interface DailyObjective {
  id: string;
  title: string;
  current: number;
  target: number;
  icon: string;
  color: string;
}

interface ObjectivesTabProps {
  userId: string;
}

export const ObjectivesTab: React.FC<ObjectivesTabProps> = ({ userId }) => {
  const { colors } = useTheme();
  const [dailyObjectives, setDailyObjectives] = useState<DailyObjective[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [_objectivesData, setObjectivesData] = useState<UserObjectives | null>(null);

  useEffect(() => {
    void fetchObjectivesAndBadges();
  }, [userId]); // fetchObjectives is intentionally omitted

  const fetchObjectivesAndBadges = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const data = await progressService.getUserObjectivesAndBadges(userId);

      if (data) {
        setObjectivesData(data);

        // Configuration des objectifs quotidiens
        setDailyObjectives([
          {
            id: '1',
            title: 'Questions du jour',
            current: data.questions_aujourdhui,
            target: data.objectif_quotidien || 20,
            icon: 'help-circle',
            color: '#3B82F6',
          },
          {
            id: '2',
            title: "Temps d'étude",
            current: Math.floor(data.temps_aujourdhui / 60),
            target: 30,
            icon: 'time',
            color: '#10B981',
          },
          {
            id: '3',
            title: 'Taux de réussite',
            current: Math.round(data.taux_reussite_aujourdhui),
            target: 80,
            icon: 'checkmark-circle',
            color: '#F59E0B',
          },
        ]);

        // Configuration des badges
        const badgesList: Badge[] = [];
        Object.entries(data.badges_gagnes).forEach(([key, earned]) => {
          const badgeInfo = progressService.getBadgeInfo(key);
          badgesList.push({
            id: key,
            name: badgeInfo.name,
            description: badgeInfo.description,
            icon: badgeInfo.icon,
            color: badgeInfo.color,
            earned: earned,
            progress: earned ? 1 : 0,
            maxProgress: 1,
            earnedDate: earned ? new Date().toISOString() : undefined,
          });
        });
        setBadges(badgesList);

        setStreak(data.serie_actuelle);
        setBestStreak(data.meilleure_serie);
      }
    } catch (error) {
      console.error('Error fetching objectives and badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const CircularProgress = ({ progress, max, radius = 30, strokeWidth = 4, color }: Badge) => {
    const circumference = 2 * Math.PI * radius;
    const percentage = (progress / max) * 100;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <Svg width={radius * 2 + strokeWidth} height={radius * 2 + strokeWidth}>
        <Circle
          cx={radius + strokeWidth / 2}
          cy={radius + strokeWidth / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={radius + strokeWidth / 2}
          cy={radius + strokeWidth / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${radius + strokeWidth / 2} ${radius + strokeWidth / 2})`}
        />
      </Svg>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Chargement des objectifs...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Série actuelle */}
      <Animated.View
        entering={FadeInDown}
        style={[styles.streakCard, { backgroundColor: colors.surface }, shadows.sm]}
      >
        <View style={styles.streakHeader}>
          <View style={[styles.streakIconContainer, { backgroundColor: '#EF4444' + '20' }]}>
            <Ionicons name="flame" size={32} color="#EF4444" />
          </View>
          <View style={styles.streakInfo}>
            <Text style={[styles.streakTitle, { color: colors.text }]}>Série en cours</Text>
            <View style={styles.streakNumbers}>
              <Text style={[styles.streakCurrent, styles.streakCurrentColor]}>{streak}</Text>
              <Text style={[styles.streakDays, { color: colors.text }]}> jours</Text>
            </View>
            <Text style={[styles.streakBest, { color: colors.textSecondary }]}>
              Record : {bestStreak} jours
            </Text>
          </View>
        </View>

        <View style={styles.weekIndicator}>
          {[...Array(7)].map((_, index) => {
            const isActive = index < streak;
            return (
              <View
                key={index}
                style={[
                  styles.dayIndicator,
                  isActive ? styles.dayIndicatorActive : { backgroundColor: colors.border },
                ]}
              />
            );
          })}
        </View>
      </Animated.View>

      {/* Objectifs quotidiens */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Objectifs du jour</Text>
        <View style={styles.objectivesContainer}>
          {dailyObjectives.map((objective, index) => {
            const progress = (objective.current / objective.target) * 100;
            const isCompleted = objective.current >= objective.target;

            return (
              <Animated.View key={objective.id} entering={FadeInDown.delay(index * 100)}>
                <View
                  style={[styles.objectiveCard, { backgroundColor: colors.surface }, shadows.sm]}
                >
                  <View style={styles.objectiveHeader}>
                    <View
                      style={[styles.objectiveIcon, { backgroundColor: objective.color + '20' }]}
                    >
                      <Ionicons name={objective.icon as any} size={24} color={objective.color} />
                    </View>
                    {isCompleted && (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      </View>
                    )}
                  </View>

                  <Text style={[styles.objectiveTitle, { color: colors.text }]}>
                    {objective.title}
                  </Text>

                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                      <Animated.View
                        style={[
                          styles.progressFill,
                          isCompleted
                            ? styles.iconContainerCompleted
                            : { backgroundColor: objective.color },
                          {
                            width: `${Math.min(progress, 100)}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                      {objective.current}/{objective.target}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {/* Badges */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Badges & Récompenses</Text>
        <View style={styles.badgesGrid}>
          {badges.map((badge, index) => (
            <Animated.View
              key={badge.id}
              entering={FadeInDown.delay(100 + index * 50)}
              style={styles.badgeWrapper}
            >
              <View
                style={[
                  styles.badgeCard,
                  {
                    backgroundColor: colors.surface,
                  },
                  badge.earned ? styles.badgeEarned : styles.badgeNotEarned,
                  shadows.sm,
                ]}
              >
                <TouchableOpacity activeOpacity={0.8}>
                  <View style={styles.badgeContent}>
                    <View
                      style={[
                        styles.badgeIconContainer,
                        {
                          backgroundColor: badge.earned ? badge.color + '20' : colors.surface,
                        },
                      ]}
                    >
                      {badge.earned ? (
                        <Ionicons name={badge.icon as any} size={32} color={badge.color} />
                      ) : (
                        <View style={styles.badgeProgressContainer}>
                          <CircularProgress
                            progress={badge.progress}
                            max={badge.maxProgress}
                            color={badge.color}
                          />
                          <Text style={[styles.badgeProgressText, { color: colors.text }]}>
                            {Math.round((badge.progress / badge.maxProgress) * 100)}%
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text
                      style={[
                        styles.badgeName,
                        { color: badge.earned ? colors.text : colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {badge.name}
                    </Text>

                    <Text
                      style={[styles.badgeDescription, { color: colors.textSecondary }]}
                      numberOfLines={2}
                    >
                      {badge.description}
                    </Text>

                    {badge.earned && badge.earnedDate && (
                      <Text style={[styles.badgeDate, { color: badge.color }]}>✓ Obtenu</Text>
                    )}

                    {!badge.earned && (
                      <Text style={[styles.badgeProgress, { color: colors.textSecondary }]}>
                        {badge.progress}/{badge.maxProgress}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Espace pour la tabbar */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  streakCard: {
    margin: 20,
    padding: 20,
    borderRadius: borderRadius.xl,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  streakIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  streakNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  streakCurrent: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  streakDays: {
    fontSize: 18,
  },
  streakBest: {
    fontSize: 12,
    marginTop: 4,
  },
  weekIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayIndicator: {
    flex: 1,
    height: 6,
    borderRadius: borderRadius.xs,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  objectivesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  objectiveCard: {
    padding: 16,
    borderRadius: borderRadius.lg,
  },
  objectiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  objectiveIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  objectiveTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: borderRadius.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.xs,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'right',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    gap: 10,
  },
  badgeWrapper: {
    width: '30%',
  },
  badgeCard: {
    padding: 12,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  badgeContent: {
    alignItems: 'center',
  },
  badgeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeProgressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeProgressText: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  badgeDescription: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 4,
  },
  badgeDate: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeProgress: {
    fontSize: 11,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  streakCurrentColor: {
    color: COLORS.error,
  },
  dayIndicatorActive: {
    backgroundColor: COLORS.error,
  },
  iconContainerCompleted: {
    backgroundColor: COLORS.success,
  },
  badgeEarned: {
    opacity: 1,
  },
  badgeNotEarned: {
    opacity: 0.7,
  },
  bottomSpacer: {
    height: 120,
  },
});
