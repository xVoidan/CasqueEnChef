import React from /* eslint-disable react-native/no-color-literals */ 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const RevisionScreen = () => {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Révision</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Choisissez votre mode de révision
        </Text>
      </View>

      <View style={styles.cardsContainer}>
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="document-text" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Texte</Text>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            Révisez avec des fiches et des documents
          </Text>
          <View style={[styles.comingSoon, { backgroundColor: colors.warning }]}>
            <Text style={styles.comingSoonText}>Bientôt disponible</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="play-circle" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Vidéo</Text>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            Apprenez avec des vidéos explicatives
          </Text>
          <View style={[styles.comingSoon, { backgroundColor: colors.warning }]}>
            <Text style={styles.comingSoonText}>Bientôt disponible</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="headset" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Podcast</Text>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            Écoutez des podcasts éducatifs
          </Text>
          <View style={[styles.comingSoon, { backgroundColor: colors.warning }]}>
            <Text style={styles.comingSoonText}>Bientôt disponible</Text>
          </View>
        </TouchableOpacity>
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
  cardsContainer: {
    padding: 20,
    gap: 16,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 8,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  comingSoon: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
});
