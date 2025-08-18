import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { spacing, typography, borderRadius, shadows } from '../styles/theme';
import { HomeStackScreenProps } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { supabase } from '../config/supabase';
import { avatarService } from '../services/avatarService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface QuickStat {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface TrainingCard {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: string[];
  available: boolean;
  action: () => void;
}

interface Tip {
  id: string;
  title: string;
  description: string;
  type: 'tip' | 'update' | 'news';
  date: Date;
}

export const HomeScreen: React.FC<HomeStackScreenProps<'HomeScreen'>> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [lastSession, setLastSession] = useState<any>(null);
  const [weeklyStats, setWeeklyStats] = useState({ sessions: 0, correctRate: 0, streak: 0 });
  const [tips, setTips] = useState<Tip[]>([]);
  const scrollY = useSharedValue(0);
  const carouselRef = useRef<FlatList>(null);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    loadUserData();
    loadTips();
    // Auto-scroll carousel
    const interval = setInterval(() => {
      if (carouselRef.current && tips.length > 1) {
        const nextIndex = (currentTipIndex + 1) % tips.length;
        carouselRef.current.scrollToIndex({ index: nextIndex, animated: true });
        setCurrentTipIndex(nextIndex);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [currentTipIndex, tips.length]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Charger le profil utilisateur
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setUserProfile(profile);
      
      // Charger l'avatar séparément avec avatarService
      try {
        const avatar = await avatarService.getAvatar(user.id);
        if (avatar) {
          setAvatarUrl(avatar);
        }
      } catch (error) {
        // Silently handle avatar loading error
      }

      // Charger la dernière session
      const { data: sessions } = await supabase
        .from('sessions')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (sessions && sessions.length > 0) {
        setLastSession(sessions[0]);
      }

      // Charger les stats hebdomadaires
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: weekSessions } = await supabase
        .from('sessions')
        .select('*')
        .eq('profile_id', user.id)
        .gte('created_at', weekAgo.toISOString());
      
      if (weekSessions) {
        const totalQuestions = weekSessions.reduce((acc, s) => acc + s.nombre_questions, 0);
        const correctAnswers = weekSessions.reduce((acc, s) => acc + s.nombre_reponses_correctes, 0);
        const rate = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
        
        // Calculer la série (simplified)
        const today = new Date();
        let streak = 0;
        for (let i = 0; i < 30; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const daySession = weekSessions.find(s => 
            new Date(s.created_at).toDateString() === date.toDateString()
          );
          if (daySession) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }
        
        setWeeklyStats({
          sessions: weekSessions.length,
          correctRate: rate,
          streak,
        });
      }
    } catch (error) {
      // Silently handle user data loading error
    }
  };

  const loadTips = () => {
    // Simuler des tips (à remplacer par un appel API)
    setTips([
      {
        id: '1',
        title: 'Conseil du jour',
        description: 'Révisez régulièrement les procédures d\'intervention pour maintenir vos réflexes.',
        type: 'tip',
        date: new Date(),
      },
      {
        id: '2',
        title: 'Nouvelles questions',
        description: '20 nouvelles questions ajoutées en Mathématiques - Problèmes complexes.',
        type: 'update',
        date: new Date(),
      },
      {
        id: '3',
        title: 'Mise à jour',
        description: 'Mode examen disponible ! Testez-vous en conditions réelles.',
        type: 'news',
        date: new Date(),
      },
    ]);
  };

  const trainingCards: TrainingCard[] = [
    {
      id: '1',
      title: 'Entraînement Libre',
      description: 'Pratiquez à votre rythme',
      icon: 'school',
      colors: ['#DC2626', '#EF4444'],
      available: true,
      action: () => navigation.navigate('TrainingConfig'),
    },
    {
      id: '2',
      title: 'Mode Examen',
      description: 'Conditions réelles',
      icon: 'time',
      colors: ['#3B82F6', '#60A5FA'],
      available: false,
      action: () => {},
    },
    {
      id: '3',
      title: 'Révisions',
      description: 'Questions échouées',
      icon: 'refresh',
      colors: ['#10B981', '#34D399'],
      available: false,
      action: () => {},
    },
    {
      id: '4',
      title: 'Défis Quotidiens',
      description: 'Nouveau défi chaque jour',
      icon: 'trophy',
      colors: ['#F59E0B', '#FBBF24'],
      available: false,
      action: () => {},
    },
  ];

  const quickStats: QuickStat[] = [
    {
      label: 'Dernière session',
      value: lastSession 
        ? `${lastSession.nombre_reponses_correctes}/${lastSession.nombre_questions}`
        : '-',
      icon: 'checkmark-circle',
      color: '#10B981',
    },
    {
      label: 'Cette semaine',
      value: `${weeklyStats.correctRate}%`,
      icon: 'trending-up',
      color: '#3B82F6',
    },
    {
      label: 'Série',
      value: `${weeklyStats.streak} jours`,
      icon: 'flame',
      color: '#F59E0B',
    },
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, 100],
          [0, -50],
          Extrapolate.CLAMP
        ),
      },
    ],
    opacity: interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.8],
      Extrapolate.CLAMP
    ),
  }));

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const renderTip = ({ item }: { item: Tip }) => (
    <View style={[styles.tipCard, { backgroundColor: colors.surface }]}>
      <View style={styles.tipHeader}>
        <View style={[
          styles.tipBadge,
          { backgroundColor: item.type === 'tip' ? '#3B82F6' : item.type === 'update' ? '#10B981' : '#F59E0B' }
        ]}>
          <Ionicons 
            name={item.type === 'tip' ? 'bulb' : item.type === 'update' ? 'add-circle' : 'megaphone'}
            size={16}
            color="#FFFFFF"
          />
        </View>
        <Text style={[styles.tipTitle, { color: colors.text }]}>{item.title}</Text>
      </View>
      <Text style={[styles.tipDescription, { color: colors.textSecondary }]}>
        {item.description}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Header personnalisé */}
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                {getGreeting()},
              </Text>
              <Text style={[styles.userName, { color: colors.text }]}>
                {userProfile?.username || user?.username || 'Invité'}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={() => navigation.navigate('ProfileScreen')}
                style={styles.avatarContainer}
                activeOpacity={0.7}
              >
                {avatarUrl ? (
                  <Image 
                    source={{ uri: avatarUrl }}
                    style={styles.avatar}
                    resizeMode="cover"
                    onError={() => {
                      setAvatarUrl(null);
                    }}
                  />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>
                      {(userProfile?.username || user?.username || 'U')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Section principale - Cartes d'entraînement */}
        <View style={styles.mainSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Modes d'entraînement
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={SCREEN_WIDTH - spacing.lg * 2}
            decelerationRate="fast"
            contentContainerStyle={styles.cardsContainer}
          >
            {trainingCards.map((card, index) => (
              <Animated.View
                key={card.id}
                entering={SlideInRight.duration(500).delay(index * 100)}
              >
                <TouchableOpacity
                  onPress={() => {
                    if (card.available) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      card.action();
                    }
                  }}
                  disabled={!card.available}
                  activeOpacity={card.available ? 0.8 : 1}
                  style={styles.cardWrapper}
                >
                  <LinearGradient
                    colors={card.available ? card.colors : ['#9CA3AF', '#6B7280']}
                    style={[
                      styles.trainingCard,
                      !card.available && styles.disabledCard,
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.cardIconContainer}>
                      <Ionicons name={card.icon} size={40} color="#FFFFFF" />
                    </View>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text style={styles.cardDescription}>{card.description}</Text>
                    {!card.available && (
                      <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>Bientôt disponible</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        {/* Section statistiques rapides */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(400)}
          style={styles.statsSection}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Vos performances
          </Text>
          
          <View style={styles.statsGrid}>
            {quickStats.map((stat, index) => (
              <Animated.View
                key={stat.label}
                entering={FadeInUp.duration(500).delay(500 + index * 100)}
                style={[styles.statCard, { backgroundColor: colors.surface }, shadows.sm]}
              >
                <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                  <Ionicons name={stat.icon} size={24} color={stat.color} />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stat.value}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {stat.label}
                </Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Carousel Actualités/Tips */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(800)}
          style={styles.tipsSection}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Actualités & Conseils
          </Text>
          
          <FlatList
            ref={carouselRef}
            data={tips}
            renderItem={renderTip}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={SCREEN_WIDTH - spacing.lg * 2}
            decelerationRate="fast"
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / (SCREEN_WIDTH - spacing.lg * 2));
              setCurrentTipIndex(newIndex);
            }}
          />
          
          {/* Indicateurs de pagination */}
          <View style={styles.paginationContainer}>
            {tips.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  { backgroundColor: index === currentTipIndex ? colors.primary : colors.border }
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* Espacement en bas pour la TabBar bulle */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    ...typography.body,
  },
  userName: {
    ...typography.h3,
    marginTop: spacing.xs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#DC262620',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  mainSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  cardsContainer: {
    paddingHorizontal: spacing.lg,
  },
  cardWrapper: {
    marginRight: spacing.md,
  },
  trainingCard: {
    width: SCREEN_WIDTH - spacing.lg * 3,
    height: 180,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledCard: {
    opacity: 0.8,
  },
  cardIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h4,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  cardDescription: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  comingSoonText: {
    ...typography.small,
    color: '#FFFFFF',
  },
  statsSection: {
    marginBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.small,
    textAlign: 'center',
  },
  tipsSection: {
    marginBottom: spacing.xl,
  },
  tipCard: {
    width: SCREEN_WIDTH - spacing.lg * 2,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tipBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  tipTitle: {
    ...typography.bodyBold,
  },
  tipDescription: {
    ...typography.body,
    lineHeight: 22,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: spacing.xs,
  },
});