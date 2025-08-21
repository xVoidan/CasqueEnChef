import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { typography, spacing, borderRadius, shadows } from '../styles/theme';
import { FailedQuestion } from '../hooks/useSessionAnalytics';

// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReviewQuestionsModalProps {
  visible: boolean;
  questions: FailedQuestion[];
  onClose: () => void;
  onQuestionReviewed?: (questionId: number) => void;
}

export const ReviewQuestionsModal: React.FC<ReviewQuestionsModalProps> = ({
  visible,
  questions,
  onClose,
  onQuestionReviewed,
}) => {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [reviewedQuestions, setReviewedQuestions] = useState<Set<number>>(new Set());
  const scrollViewRef = useRef<ScrollView>(null);

  const progressAnimation = useSharedValue(0);
  const explanationOpacity = useSharedValue(0);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  useEffect(() => {
    progressAnimation.value = withSpring(progress);
  }, [currentIndex, progress, progressAnimation]);

  // Réinitialiser l'animation quand le modal s'ouvre
  useEffect(() => {
    if (visible) {
      explanationOpacity.value = 0;
      setShowExplanation(false);
      setCurrentIndex(0);
      setReviewedQuestions(new Set());
      // Forcer le rendu initial correct
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [visible, explanationOpacity]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      explanationOpacity.value = 0; // Réinitialiser l'opacité
      setCurrentIndex(prev => prev + 1);
      setShowExplanation(false);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [currentIndex, questions.length, explanationOpacity]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      explanationOpacity.value = 0; // Réinitialiser l'opacité
      setCurrentIndex(prev => prev - 1);
      setShowExplanation(false);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [currentIndex, explanationOpacity]);

  const handleShowExplanation = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowExplanation(true);
    explanationOpacity.value = withTiming(1, { duration: 300 });

    // Marquer la question comme révisée
    const questionId = currentQuestion.questionId;
    setReviewedQuestions(prev => new Set(prev).add(questionId));
    onQuestionReviewed?.(questionId);
  }, [currentQuestion, explanationOpacity, onQuestionReviewed]);

  const handleClose = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    explanationOpacity.value = 0; // Réinitialiser l'opacité avant de fermer
    setShowExplanation(false);
    setCurrentIndex(0);
    onClose();
  }, [onClose, explanationOpacity]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressAnimation.value}%`,
  }));

  const explanationStyle = useAnimatedStyle(() => {
    return {
      opacity: explanationOpacity.value,
    };
  });

  if (!visible || !currentQuestion) {
    return null;
  }

  const isReviewed = reviewedQuestions.has(currentQuestion.questionId);

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={visible}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Révision des questions
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Question {currentIndex + 1} sur {questions.length}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <Animated.View
                style={[styles.progressFill, { backgroundColor: colors.primary }, progressBarStyle]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {Math.round(progress)}% complété
            </Text>
          </View>

          {/* Content */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            <Animated.View style={[styles.questionCard, { backgroundColor: colors.surface }]}>
              {/* Question Header */}
              <View style={styles.questionHeader}>
                <View style={styles.questionTags}>
                  <View style={[styles.tag, { backgroundColor: `${colors.primary}20` }]}>
                    <Text style={[styles.tagText, { color: colors.primary }]}>
                      {currentQuestion.themeName}
                    </Text>
                  </View>
                  {currentQuestion.sousThemeName && (
                    <View style={[styles.tag, { backgroundColor: `${colors.secondary}20` }]}>
                      <Text style={[styles.tagText, { color: colors.secondary }]}>
                        {currentQuestion.sousThemeName}
                      </Text>
                    </View>
                  )}
                </View>
                {isReviewed && (
                  <View style={styles.reviewedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  </View>
                )}
              </View>

              {/* Question */}
              <Text style={[styles.questionText, { color: colors.text }]}>
                {currentQuestion.enonce}
              </Text>

              {/* Answers Comparison */}
              <View style={styles.answersSection}>
                <View style={[styles.answerCard, styles.wrongAnswer]}>
                  <View style={styles.answerHeader}>
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                    <Text style={styles.answerLabel}>Votre réponse</Text>
                  </View>
                  <Text style={[styles.answerText, { color: colors.text }]}>
                    {currentQuestion.userAnswer ?? 'Pas de réponse'}
                  </Text>
                </View>

                <View style={[styles.answerCard, styles.correctAnswer]}>
                  <View style={styles.answerHeader}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={styles.answerLabel}>Bonne réponse</Text>
                  </View>
                  <Text style={[styles.answerText, { color: colors.text }]}>
                    {currentQuestion.correctAnswer}
                  </Text>
                </View>
              </View>

              {/* Explanation */}
              {!showExplanation ? (
                <TouchableOpacity
                  style={[styles.explanationButton, { backgroundColor: colors.primary }]}
                  onPress={handleShowExplanation}
                  accessibilityRole="button"
                  accessibilityLabel="Voir l'explication"
                >
                  <Ionicons name="bulb" size={20} color="#FFF" />
                  <Text style={styles.explanationButtonText}>Voir l'explication</Text>
                </TouchableOpacity>
              ) : (
                <Animated.View
                  style={[
                    styles.explanationCard,
                    { backgroundColor: `${colors.info}10` },
                    explanationStyle,
                  ]}
                >
                  <View style={styles.explanationHeader}>
                    <Ionicons name="bulb" size={20} color={colors.info} />
                    <Text style={[styles.explanationTitle, { color: colors.text }]}>
                      Explication
                    </Text>
                  </View>
                  <Text style={[styles.explanationText, { color: colors.text }]}>
                    {currentQuestion.explication ||
                      "Pas d'explication disponible pour cette question."}
                  </Text>
                </Animated.View>
              )}

              {/* Tips */}
              <View style={[styles.tipsCard, { backgroundColor: `${colors.warning}10` }]}>
                <Ionicons name="bulb-outline" size={16} color={colors.warning} />
                <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
                  Astuce: Prenez le temps de bien comprendre pourquoi cette réponse est correcte.
                </Text>
              </View>
            </Animated.View>
          </ScrollView>

          {/* Navigation */}
          <View style={[styles.navigation, { backgroundColor: colors.background }]}>
            <TouchableOpacity
              style={[
                styles.navButton,
                currentIndex === 0 && styles.navButtonDisabled,
                { backgroundColor: colors.surface },
              ]}
              onPress={handlePrevious}
              disabled={currentIndex === 0}
              accessibilityRole="button"
              accessibilityLabel="Question précédente"
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={currentIndex === 0 ? colors.textSecondary : colors.text}
              />
              <Text
                style={[
                  styles.navButtonText,
                  { color: currentIndex === 0 ? colors.textSecondary : colors.text },
                ]}
              >
                Précédent
              </Text>
            </TouchableOpacity>

            <View style={styles.navCenter}>
              <Text style={[styles.navCounter, { color: colors.text }]}>
                {currentIndex + 1} / {questions.length}
              </Text>
              <View style={styles.dotsContainer}>
                {questions
                  .slice(Math.max(0, currentIndex - 2), currentIndex + 3)
                  .map((_, index) => {
                    const actualIndex = Math.max(0, currentIndex - 2) + index;
                    return (
                      <View
                        key={actualIndex}
                        style={[
                          styles.dot,
                          actualIndex === currentIndex
                            ? { backgroundColor: colors.primary }
                            : { backgroundColor: colors.border },
                          reviewedQuestions.has(questions[actualIndex]?.questionId) &&
                            styles.dotReviewed,
                        ]}
                      />
                    );
                  })}
              </View>
            </View>

            {currentIndex < questions.length - 1 ? (
              <TouchableOpacity
                style={[styles.navButton, { backgroundColor: colors.primary }]}
                onPress={handleNext}
                accessibilityRole="button"
                accessibilityLabel="Question suivante"
              >
                <Text style={[styles.navButtonText, styles.whiteText]}>Suivant</Text>
                <Ionicons name="chevron-forward" size={20} color="#FFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.navButton, { backgroundColor: colors.success }]}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Terminer la révision"
              >
                <Text style={[styles.navButtonText, styles.whiteText]}>Terminer</Text>
                <Ionicons name="checkmark" size={20} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
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
    flex: 1,
  },
  headerTitle: {
    ...typography.h4,
    fontWeight: '600',
  },
  headerSubtitle: {
    ...typography.small,
    marginTop: 2,
  },
  closeButton: {
    padding: spacing.xs,
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    ...typography.caption,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  questionCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  questionTags: {
    flexDirection: 'row',
    gap: spacing.xs,
    flex: 1,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  tagText: {
    ...typography.caption,
    fontWeight: '600',
  },
  reviewedBadge: {
    marginLeft: spacing.sm,
  },
  questionText: {
    ...typography.body,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  answersSection: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  answerCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  wrongAnswer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  correctAnswer: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  answerLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: '#666',
  },
  answerText: {
    ...typography.body,
  },
  explanationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  explanationButtonText: {
    ...typography.body,
    color: '#FFF',
    fontWeight: '600',
  },
  explanationCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  explanationTitle: {
    ...typography.bodyBold,
  },
  explanationText: {
    ...typography.body,
    lineHeight: 22,
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  tipsText: {
    ...typography.small,
    flex: 1,
    lineHeight: 18,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    ...typography.small,
    fontWeight: '600',
  },
  navCenter: {
    alignItems: 'center',
  },
  navCounter: {
    ...typography.caption,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotReviewed: {
    borderWidth: 1,
    borderColor: '#10B981',
  },
  whiteText: {
    color: '#FFF',
  },
});
