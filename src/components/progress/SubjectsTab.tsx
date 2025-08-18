import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { shadows, borderRadius } from '../../styles/theme';
import { progressService, ThemeStats } from '../../services/progressService';

interface SubjectData {
  id: number;
  name: string;
  totalQuestions: number;
  correctAnswers: number;
  successRate: number;
  lastPracticed: string;
  icon: string;
  color: string;
}

interface SubjectsTabProps {
  userId: string;
}

export const SubjectsTab: React.FC<SubjectsTabProps> = ({ userId }) => {
  const { colors } = useTheme();
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchThemeStats();
  }, [userId]);

  const fetchThemeStats = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const stats = await progressService.getUserStatsByTheme(userId);
      
      const formattedSubjects = stats.map((stat: ThemeStats) => ({
        id: stat.theme_id,
        name: stat.theme_nom,
        totalQuestions: stat.total_questions,
        correctAnswers: stat.questions_correctes,
        successRate: Number(stat.taux_reussite),
        lastPracticed: progressService.formatTimeAgo(stat.derniere_session),
        icon: progressService.getIconForTheme(stat.theme_nom),
        color: stat.theme_couleur || '#3B82F6',
      }));

      setSubjects(formattedSubjects);
    } catch (error) {
      console.error('Error fetching theme stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const CircularProgress = ({ percentage, color }: { percentage: number; color: string }) => {
    const radius = 35;
    const strokeWidth = 6;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <Svg width={80} height={80}>
        <Circle
          cx={40}
          cy={40}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={40}
          cy={40}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
        />
      </Svg>
    );
  };

  const getPerformanceLevel = (rate: number) => {
    if (rate >= 90) return { text: 'Excellent', color: '#10B981' };
    if (rate >= 75) return { text: 'Bon', color: '#3B82F6' };
    if (rate >= 60) return { text: 'Moyen', color: '#F59E0B' };
    return { text: 'À améliorer', color: '#EF4444' };
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Chargement des statistiques...
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
      {/* Résumé global */}
      <View style={[styles.summaryCard, { backgroundColor: colors.surface }, shadows.sm]}>
        <Text style={[styles.summaryTitle, { color: colors.text }]}>Performance Globale</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStatItem}>
            <Text style={[styles.summaryStatValue, { color: colors.primary }]}>
              {subjects.reduce((acc, s) => acc + s.totalQuestions, 0)}
            </Text>
            <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
              Questions totales
            </Text>
          </View>
          <View style={styles.summaryStatItem}>
            <Text style={[styles.summaryStatValue, { color: colors.primary }]}>
              {subjects.length > 0 ? Math.round(
                subjects.reduce((acc, s) => acc + s.successRate, 0) / subjects.length
              ) : 0}%
            </Text>
            <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
              Taux moyen
            </Text>
          </View>
          <View style={styles.summaryStatItem}>
            <Text style={[styles.summaryStatValue, { color: colors.primary }]}>
              {subjects.length}
            </Text>
            <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
              Matières
            </Text>
          </View>
        </View>
      </View>

      {/* Liste des matières */}
      {subjects.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }, shadows.sm]}>
          <Ionicons name="school-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            Aucune donnée disponible
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
            Commencez un entraînement pour voir vos statistiques
          </Text>
        </View>
      ) : (
        <View style={styles.subjectsGrid}>
          {subjects.map((subject, index) => {
          const performance = getPerformanceLevel(subject.successRate);
          return (
            <Animated.View
              key={subject.id}
              entering={FadeInDown.delay(index * 100)}
              style={styles.subjectWrapper}
            >
              <View style={[styles.subjectCard, { backgroundColor: colors.surface }, shadows.sm]}>
              <TouchableOpacity
                onPress={() => setSelectedSubject(subject)}
                activeOpacity={0.7}
              >
                <View style={styles.subjectHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: subject.color + '20' }]}>
                    <Ionicons name={subject.icon as any} size={24} color={subject.color} />
                  </View>
                  <View style={styles.progressContainer}>
                    <CircularProgress percentage={subject.successRate} color={subject.color} />
                    <Text style={[styles.percentageText, { color: colors.text }]}>
                      {subject.successRate}%
                    </Text>
                  </View>
                </View>

                <Text style={[styles.subjectName, { color: colors.text }]} numberOfLines={1}>
                  {subject.name}
                </Text>

                <View style={styles.subjectStats}>
                  <View style={styles.statRow}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.textSecondary} />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                      {subject.correctAnswers}/{subject.totalQuestions} réussies
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <Ionicons name="time" size={16} color={colors.textSecondary} />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                      {subject.lastPracticed}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.performanceBadge,
                    { backgroundColor: performance.color + '20' },
                  ]}
                >
                  <Text style={[styles.performanceText, { color: performance.color }]}>
                    {performance.text}
                  </Text>
                </View>
              </TouchableOpacity>
              </View>
            </Animated.View>
          );
        })}
        </View>
      )}

      {/* Recommandations */}
      {subjects.length > 0 && (
        <View style={[styles.recommendationCard, { backgroundColor: colors.surface }, shadows.sm]}>
          <View style={styles.recommendationHeader}>
            <Ionicons name="bulb" size={24} color={colors.warning} />
            <Text style={[styles.recommendationTitle, { color: colors.text }]}>
              Recommandation
            </Text>
          </View>
          <Text style={[styles.recommendationText, { color: colors.textSecondary }]}>
            {subjects.filter(s => s.successRate < 70).length > 0 ? (
              <>
                Concentrez-vous sur{' '}
                {subjects
                  .filter(s => s.successRate < 70)
                  .slice(0, 2)
                  .map((s, i, arr) => (
                    <Text key={s.id}>
                      <Text style={{ fontWeight: 'bold' }}>{s.name}</Text>
                      {i < arr.length - 1 ? ' et ' : ''}
                    </Text>
                  ))}{' '}
                pour améliorer votre score global.
              </>
            ) : (
              'Excellent travail ! Continuez à maintenir vos bonnes performances.'
            )}
          </Text>
        </View>
      )}
      
      {/* Espace pour la tabbar */}
      <View style={{ height: 100 }} />
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
  subjectWrapper: {
    width: '47%',
    marginBottom: 5,
  },
  summaryCard: {
    margin: 20,
    padding: 20,
    borderRadius: borderRadius.xl,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: 12,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    gap: 10,
  },
  subjectCard: {
    padding: 16,
    borderRadius: borderRadius.lg,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  subjectStats: {
    gap: 4,
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  performanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  performanceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  recommendationCard: {
    margin: 20,
    padding: 16,
    borderRadius: borderRadius.lg,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
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
  emptyState: {
    margin: 20,
    padding: 40,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});