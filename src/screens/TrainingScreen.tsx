import React from /* eslint-disable react-native/no-inline-styles */ 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, typography, borderRadius, shadows } from '../styles/theme';
import { TrainingStackScreenProps } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';

interface Training {
  id: string;
  title: string;
  category: string;
  duration: string;
  difficulty: 'Débutant' | 'Intermédiaire' | 'Avancé';
  progress: number;
  icon: string;
}

export const TrainingScreen: React.FC<TrainingStackScreenProps<'TrainingList'>> = ({
  navigation,
}) => {
  const { colors } = useTheme();

  const handleStartTraining = () => {
    navigation.navigate('TrainingConfig');
  };

  const trainings: Training[] = [
    {
      id: '1',
      title: 'Premiers secours',
      category: 'Médical',
      duration: '2h30',
      difficulty: 'Débutant',
      progress: 100,
      icon: 'medkit-outline',
    },
    {
      id: '2',
      title: 'Incendie structure',
      category: 'Feu',
      duration: '4h',
      difficulty: 'Intermédiaire',
      progress: 75,
      icon: 'flame-outline',
    },
    {
      id: '3',
      title: 'Sauvetage aquatique',
      category: 'Sauvetage',
      duration: '3h',
      difficulty: 'Avancé',
      progress: 30,
      icon: 'water-outline',
    },
    {
      id: '4',
      title: 'Matières dangereuses',
      category: 'Risques',
      duration: '5h',
      difficulty: 'Avancé',
      progress: 0,
      icon: 'warning-outline',
    },
  ];

  const getDifficultyColor = (difficulty: Training['difficulty']) => {
    switch (difficulty) {
      case 'Débutant':
        return '#10B981';
      case 'Intermédiaire':
        return '#F59E0B';
      case 'Avancé':
        return '#EF4444';
    }
  };

  const renderTrainingCard = ({ item }: { item: Training }) => (
    <TouchableOpacity
      style={[styles.trainingCard, { backgroundColor: colors.surface }, shadows.sm]}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
          <Ionicons
            name={item.icon as keyof typeof Ionicons.glyphMap}
            size={24}
            color={colors.primary}
          />
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.trainingTitle, { color: colors.text }]}>{item.title}</Text>
          <View style={styles.metaContainer}>
            <Text style={[styles.category, { color: colors.textSecondary }]}>{item.category}</Text>
            <Text style={[styles.duration, { color: colors.textSecondary }]}>{item.duration}</Text>
          </View>
        </View>
        <View style={styles.difficultyBadge}>
          <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
            {item.difficulty}
          </Text>
        </View>
      </View>
      {item.progress > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Progression</Text>
            <Text style={[styles.progressValue, { color: colors.text }]}>{item.progress}%</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: item.progress === 100 ? '#10B981' : colors.primary,
                  width: `${item.progress}%`,
                },
              ]}
            />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Formations</Text>
        <TouchableOpacity onPress={handleStartTraining}>
          <Ionicons name="play-circle-outline" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.quickStartCard, { backgroundColor: colors.primary }]}
        onPress={handleStartTraining}
        activeOpacity={0.8}
      >
        <View style={styles.quickStartContent}>
          <Ionicons name="rocket-outline" size={32} color="#FFF" />
          <View style={styles.quickStartText}>
            <Text style={styles.quickStartTitle}>Entraînement Libre</Text>
            <Text style={styles.quickStartSubtitle}>Commencer une session personnalisée</Text>
          </View>
        </View>
        <Ionicons name="arrow-forward" size={24} color="#FFF" />
      </TouchableOpacity>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>12</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Complétées</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statNumber, { color: '#F59E0B' }]}>3</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>En cours</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statNumber, { color: '#3B82F6' }]}>5</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>À venir</Text>
        </View>
      </View>

      <FlatList
        data={trainings}
        renderItem={renderTrainingCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  quickStartCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.md,
  },
  quickStartContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickStartText: {
    marginLeft: spacing.md,
  },
  quickStartTitle: {
    ...typography.bodyBold,
    color: '#FFF',
    marginBottom: spacing.xs,
  },
  quickStartSubtitle: {
    ...typography.small,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
  },
  statNumber: {
    ...typography.h3,
  },
  statLabel: {
    ...typography.small,
    marginTop: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  trainingCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  trainingTitle: {
    ...typography.bodyBold,
    marginBottom: spacing.xs,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    ...typography.caption,
    marginRight: spacing.md,
  },
  duration: {
    ...typography.caption,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  difficultyText: {
    ...typography.small,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    ...typography.small,
  },
  progressValue: {
    ...typography.small,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
});
