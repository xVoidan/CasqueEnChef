import React, {
  /* eslint-disable @typescript-eslint/prefer-nullish-coalescing */ useState,
} from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, typography, borderRadius, shadows } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { TrainingStackScreenProps } from '../types/navigation';
import { ButtonContainer } from '../components/ButtonContainer';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';

export const ReviewQuestionsScreen: React.FC<TrainingStackScreenProps<'ReviewQuestions'>> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const { questions } = route.params;
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  const toggleQuestion = (questionId: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Questions à réviser</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Voici les questions que vous avez manquées. Prenez le temps de comprendre les
            explications pour progresser.
          </Text>
        </View>

        {questions.map((question, index) => (
          <Animated.View
            key={question.questionId}
            entering={SlideInRight.duration(500).delay(index * 100)}
          >
            <TouchableOpacity
              onPress={() => toggleQuestion(question.questionId)}
              activeOpacity={0.7}
              style={[styles.questionCard, { backgroundColor: colors.surface }, shadows.sm]}
            >
              <View style={styles.questionHeader}>
                <View style={styles.questionMeta}>
                  <View style={[styles.themeBadge, { backgroundColor: `${colors.primary}15` }]}>
                    <Text style={[styles.themeText, { color: colors.primary }]}>
                      {question.themeName}
                    </Text>
                  </View>
                  <Text style={[styles.sousThemeText, { color: colors.textSecondary }]}>
                    {question.sousThemeName}
                  </Text>
                </View>
                <Ionicons
                  name={expandedQuestions.has(question.questionId) ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textSecondary}
                />
              </View>

              <Text style={[styles.questionText, { color: colors.text }]}>{question.enonce}</Text>

              {expandedQuestions.has(question.questionId) && (
                <Animated.View entering={FadeInDown.duration(300)} style={styles.answerSection}>
                  <View style={styles.answerRow}>
                    <View style={[styles.answerBox, styles.wrongAnswer]}>
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                      <View style={styles.answerContent}>
                        <Text style={styles.answerLabel}>Votre réponse</Text>
                        <Text style={[styles.answerText, { color: colors.text }]}>
                          {question.userAnswer || 'Pas de réponse'}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.answerBox, styles.correctAnswer]}>
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      <View style={styles.answerContent}>
                        <Text style={styles.answerLabel}>Bonne réponse</Text>
                        <Text style={[styles.answerText, { color: colors.text }]}>
                          {question.correctAnswer}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.explicationBox, { backgroundColor: `${colors.info}10` }]}>
                    <Ionicons name="bulb" size={20} color={colors.info} />
                    <Text style={[styles.explicationText, { color: colors.text }]}>
                      {question.explication}
                    </Text>
                  </View>
                </Animated.View>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}

        <ButtonContainer
          backgroundColor={colors.background}
          borderColor="transparent"
          hasBorder={false}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('TrainingConfig')}
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Ionicons name="school" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>S'entraîner sur ces thèmes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.getParent()?.navigate('Home', { screen: 'HomeScreen' })}
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
              Retour à l'accueil
            </Text>
          </TouchableOpacity>
        </ButtonContainer>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h4,
  },
  placeholder: {
    width: 32,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: spacing.lg,
    padding: spacing.md,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: borderRadius.md,
  },
  infoText: {
    ...typography.caption,
    flex: 1,
    marginLeft: spacing.sm,
  },
  questionCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  questionMeta: {
    flex: 1,
  },
  themeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  themeText: {
    ...typography.small,
    fontWeight: '600',
  },
  sousThemeText: {
    ...typography.small,
  },
  questionText: {
    ...typography.body,
    lineHeight: 22,
  },
  answerSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  answerRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  answerBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginHorizontal: spacing.xs,
  },
  wrongAnswer: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  correctAnswer: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  answerContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  answerLabel: {
    ...typography.small,
    color: '#6B7280',
    marginBottom: spacing.xs,
  },
  answerText: {
    ...typography.caption,
    fontWeight: '600',
  },
  explicationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  explicationText: {
    ...typography.caption,
    flex: 1,
    marginLeft: spacing.sm,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  actionButtonText: {
    ...typography.bodyBold,
    color: '#FFFFFF',
    marginLeft: spacing.sm,
  },
  secondaryButton: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  secondaryButtonText: {
    ...typography.body,
  },
});
