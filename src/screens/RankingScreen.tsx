import React from /* eslint-disable react-native/no-inline-styles */ 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const RankingScreen = () => {
  const { colors } = useTheme();

  const mockRankings = [
    { rank: 1, name: 'Sophie Martin', score: 2850, avatar: '👩', trend: 'up' },
    { rank: 2, name: 'Lucas Dubois', score: 2720, avatar: '👨', trend: 'up' },
    { rank: 3, name: 'Emma Bernard', score: 2680, avatar: '👩‍🦰', trend: 'down' },
    { rank: 4, name: 'Thomas Petit', score: 2550, avatar: '🧑', trend: 'stable' },
    { rank: 5, name: 'Marie Durand', score: 2480, avatar: '👩‍🦱', trend: 'up' },
  ];

  const getRankColor = (rank: number) => {
    if (rank === 1) {
      return '#FFD700';
    }
    if (rank === 2) {
      return '#C0C0C0';
    }
    if (rank === 3) {
      return '#CD7F32';
    }
    return colors.textSecondary;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Classement</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Top 100 des candidats
        </Text>
      </View>

      <View style={[styles.podiumContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.podiumItem}>
          <Text style={[styles.podiumRank, { color: '#C0C0C0' }]}>2</Text>
          <View style={[styles.podiumAvatar, { backgroundColor: colors.background }]}>
            <Text style={styles.podiumEmoji}>👨</Text>
          </View>
          <Text style={[styles.podiumName, { color: colors.text }]}>Lucas</Text>
          <Text style={[styles.podiumScore, { color: colors.primary }]}>2720</Text>
        </View>

        <View style={[styles.podiumItem, { marginTop: -20 }]}>
          <View style={styles.crownContainer}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
          </View>
          <Text style={[styles.podiumRank, { color: '#FFD700' }]}>1</Text>
          <View
            style={[
              styles.podiumAvatar,
              styles.podiumAvatarFirst,
              { backgroundColor: colors.background },
            ]}
          >
            <Text style={styles.podiumEmoji}>👩</Text>
          </View>
          <Text style={[styles.podiumName, { color: colors.text }]}>Sophie</Text>
          <Text style={[styles.podiumScore, { color: colors.primary }]}>2850</Text>
        </View>

        <View style={styles.podiumItem}>
          <Text style={[styles.podiumRank, { color: '#CD7F32' }]}>3</Text>
          <View style={[styles.podiumAvatar, { backgroundColor: colors.background }]}>
            <Text style={styles.podiumEmoji}>👩‍🦰</Text>
          </View>
          <Text style={[styles.podiumName, { color: colors.text }]}>Emma</Text>
          <Text style={[styles.podiumScore, { color: colors.primary }]}>2680</Text>
        </View>
      </View>

      <View style={styles.listContainer}>
        {mockRankings.map(player => (
          <View key={player.rank} style={[styles.rankItem, { backgroundColor: colors.surface }]}>
            <View style={styles.rankLeft}>
              <Text style={[styles.rankNumber, { color: getRankColor(player.rank) }]}>
                #{player.rank}
              </Text>
              <View style={[styles.avatar, { backgroundColor: colors.background }]}>
                <Text style={styles.avatarEmoji}>{player.avatar}</Text>
              </View>
              <View>
                <Text style={[styles.playerName, { color: colors.text }]}>{player.name}</Text>
                <Text style={[styles.playerScore, { color: colors.textSecondary }]}>
                  {player.score} points
                </Text>
              </View>
            </View>
            <View style={styles.rankRight}>
              {player.trend === 'up' && <Ionicons name="arrow-up" size={20} color="#4CAF50" />}
              {player.trend === 'down' && <Ionicons name="arrow-down" size={20} color="#F44336" />}
              {player.trend === 'stable' && (
                <Ionicons name="remove" size={20} color={colors.textSecondary} />
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.comingSoonBanner, { backgroundColor: colors.warning }]}>
        <Ionicons name="construct" size={24} color="#FFF" />
        <Text style={styles.comingSoonText}>Fonctionnalité complète bientôt disponible</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    margin: 20,
    paddingVertical: 30,
    borderRadius: 20,
  },
  podiumItem: {
    alignItems: 'center',
  },
  crownContainer: {
    marginBottom: 8,
  },
  podiumRank: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  podiumAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  podiumAvatarFirst: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  podiumEmoji: {
    fontSize: 30,
  },
  podiumName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  podiumScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 20,
    gap: 12,
  },
  rankItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 35,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  playerScore: {
    fontSize: 14,
  },
  rankRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comingSoonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});
