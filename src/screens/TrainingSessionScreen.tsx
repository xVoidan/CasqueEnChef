import React, {
  /* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/prefer-nullish-coalescing, react-native/no-inline-styles, react-native/no-color-literals */ useState,
  useEffect,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { spacing, typography, borderRadius, shadows } from '../styles/theme';
import { TrainingStackScreenProps } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { Timer } from '../components/Timer';
import { sessionService, Question, UserAnswer } from '../services/sessionService';
import { ButtonContainer } from '../components/ButtonContainer';
import * as Haptics from 'expo-haptics';
import { badgesService } from '../services/badgesService';

const { width: _screenWidth } = Dimensions.get('window');

export const TrainingSessionScreen: React.FC<TrainingStackScreenProps<'TrainingSession'>> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const defaultSettings = {
    questionType: 'MIXTE' as const,
    showCorrection: true,
    showScore: true,
    numberOfQuestions: 10,
    mode: 'entrainement_libre' as const,
    showExplanation: true,
    timerEnabled: false,
    timeLimit: 30,
    timePerQuestion: 60,
    scoring: {
      correct: 1,
      incorrect: -0.5,
      noAnswer: -0.5,
      partial: 0.5,
    },
  };
  const { sousThemes = [], settings = defaultSettings } = route.params || {};

  // États
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showCorrection, setShowCorrection] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionId, setSessionId] = useState<number>();
  const [sessionScore, setSessionScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextQuestionData, setNextQuestionData] = useState<{
    question: Question;
    answers: string[];
    correctAnswer: string;
  } | null>(null);
  const timeSpentRef = useRef(0);

  // Animations pour la transition fluide
  const currentQuestionOpacity = useRef(new Animated.Value(1)).current;
  const currentQuestionTranslateX = useRef(new Animated.Value(0)).current;
  const nextQuestionOpacity = useRef(new Animated.Value(0)).current;
  const nextQuestionTranslateX = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Question actuelle
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  useEffect(() => {
    void initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      setLoading(true);

      // Vérifier s'il y a une session en pause à reprendre
      if (user) {
        const pausedSession = await sessionService.getLocalSession(user.id);
        if (pausedSession?.isPaused) {
          // Reprendre la session en pause
          setQuestions(pausedSession.questions);
          setCurrentQuestionIndex(pausedSession.currentQuestionIndex);
          setUserAnswers(pausedSession.answers);
          setSessionScore(pausedSession.score);
          setSessionId(pausedSession.id);
          setLoading(false);
          return;
        }
      }

      // Sinon, charger de nouvelles questions
      const loadedQuestions = await sessionService.loadQuestions(
        sousThemes || [],
        settings?.questionType || 'MIXTE',
        settings?.numberOfQuestions
      );

      if (loadedQuestions.length === 0) {
        Alert.alert('Erreur', 'Aucune question disponible');
        navigation.goBack();
        return;
      }

      setQuestions(loadedQuestions);

      // Créer la session
      if (user) {
        const sessionSettings = {
          ...defaultSettings,
          ...settings,
        };
        const session = await sessionService.createSession(
          user.id,
          loadedQuestions,
          sessionSettings
        );
        setSessionId(session.id);
      }
    } catch (error) {
      console.error('Erreur initialisation session:', error);
      Alert.alert('Erreur', 'Impossible de démarrer la session');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerId: number) => {
    if (showCorrection) {
      return;
    }

    if (currentQuestion.type_question === 'QCU') {
      setSelectedAnswers([answerId]);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      // QCM
      setSelectedAnswers(prev => {
        if (prev.includes(answerId)) {
          return prev.filter(id => id !== answerId);
        } else {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          return [...prev, answerId];
        }
      });
    }
  };

  const handleValidate = async () => {
    // Calculer le score
    const sessionSettings = {
      ...defaultSettings,
      ...settings,
    };
    const result = sessionService.calculateScore(currentQuestion, selectedAnswers, sessionSettings);

    // Créer la réponse utilisateur
    const userAnswer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedAnswers,
      isCorrect: result.isCorrect,
      points: result.points,
      timeSpent: timeSpentRef.current,
    };

    // Sauvegarder la réponse
    if (user) {
      await sessionService.saveAnswer(user.id, sessionId, userAnswer);
    }

    setUserAnswers(prev => [...prev, userAnswer]);
    setSessionScore(prev => prev + result.points);

    // Feedback haptique
    if (result.isCorrect) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    // Afficher la correction
    setShowCorrection(true);
    animateCorrection();
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      void handleEndSession();
    } else {
      animateTransition(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswers([]);
        setShowCorrection(false);
        setShowExplanation(false);
        timeSpentRef.current = 0;
      });
    }
  };

  const handleEndSession = async () => {
    if (!user) {
      return;
    }

    // Terminer la session et récupérer les données
    const sessionData = await sessionService.endSession(user.id, sessionId, 'terminee');

    if (sessionData) {
      // Calculer les statistiques détaillées
      const stats = await sessionService.getSessionStats(sessionData);

      if (stats) {
        // Vérifier les badges et défis complétés
        const earnedRewards = await badgesService.checkAndAwardBadges(user.id);
        // Log removed

        // Si des badges ont été gagnés, récupérer leurs détails et naviguer vers l'animation
        if (earnedRewards?.new_badges?.length > 0) {
          // Récupérer tous les badges de l'utilisateur pour avoir les détails
          const allBadges = await badgesService.getUserBadges(user.id);
          // Log removed
          // Log removed

          // Filtrer pour ne garder que les nouveaux badges
          const newBadgeDetails = allBadges.filter(badge =>
            earnedRewards.new_badges.includes(badge.nom)
          );

          // Log removed

          // Transformer les données pour l'écran d'animation
          // Diviser les points équitablement entre tous les badges
          const pointsPerBadge =
            newBadgeDetails.length > 0
              ? Math.floor(earnedRewards.total_points_earned / newBadgeDetails.length)
              : earnedRewards.total_points_earned;

          const rewards = newBadgeDetails.map(badge => ({
            type: 'badge' as 'badge' | 'challenge' | 'rank',
            id: badge.id,
            name: badge.nom,
            description: badge.description,
            icon: badge.icone,
            rarity:
              badge.niveau === 4
                ? 'legendary'
                : badge.niveau === 3
                  ? 'epic'
                  : badge.niveau === 2
                    ? 'rare'
                    : ('common' as 'common' | 'rare' | 'epic' | 'legendary'),
            points: pointsPerBadge || badge.points_requis || 10,
          }));

          navigation.replace('RewardAnimation', {
            rewards,
            sessionStats: stats,
          });
        } else {
          // Pas de récompenses, aller directement au rapport
          navigation.replace('SessionReport', {
            sessionId: sessionId || 0,
            stats,
            sessionParams: route.params,
          });
        }
      } else {
        // En cas d'erreur, retour simple
        navigation.navigate('HomeScreen' as never);
      }
    } else {
      // Si pas de données de session, retour simple
      navigation.navigate('HomeScreen' as never);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleQuit = () => {
    Alert.alert(
      'Quitter la session',
      'Êtes-vous sûr de vouloir arrêter cette session ? Vous pourrez consulter vos résultats partiels.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter et voir résultats',
          onPress: () => {
            void (async () => {
              if (!user) {
                navigation.navigate('HomeScreen' as never);
                return;
              }

              // Terminer la session comme abandonnée et récupérer les données
              const sessionData = await sessionService.endSession(user.id, sessionId, 'abandonnee');

              if (sessionData) {
                const stats = await sessionService.getSessionStats(sessionData);
                if (stats) {
                  // Vérifier les badges même pour une session abandonnée
                  // mais sans animation de récompense
                  await badgesService.checkAndAwardBadges(user.id);

                  // Naviguer vers l'écran de rapport même pour une session abandonnée
                  navigation.replace('SessionReport', {
                    sessionId: sessionId || 0,
                    stats,
                    sessionParams: route.params,
                    isAbandoned: true,
                  });
                } else {
                  navigation.navigate('HomeScreen' as never);
                }
              } else {
                navigation.navigate('HomeScreen' as never);
              }
            })();
          },
        },
        {
          text: 'Quitter sans résultats',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              if (user) {
                await sessionService.endSession(user.id, sessionId, 'abandonnee');
              }
              navigation.navigate('HomeScreen' as never);
            })();
          },
        },
      ]
    );
  };

  const animateCorrection = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.02,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateTransition = (callback: () => void) => {
    setIsTransitioning(true);

    // Préparer la nouvelle question
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setNextQuestionData({
        question: questions[nextIndex],
        answers: [],
        correctAnswer: '',
      });

      // Pré-positionner la nouvelle question plus proche pour réduire le trajet
      nextQuestionTranslateX.setValue(30);
    }

    // Animation fluide sans aucun délai - les deux animations démarrent simultanément
    Animated.parallel([
      // Ancienne question : slide rapide vers la gauche + fade out progressif
      Animated.parallel([
        Animated.timing(currentQuestionTranslateX, {
          toValue: -50,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(currentQuestionOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Nouvelle question : apparition immédiate avec slide doux + fade in
      Animated.parallel([
        Animated.timing(nextQuestionTranslateX, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(nextQuestionOpacity, {
          toValue: 1,
          duration: 500,
          delay: 0, // Pas de délai - démarre immédiatement
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Mettre à jour les états après l'animation
      callback();
      setNextQuestionData(null);

      // Réinitialiser les animations pour la prochaine transition
      currentQuestionOpacity.setValue(1);
      currentQuestionTranslateX.setValue(0);
      nextQuestionOpacity.setValue(0);
      nextQuestionTranslateX.setValue(30);

      setIsTransitioning(false);
    });
  };

  const renderAnswer = (answer: {
    id: number;
    lettre: string;
    texte: string;
    est_correcte: boolean;
  }) => {
    const isSelected = selectedAnswers.includes(answer.id);
    const isCorrect = answer.est_correcte;

    let backgroundColor = colors.surface;
    let borderColor = colors.border;
    let textColor = colors.text;

    if (showCorrection) {
      if (isCorrect) {
        backgroundColor = `${colors.success}15`;
        borderColor = colors.success;
        textColor = colors.success;
      } else if (isSelected && !isCorrect) {
        backgroundColor = `${colors.error}15`;
        borderColor = colors.error;
        textColor = colors.error;
      }
    } else if (isSelected) {
      backgroundColor = `${colors.primary}15`;
      borderColor = colors.primary;
    }

    return (
      <TouchableOpacity
        key={answer.id}
        style={[
          styles.answerOption,
          {
            backgroundColor,
            borderColor,
            borderWidth: isSelected || (showCorrection && (isCorrect || isSelected)) ? 2 : 1,
          },
        ]}
        onPress={() => handleAnswerSelect(answer.id)}
        disabled={showCorrection}
        activeOpacity={0.7}
      >
        <View style={styles.answerContent}>
          <View style={[styles.answerLetter, { backgroundColor: borderColor }]}>
            <Text style={[styles.answerLetterText, { color: '#FFF' }]}>{answer.lettre}</Text>
          </View>
          <Text style={[styles.answerText, { color: textColor }]}>{answer.texte}</Text>
          {currentQuestion.type_question === 'QCM' && !showCorrection && (
            <View style={[styles.checkbox, { borderColor }]}>
              {isSelected && <Ionicons name="checkmark" size={16} color={borderColor} />}
            </View>
          )}
          {currentQuestion.type_question === 'QCU' && !showCorrection && (
            <View style={[styles.radio, { borderColor }]}>
              {isSelected && <View style={[styles.radioDot, { backgroundColor: borderColor }]} />}
            </View>
          )}
          {showCorrection && isCorrect && (
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          )}
          {showCorrection && isSelected && !isCorrect && (
            <Ionicons name="close-circle" size={24} color={colors.error} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderPauseModal = () => (
    <Modal visible={isPaused} transparent animationType="fade" onRequestClose={handleResume}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleResume}>
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.modalContent, { backgroundColor: colors.surface }]}
          onPress={e => e.stopPropagation()}
        >
          <Ionicons name="pause-circle" size={64} color={colors.primary} />
          <Text style={[styles.modalTitle, { color: colors.text }]}>Session en pause</Text>
          <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
            Question {currentQuestionIndex + 1}/{questions.length}
          </Text>
          <Text style={[styles.modalHint, { color: colors.textSecondary }]}>
            Score actuel : {sessionScore.toFixed(1)} pts
          </Text>

          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: colors.primary }]}
            onPress={handleResume}
          >
            <Ionicons name="play" size={20} color="#FFF" />
            <Text style={styles.modalButtonText}>Reprendre</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: colors.secondary }]}
            onPress={() => {
              void (async () => {
                // Sauvegarder l'état actuel de la session
                if (user) {
                  const sessionData = {
                    id: sessionId,
                    profile_id: user.id,
                    questions,
                    currentQuestionIndex,
                    answers: userAnswers,
                    score: sessionScore,
                    startTime: new Date(),
                    isPaused: true,
                    settings,
                  };
                  await sessionService.saveSessionLocally(user.id, sessionData);
                }
                setIsPaused(false);
                navigation.navigate('HomeScreen' as never);
              })();
            }}
          >
            <Ionicons name="home-outline" size={20} color="#FFF" />
            <Text style={styles.modalButtonText}>Retour (session sauvegardée)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.modalButton, styles.quitButton]} onPress={handleQuit}>
            <Ionicons name="exit-outline" size={20} color={colors.error} />
            <Text style={[styles.modalButtonText, { color: colors.error }]}>
              Arrêter la session
            </Text>
          </TouchableOpacity>

          <Text style={[styles.modalTip, { color: colors.textSecondary }]}>
            Touchez en dehors pour reprendre
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement des questions...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.questionNumber, { color: colors.text }]}>
            Question {currentQuestionIndex + 1}/{questions.length}
          </Text>
          <View style={[styles.scoreBadge, { backgroundColor: `${colors.primary}15` }]}>
            <Text style={[styles.scoreText, { color: colors.primary }]}>
              {sessionScore.toFixed(1)} pts
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {settings.timerEnabled && !showCorrection && (
            <Timer
              key={`timer-${currentQuestionIndex}`}
              duration={settings.timePerQuestion}
              onTimeUp={() => void handleValidate()}
              isPaused={isPaused}
              onTick={time => {
                timeSpentRef.current = settings.timePerQuestion - time;
              }}
            />
          )}
          <TouchableOpacity onPress={handlePause} style={styles.pauseButton}>
            <Ionicons name="pause" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Container pour les questions avec position absolute pour permettre le chevauchement */}
      <View style={styles.questionsContainer}>
        {/* Question actuelle */}
        <Animated.View
          style={[
            styles.content,
            styles.absoluteContent,
            {
              opacity: currentQuestionOpacity,
              transform: [{ translateX: currentQuestionTranslateX }],
            },
          ]}
          pointerEvents={isTransitioning ? 'none' : 'auto'}
        >
          {currentQuestion && !nextQuestionData && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.questionCard, { backgroundColor: colors.surface }]}>
                <View style={styles.questionHeader}>
                  <View
                    style={[styles.questionTypeBadge, { backgroundColor: `${colors.secondary}15` }]}
                  >
                    <Text style={[styles.questionTypeText, { color: colors.secondary }]}>
                      {currentQuestion.type_question}
                    </Text>
                  </View>
                  <View style={styles.difficultyIndicator}>
                    {[...Array(5)].map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.difficultyDot,
                          {
                            backgroundColor:
                              i < currentQuestion.niveau_difficulte
                                ? colors.primary
                                : colors.border,
                          },
                        ]}
                      />
                    ))}
                  </View>
                </View>

                <Text style={[styles.questionText, { color: colors.text }]}>
                  {currentQuestion.enonce}
                </Text>
              </View>

              {/* Réponses */}
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                {currentQuestion.reponses.map(renderAnswer)}
              </Animated.View>

              {/* Correction */}
              {showCorrection && (
                <Animated.View style={[styles.correctionCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.correctionHeader}>
                    <View style={styles.correctionScore}>
                      <Ionicons
                        name={
                          userAnswers[userAnswers.length - 1]?.isCorrect
                            ? 'checkmark-circle'
                            : 'close-circle'
                        }
                        size={24}
                        color={
                          userAnswers[userAnswers.length - 1]?.isCorrect
                            ? colors.success
                            : colors.error
                        }
                      />
                      <Text
                        style={[
                          styles.correctionScoreText,
                          {
                            color:
                              userAnswers[userAnswers.length - 1]?.points >= 0
                                ? colors.success
                                : colors.error,
                          },
                        ]}
                      >
                        {userAnswers[userAnswers.length - 1]?.points >= 0 ? '+' : ''}
                        {userAnswers[userAnswers.length - 1]?.points.toFixed(1)} point
                        {Math.abs(userAnswers[userAnswers.length - 1]?.points) !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>

                  {currentQuestion.explication ? (
                    <>
                      <TouchableOpacity
                        style={styles.explanationToggle}
                        onPress={() => setShowExplanation(!showExplanation)}
                      >
                        <Text style={[styles.explanationToggleText, { color: colors.primary }]}>
                          {showExplanation ? 'Masquer' : 'Voir'} l'explication
                        </Text>
                        <Ionicons
                          name={showExplanation ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color={colors.primary}
                        />
                      </TouchableOpacity>

                      {showExplanation && (
                        <View style={styles.explanationContent}>
                          <Text style={[styles.explanationText, { color: colors.text }]}>
                            {currentQuestion.explication.texte_explication}
                          </Text>
                          {currentQuestion.explication.source && (
                            <Text
                              style={[styles.explanationSource, { color: colors.textSecondary }]}
                            >
                              Source : {currentQuestion.explication.source}
                            </Text>
                          )}
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.noExplanation}>
                      <Text style={[styles.noExplanationText, { color: colors.textSecondary }]}>
                        Pas d'explication disponible pour cette question
                      </Text>
                    </View>
                  )}
                </Animated.View>
              )}
            </ScrollView>
          )}
        </Animated.View>

        {/* Nouvelle question (pendant la transition) */}
        {nextQuestionData && (
          <Animated.View
            style={[
              styles.content,
              styles.absoluteContent,
              {
                opacity: nextQuestionOpacity,
                transform: [{ translateX: nextQuestionTranslateX }],
              },
            ]}
            pointerEvents="none"
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.questionCard, { backgroundColor: colors.surface }]}>
                <View style={styles.questionHeader}>
                  <View
                    style={[styles.questionTypeBadge, { backgroundColor: `${colors.secondary}15` }]}
                  >
                    <Text style={[styles.questionTypeText, { color: colors.secondary }]}>
                      {nextQuestionData.question.type_question}
                    </Text>
                  </View>
                  <View style={styles.difficultyIndicator}>
                    {[...Array(5)].map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.difficultyDot,
                          {
                            backgroundColor:
                              i < nextQuestionData.question.niveau_difficulte
                                ? colors.primary
                                : colors.border,
                          },
                        ]}
                      />
                    ))}
                  </View>
                </View>

                <Text style={[styles.questionText, { color: colors.text }]}>
                  {nextQuestionData.question.enonce}
                </Text>
              </View>

              {/* Réponses de la nouvelle question */}
              {nextQuestionData.question.reponses.map(answer => (
                <View
                  key={answer.id}
                  style={[
                    styles.answerOption,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <View style={styles.answerContent}>
                    <View style={[styles.answerLetter, { backgroundColor: colors.border }]}>
                      <Text style={[styles.answerLetterText, { color: '#FFF' }]}>
                        {answer.lettre}
                      </Text>
                    </View>
                    <Text style={[styles.answerText, { color: colors.text }]}>{answer.texte}</Text>
                    {nextQuestionData.question.type_question === 'QCM' && (
                      <View style={[styles.checkbox, { borderColor: colors.border }]} />
                    )}
                    {nextQuestionData.question.type_question === 'QCU' && (
                      <View style={[styles.radio, { borderColor: colors.border }]} />
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        )}
      </View>

      {/* Footer avec nouveau ButtonContainer */}
      <ButtonContainer
        backgroundColor={colors.background}
        borderColor={colors.border}
        floating={false}
      >
        {!showCorrection ? (
          <TouchableOpacity
            style={[
              styles.validateButton,
              {
                backgroundColor: colors.primary,
                opacity: selectedAnswers.length === 0 || isTransitioning ? 0.5 : 1,
              },
            ]}
            onPress={() => void handleValidate()}
            disabled={selectedAnswers.length === 0 || isTransitioning}
          >
            <Text style={styles.validateButtonText}>Valider</Text>
            <Ionicons name="checkmark" size={20} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.nextButton,
              {
                backgroundColor: colors.primary,
                opacity: isTransitioning ? 0.5 : 1,
              },
            ]}
            onPress={() => void handleNextQuestion()}
            disabled={isTransitioning}
          >
            <Text style={styles.nextButtonText}>
              {isLastQuestion ? 'Terminer' : 'Question suivante'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </ButtonContainer>

      {renderPauseModal()}
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
    ...typography.body,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionNumber: {
    ...typography.bodyBold,
  },
  scoreBadge: {
    marginLeft: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  scoreText: {
    ...typography.small,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pauseButton: {
    marginLeft: spacing.md,
  },
  questionsContainer: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  absoluteContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  questionCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  questionTypeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  questionTypeText: {
    ...typography.small,
    fontWeight: '600',
  },
  difficultyIndicator: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  questionText: {
    ...typography.body,
    lineHeight: 24,
  },
  answerOption: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  answerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  answerLetter: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  answerLetterText: {
    ...typography.bodyBold,
  },
  answerText: {
    ...typography.body,
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.xs,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  correctionCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  correctionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  correctionScore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  correctionScoreText: {
    ...typography.bodyBold,
    marginLeft: spacing.sm,
  },
  explanationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  explanationToggleText: {
    ...typography.body,
  },
  explanationContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  explanationText: {
    ...typography.body,
    lineHeight: 22,
  },
  explanationSource: {
    ...typography.small,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  validateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  validateButtonText: {
    ...typography.bodyBold,
    color: '#FFF',
    marginRight: spacing.sm,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  nextButtonText: {
    ...typography.bodyBold,
    color: '#FFF',
    marginRight: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.h3,
    marginTop: spacing.md,
  },
  modalSubtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  modalButtonText: {
    ...typography.bodyBold,
    color: '#FFF',
    marginLeft: spacing.sm,
  },
  quitButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  modalHint: {
    ...typography.small,
    marginBottom: spacing.lg,
  },
  modalTip: {
    ...typography.caption,
    marginTop: spacing.lg,
    fontStyle: 'italic',
  },
  noExplanation: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  noExplanationText: {
    ...typography.body,
    fontStyle: 'italic',
  },
});
