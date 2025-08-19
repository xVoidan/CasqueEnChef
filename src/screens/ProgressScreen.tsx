import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { progressService } from '../services/progressService';
import { useAuth } from '../contexts/AuthContext';
import { SegmentedControl } from '../components/progress/SegmentedControl';
import { OverviewTab } from '../components/progress/OverviewTab';
import { SubjectsTab } from '../components/progress/SubjectsTab';
import { HistoryTab } from '../components/progress/HistoryTab';
import { ObjectivesTab } from '../components/progress/ObjectivesTab';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';

export const ProgressScreen = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [weeklyData, setWeeklyData] = useState({
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0, 0],
      },
    ],
  });
  const [totalStats, setTotalStats] = useState({
    totalSessions: 0,
    totalQuestions: 0,
    averageScore: 0,
    totalTime: 0,
    streak: 0,
    bestScore: 0,
  });

  const segments = ['Global', 'Matières', 'Historique', 'Objectifs'];

  const fetchProgressData = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      // Récupérer les performances hebdomadaires
      const weeklyPerformance = await progressService.getWeeklyPerformance(user.id);

      // Récupérer les objectifs et badges pour les stats globales
      const objectives = await progressService.getUserObjectivesAndBadges(user.id);

      if (weeklyPerformance && weeklyPerformance.length > 0) {
        // Transformer les données pour le graphique
        const weeklyScores = weeklyPerformance.map(day => day.score_moyen);

        setWeeklyData({
          labels: weeklyPerformance.map(day => day.jour_nom),
          datasets: [
            {
              data: weeklyScores,
            },
          ],
        });
      }

      if (objectives) {
        // Récupérer les sessions détaillées pour calculer le meilleur score
        const sessions = await progressService.getUserSessionsDetailed(user.id, 100);
        let bestScore = 0;

        if (sessions && sessions.length > 0) {
          bestScore = Math.max(...sessions.map(s => Number(s.score)));
        }

        // Calculer la moyenne globale basée sur toutes les sessions
        const globalAverage =
          sessions && sessions.length > 0
            ? Math.round(sessions.reduce((acc, s) => acc + Number(s.score), 0) / sessions.length)
            : 0;

        setTotalStats({
          totalSessions: objectives.total_sessions,
          totalQuestions: objectives.total_questions,
          averageScore: globalAverage,
          totalTime: Math.round(objectives.temps_aujourdhui / 60),
          streak: objectives.serie_actuelle,
          bestScore: Math.round(bestScore),
        });
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    }
  }, [user]);

  // Rafraîchir les données à chaque fois que l'écran devient visible
  useFocusEffect(
    useCallback(() => {
      if (user) {
        void fetchProgressData();
      }
    }, [user, fetchProgressData])
  );

  // Charger aussi les données au montage initial
  useEffect(() => {
    if (user) {
      void fetchProgressData();
    }
  }, [user, fetchProgressData]);

  const renderContent = () => {
    switch (selectedIndex) {
      case 0:
        return <OverviewTab weeklyData={weeklyData} totalStats={totalStats} />;
      case 1:
        return <SubjectsTab userId={user?.id ?? ''} />;
      case 2:
        return <HistoryTab userId={user?.id ?? ''} />;
      case 3:
        return <ObjectivesTab userId={user?.id ?? ''} />;
      default:
        return <OverviewTab weeklyData={weeklyData} totalStats={totalStats} />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeIn} style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Vos Progrès</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Suivez votre évolution et atteignez vos objectifs
        </Text>
      </Animated.View>

      <SegmentedControl
        segments={segments}
        selectedIndex={selectedIndex}
        onIndexChange={setSelectedIndex}
      />

      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
});
