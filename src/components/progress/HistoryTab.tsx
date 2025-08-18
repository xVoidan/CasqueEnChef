import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { progressService, SessionDetailed } from '../../services/progressService';
import { shadows, borderRadius } from '../../styles/theme';

interface SessionData {
  id: number;
  created_at: string;
  nombre_questions: number;
  nombre_reponses_correctes: number;
  temps_total: number;
  themes: string[];
  sous_themes: string[];
  score: number;
  type_session: string;
  statut: string;
  niveau_moyen: number;
}

interface HistoryTabProps {
  userId: string;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ userId }) => {
  const { colors } = useTheme();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

  useEffect(() => {
    fetchSessions();
  }, [userId]);

  const fetchSessions = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const detailedSessions = await progressService.getUserSessionsDetailed(userId, 50);
      
      const formattedSessions = detailedSessions.map((session: SessionDetailed) => ({
        id: session.session_id,
        created_at: session.created_at,
        nombre_questions: session.nombre_questions,
        nombre_reponses_correctes: session.nombre_reponses_correctes,
        temps_total: session.temps_total,
        themes: session.themes || [],
        sous_themes: session.sous_themes || [],
        score: Number(session.score),
        type_session: session.type_session,
        statut: session.statut,
        niveau_moyen: Number(session.niveau_moyen),
      }));

      setSessions(formattedSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Il y a moins d\'une heure';
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    if (diffInHours < 48) return 'Hier';
    if (diffInHours < 168) return `Il y a ${Math.floor(diffInHours / 24)} jours`;
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    if (filter === 'success') return session.score >= 70;
    if (filter === 'failed') return session.score < 70;
    return true;
  });

  const renderSession = ({ item, index }: { item: SessionData; index: number }) => {
    const scoreColor = getScoreColor(item.score);

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50)}
      >
        <View style={[styles.sessionCard, { backgroundColor: colors.surface }, shadows.sm]}>
        <TouchableOpacity
          onPress={() => setSelectedSession(item)}
          activeOpacity={0.7}
        >
          <View style={styles.sessionHeader}>
            <View style={styles.sessionInfo}>
              <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>
                {formatDate(item.created_at)}
              </Text>
              <View style={styles.themeTags}>
                {item.themes.slice(0, 2).map((theme, idx) => (
                  <View key={idx} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.tagText, { color: colors.primary }]}>
                      {theme}
                    </Text>
                  </View>
                ))}
                {item.themes.length > 2 && (
                  <Text style={[styles.moreThemes, { color: colors.textSecondary }]}>
                    +{item.themes.length - 2}
                  </Text>
                )}
              </View>
            </View>
            <View style={[styles.scoreCircle, { backgroundColor: scoreColor + '20' }]}>
              <Text style={[styles.scoreText, { color: scoreColor }]}>
                {item.score}%
              </Text>
            </View>
          </View>

          <View style={styles.sessionStats}>
            <View style={styles.statItem}>
              <Ionicons name="help-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.text }]}>
                {item.nombre_reponses_correctes}/{item.nombre_questions}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.text }]}>
                {formatDuration(item.temps_total)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="options-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.text }]}>
                {item.type_session}
              </Text>
            </View>
          </View>

          {item.statut === 'abandonnee' && (
            <View style={[styles.abandonedBadge, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.abandonedText, { color: colors.error }]}>
                Session abandonnée
              </Text>
            </View>
          )}
        </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filtres */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          onPress={() => setFilter('all')}
          style={[
            styles.filterButton,
            filter === 'all' && { backgroundColor: colors.primary },
            filter !== 'all' && { backgroundColor: colors.surface },
          ]}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'all' ? { color: '#FFFFFF' } : { color: colors.text },
            ]}
          >
            Toutes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter('success')}
          style={[
            styles.filterButton,
            filter === 'success' && { backgroundColor: '#10B981' },
            filter !== 'success' && { backgroundColor: colors.surface },
          ]}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'success' ? { color: '#FFFFFF' } : { color: colors.text },
            ]}
          >
            Réussies
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter('failed')}
          style={[
            styles.filterButton,
            filter === 'failed' && { backgroundColor: '#EF4444' },
            filter !== 'failed' && { backgroundColor: colors.surface },
          ]}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'failed' ? { color: '#FFFFFF' } : { color: colors.text },
            ]}
          >
            Échouées
          </Text>
        </TouchableOpacity>
      </View>

      {/* Liste des sessions */}
      <FlatList
        data={filteredSessions}
        renderItem={renderSession}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Aucune session trouvée
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Commencez un entraînement pour voir votre historique
            </Text>
          </View>
        }
      />

      {/* Modal de détails */}
      <Modal
        visible={selectedSession !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedSession(null)}
      >
        {selectedSession && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Détails de la session
                </Text>
                <TouchableOpacity onPress={() => setSelectedSession(null)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <Text style={[styles.modalDate, { color: colors.textSecondary }]}>
                  {new Date(selectedSession.created_at).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>

                <View style={styles.modalStats}>
                  <View style={styles.modalStatItem}>
                    <Text style={[styles.modalStatLabel, { color: colors.textSecondary }]}>
                      Score final
                    </Text>
                    <Text
                      style={[
                        styles.modalStatValue,
                        { color: getScoreColor(selectedSession.score) },
                      ]}
                    >
                      {selectedSession.score}%
                    </Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={[styles.modalStatLabel, { color: colors.textSecondary }]}>
                      Questions
                    </Text>
                    <Text style={[styles.modalStatValue, { color: colors.text }]}>
                      {selectedSession.nombre_questions}
                    </Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={[styles.modalStatLabel, { color: colors.textSecondary }]}>
                      Durée
                    </Text>
                    <Text style={[styles.modalStatValue, { color: colors.text }]}>
                      {formatDuration(selectedSession.temps_total)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.reviewButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setSelectedSession(null);
                    // Navigation vers la révision
                  }}
                >
                  <Text style={styles.reviewButtonText}>Revoir les questions</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  sessionCard: {
    padding: 16,
    borderRadius: borderRadius.lg,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 12,
    marginBottom: 6,
  },
  themeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  moreThemes: {
    fontSize: 11,
    marginLeft: 4,
  },
  scoreCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sessionStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
  },
  abandonedBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  abandonedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: 24,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    gap: 20,
  },
  modalDate: {
    fontSize: 14,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  modalStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  reviewButton: {
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: 10,
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});