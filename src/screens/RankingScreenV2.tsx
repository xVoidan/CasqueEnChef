import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { rankingService, RankingUser, UserPosition } from '../services/rankingService';
import {
  GRADES_POMPIERS,
  getGradeByPoints,
  getProgressToNextGrade,
} from '../constants/gradesPompiers';

type RankingTab = 'global' | 'hebdomadaire' | 'mensuel' | 'theme';

export const RankingScreenV2 = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<RankingTab>('global');
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [_searchResults, setSearchResults] = useState<RankingUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<RankingUser | null>(null);
  const [defiModalVisible, setDefiModalVisible] = useState(false);

  // Charger les données
  const loadRankings = useCallback(async () => {
    try {
      setLoading(true);
      let data: RankingUser[] = [];

      switch (selectedTab) {
        case 'global':
          data = await rankingService.getGlobalRanking();
          break;
        case 'hebdomadaire':
          data = await rankingService.getWeeklyRanking();
          break;
        case 'mensuel':
          data = await rankingService.getMonthlyRanking();
          break;
        default:
          data = await rankingService.getGlobalRanking();
      }

      setRankings(data);

      // Charger la position de l'utilisateur
      if (user) {
        const positions = await rankingService.getUserPositions(user.id);
        setUserPositions(positions);
      }
    } catch (error) {
      console.error('Erreur chargement classement:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTab, user]);

  useEffect(() => {
    void loadRankings();
  }, [loadRankings]);

  // Recherche d'utilisateurs
  const handleSearch = () => {
    void (async () => {
      if (searchTerm.length < 2) {
        return;
      }

      try {
        const results = await rankingService.searchUserInRanking(searchTerm);
        setSearchResults(results);
      } catch (error) {
        console.error('Erreur recherche:', error);
      }
    })();
  };

  // Défier un utilisateur
  const handleChallenge = (challengedUser: RankingUser) => {
    setSelectedUser(challengedUser);
    setDefiModalVisible(true);
  };

  const sendChallenge = async () => {
    if (!user || !selectedUser) {
      return;
    }

    try {
      // Créer le défi via le service
      Alert.alert(
        'Défi envoyé !',
        `Vous avez défié ${selectedUser.username}. Il recevra une notification.`,
        [{ text: 'OK' }]
      );
      setDefiModalVisible(false);
    } catch {
      Alert.alert('Erreur', "Impossible d'envoyer le défi");
    }
  };

  // Obtenir la couleur selon le rang
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

  // Obtenir l'icône d'évolution
  const getEvolutionIcon = (evolution?: string) => {
    switch (evolution) {
      case 'up':
        return <Ionicons name="arrow-up" size={16} color="#4CAF50" />;
      case 'down':
        return <Ionicons name="arrow-down" size={16} color="#F44336" />;
      case 'new':
        return <Text style={styles.newBadge}>NEW</Text>;
      default:
        return <Ionicons name="remove" size={16} color={colors.textSecondary} />;
    }
  };

  // Composant pour afficher le grade
  const GradeBadge = ({ gradeId, points }: { gradeId?: number; points?: number }) => {
    const grade = gradeId ? GRADES_POMPIERS[gradeId - 1] : getGradeByPoints(points || 0);
    const progress = getProgressToNextGrade(points || 0);

    return (
      <View style={styles.gradeContainer}>
        <Image source={grade.icon} style={styles.gradeIcon} />
        <View style={styles.gradeInfo}>
          <Text style={[styles.gradeName, { color: grade.couleur }]}>{grade.nom}</Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${progress}%`, backgroundColor: grade.couleur },
              ]}
            />
          </View>
        </View>
      </View>
    );
  };

  // Composant Podium
  const Podium = () => {
    const top3 = rankings.slice(0, 3);
    if (top3.length < 3) {
      return null;
    }

    const orderedForPodium = [top3[1], top3[0], top3[2]]; // 2, 1, 3

    return (
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.podiumContainer}>
        {orderedForPodium.map((player, index) => {
          const actualRank = index === 1 ? 1 : index === 0 ? 2 : 3;
          const isFirst = actualRank === 1;

          return (
            <View
              key={player.user_id}
              style={[styles.podiumItem, isFirst && styles.podiumItemFirst]}
            >
              {isFirst && (
                <Ionicons name="trophy" size={28} color="#FFD700" style={styles.trophy} />
              )}
              <Text style={[styles.podiumRank, { color: getRankColor(actualRank) }]}>
                {actualRank}
              </Text>
              {player.avatar_url ? (
                <Image source={{ uri: player.avatar_url }} style={styles.podiumAvatar} />
              ) : (
                <View style={[styles.podiumAvatar, { backgroundColor: colors.surface }]}>
                  <Text style={styles.avatarInitial}>
                    {player.username?.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>
                {player.username}
              </Text>
              <Text style={[styles.podiumScore, { color: colors.primary }]}>
                {player.points_total || player.points_periode} pts
              </Text>
              <GradeBadge
                gradeId={player.grade_id}
                points={player.points_total || player.points_periode}
              />
            </View>
          );
        })}
      </LinearGradient>
    );
  };

  // Composant pour la position de l'utilisateur
  const UserPositionCard = () => {
    const position = userPositions.find(p => {
      if (selectedTab === 'hebdomadaire') {
        return p.type_classement === 'hebdomadaire';
      }
      if (selectedTab === 'mensuel') {
        return p.type_classement === 'mensuel';
      }
      return p.type_classement === 'global';
    });

    if (!position) {
      return null;
    }

    return (
      <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.userPositionCard}>
        <View style={styles.userPositionContent}>
          <Text style={styles.userPositionTitle}>Votre position</Text>
          <View style={styles.userPositionStats}>
            <View style={styles.userPositionStat}>
              <Text style={styles.userPositionRank}>#{position.rang}</Text>
              <Text style={styles.userPositionLabel}>Rang</Text>
            </View>
            <View style={styles.userPositionStat}>
              <Text style={styles.userPositionRank}>{position.points}</Text>
              <Text style={styles.userPositionLabel}>Points</Text>
            </View>
            <View style={styles.userPositionStat}>
              <Text style={styles.userPositionRank}>
                {Math.round((position.rang / position.total_participants) * 100)}%
              </Text>
              <Text style={styles.userPositionLabel}>Top</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  };

  // Rendu d'un item de classement
  const renderRankingItem = ({ item }: { item: RankingUser }) => {
    const isCurrentUser = item.est_utilisateur_actuel;

    return (
      <TouchableOpacity
        style={[
          styles.rankItem,
          { backgroundColor: colors.surface },
          isCurrentUser && styles.currentUserItem,
        ]}
        onPress={() => !isCurrentUser && handleChallenge(item)}
      >
        <View style={styles.rankLeft}>
          <Text style={[styles.rankNumber, { color: getRankColor(item.rang) }]}>#{item.rang}</Text>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.background }]}>
              <Text style={styles.avatarInitial}>{item.username?.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.playerInfo}>
            <Text style={[styles.playerName, { color: colors.text }]}>
              {item.username}
              {isCurrentUser && ' (Vous)'}
            </Text>
            <Text style={[styles.playerScore, { color: colors.textSecondary }]}>
              {item.points_total || item.points_periode} points
            </Text>
          </View>
        </View>
        <View style={styles.rankRight}>
          <GradeBadge gradeId={item.grade_id} points={item.points_total || item.points_periode} />
          {getEvolutionIcon(item.evolution)}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Classement</Text>
        <TouchableOpacity
          onPress={() => setSearchVisible(!searchVisible)}
          style={styles.searchButton}
        >
          <Ionicons name="search" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Barre de recherche */}
      {searchVisible && (
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.text }]}
            placeholder="Rechercher un joueur..."
            placeholderTextColor={colors.textSecondary}
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={handleSearch}
          />
        </View>
      )}

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        {(['global', 'hebdomadaire', 'mensuel'] as RankingTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              selectedTab === tab && styles.activeTab,
              selectedTab === tab && { backgroundColor: colors.primary },
            ]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: selectedTab === tab ? '#FFF' : colors.textSecondary },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Position de l'utilisateur */}
      {user && <UserPositionCard />}

      {/* Contenu principal */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void loadRankings();
              }}
              colors={[colors.primary]}
            />
          }
        >
          {/* Podium pour le top 3 */}
          {rankings.length >= 3 && <Podium />}

          {/* Liste des classements */}
          <FlatList
            data={rankings.slice(3)}
            renderItem={renderRankingItem}
            keyExtractor={item => item.user_id}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
          />
        </ScrollView>
      )}

      {/* Modal de défi */}
      <Modal
        visible={defiModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDefiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Défier {selectedUser?.username}
            </Text>
            <Text style={[styles.modalText, { color: colors.textSecondary }]}>
              Voulez-vous défier ce joueur dans un quiz ?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDefiModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => void sendChallenge()}
              >
                <Text style={styles.confirmButtonText}>Défier</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  searchButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
  },
  activeTab: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  userPositionCard: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },
  userPositionContent: {
    alignItems: 'center',
  },
  userPositionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  userPositionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  userPositionStat: {
    alignItems: 'center',
  },
  userPositionRank: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userPositionLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
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
    flex: 1,
  },
  podiumItemFirst: {
    marginBottom: 20,
  },
  trophy: {
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
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  podiumScore: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
  },
  rankItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  currentUserItem: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 45,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  playerInfo: {
    flex: 1,
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
    gap: 8,
  },
  gradeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gradeIcon: {
    width: 30,
    height: 30,
  },
  gradeInfo: {
    flex: 1,
  },
  gradeName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginTop: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  newBadge: {
    backgroundColor: '#4CAF50',
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  confirmButton: {},
  confirmButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
