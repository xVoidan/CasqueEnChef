import React, { memo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { shadows, typography, spacing, borderRadius } from '../../styles/theme';
import { SessionStats, FailedQuestion } from '../../hooks/useSessionAnalytics';
import { ThemeColors } from '../../types/theme.types';

interface DetailsTabProps {
  stats: SessionStats;
  colors: ThemeColors;
  onReviewQuestions: (questions: FailedQuestion[]) => void;
}

export const DetailsTab = memo<DetailsTabProps>(({ stats, colors, onReviewQuestions }) => {
  const [selectedTheme, setSelectedTheme] = useState<number | null>(null);

  const toggleTheme = useCallback((themeId: number) => {
    setSelectedTheme(prev => (prev === themeId ? null : themeId));
  }, []);

  const handleReviewAllQuestions = useCallback(() => {
    onReviewQuestions(stats.failedQuestions);
  }, [stats.failedQuestions, onReviewQuestions]);

  const handleReviewQuestion = useCallback(
    (question: FailedQuestion) => {
      onReviewQuestions([question]);
    },
    [onReviewQuestions]
  );

  return (
    <>
      {/* Détails par thème */}
      <Animated.View
        entering={FadeInUp.duration(600)}
        style={[styles.themeCard, { backgroundColor: colors.surface }, shadows.sm]}
        accessibilityLabel="Analyse détaillée par thème"
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]} accessibilityRole="header">
          Analyse détaillée
        </Text>

        {stats.themeStats.map(theme => (
          <TouchableOpacity
            key={theme.themeId}
            style={styles.themeItem}
            onPress={() => toggleTheme(theme.themeId)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${theme.themeName}: ${theme.correctAnswers} sur ${theme.totalQuestions}, ${theme.successRate.toFixed(0)}%. Appuyez pour voir les détails`}
            accessibilityState={{ expanded: selectedTheme === theme.themeId }}
          >
            <View style={styles.themeHeader}>
              <View style={styles.themeLeft}>
                <View
                  style={[styles.themeColorIndicator, { backgroundColor: theme.themeColor }]}
                  accessibilityElementsHidden
                />
                <View style={styles.flexOne}>
                  <Text style={[styles.themeName, { color: colors.text }]}>{theme.themeName}</Text>
                  <View
                    style={styles.themeProgressBar}
                    accessibilityRole="progressbar"
                    accessibilityValue={{ now: theme.successRate, min: 0, max: 100 }}
                  >
                    <Animated.View
                      style={[
                        styles.themeProgressFill,
                        {
                          backgroundColor: theme.themeColor,
                          width: `${theme.successRate}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.themeInsight, { color: colors.textSecondary }]}>
                    {theme.successRate >= 80
                      ? '✨ Excellent niveau'
                      : theme.successRate >= 60
                        ? '💪 Bon niveau'
                        : '📚 À réviser'}
                  </Text>
                </View>
              </View>
              <View style={styles.themeRight}>
                <Text style={[styles.themeScore, { color: colors.text }]}>
                  {theme.correctAnswers}/{theme.totalQuestions}
                </Text>
                <Text style={[styles.themePercentage, { color: colors.textSecondary }]}>
                  {theme.successRate.toFixed(0)}%
                </Text>
                <Ionicons
                  name={selectedTheme === theme.themeId ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.textSecondary}
                />
              </View>
            </View>

            {selectedTheme === theme.themeId && (
              <Animated.View
                entering={FadeInDown.duration(300)}
                style={styles.sousThemesList}
                accessibilityRole="list"
              >
                {theme.sousThemes.map(sousTheme => (
                  <View
                    key={sousTheme.sousThemeId}
                    style={styles.sousThemeItem}
                    accessibilityLabel={`${sousTheme.sousThemeName}: ${sousTheme.correctAnswers} sur ${sousTheme.totalQuestions}`}
                  >
                    <Text style={[styles.sousThemeName, { color: colors.textSecondary }]}>
                      • {sousTheme.sousThemeName}
                    </Text>
                    <View style={styles.sousThemeRight}>
                      <Text style={[styles.sousThemeScore, { color: colors.text }]}>
                        {sousTheme.correctAnswers}/{sousTheme.totalQuestions}
                      </Text>
                      {sousTheme.successRate < 50 && (
                        <Ionicons name="alert-circle" size={14} color="#EF4444" />
                      )}
                    </View>
                  </View>
                ))}
              </Animated.View>
            )}
          </TouchableOpacity>
        ))}

        {/* Statistiques globales */}
        <View style={[styles.globalStats, { borderTopColor: colors.border }]}>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Temps moyen par question
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.averageTime ? `${stats.averageTime.toFixed(0)}s` : 'N/A'}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Points gagnés</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>+{stats.pointsEarned}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Questions échouées */}
      {stats.failedQuestions.length > 0 && (
        <Animated.View
          entering={FadeInUp.duration(600).delay(200)}
          style={[styles.failedQuestionsCard, { backgroundColor: colors.surface }]}
          accessibilityLabel={`${stats.failedQuestions.length} questions à revoir`}
        >
          <View style={styles.failedQuestionsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Questions à revoir ({stats.failedQuestions.length})
            </Text>
          </View>

          <ScrollView
            style={styles.failedQuestionsList}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          >
            {stats.failedQuestions && stats.failedQuestions.length > 0 ? (
              stats.failedQuestions.map((question, index) => (
                <TouchableOpacity
                  key={question.questionId}
                  style={[styles.failedQuestionItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleReviewQuestion(question)}
                  accessibilityRole="button"
                  accessibilityLabel={`Question ${index + 1}: ${question.enonce}. Appuyez pour réviser`}
                >
                  <View style={styles.failedQuestionContent}>
                    <Text
                      style={[styles.failedQuestionText, { color: colors.text }]}
                      numberOfLines={2}
                    >
                      {question.enonce}
                    </Text>
                    <View style={styles.failedQuestionInfo}>
                      <View style={styles.failedQuestionTags}>
                        <Text style={[styles.failedTheme, { color: colors.textSecondary }]}>
                          {question.themeName}
                        </Text>
                        {question.sousThemeName && (
                          <Text style={[styles.failedSousTheme, { color: colors.textSecondary }]}>
                            • {question.sousThemeName}
                          </Text>
                        )}
                      </View>
                      <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                    </View>
                    <View style={styles.answerComparison}>
                      <View style={styles.answerBox}>
                        <Text style={[styles.answerLabel, { color: colors.textSecondary }]}>
                          Votre réponse:
                        </Text>
                        <Text style={[styles.answerText, styles.errorText]}>
                          {question.userAnswer ?? 'Pas de réponse'}
                        </Text>
                      </View>
                      <View style={styles.answerBox}>
                        <Text style={[styles.answerLabel, { color: colors.textSecondary }]}>
                          Bonne réponse:
                        </Text>
                        <Text style={[styles.answerText, styles.successText]}>
                          {question.correctAnswer}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[styles.noQuestionsText, { color: colors.textSecondary }]}>
                Aucune question à afficher
              </Text>
            )}
          </ScrollView>

          {stats.failedQuestions.length > 0 && (
            <TouchableOpacity
              style={[styles.reviewAllButton, { backgroundColor: colors.primary }]}
              onPress={handleReviewAllQuestions}
              accessibilityRole="button"
              accessibilityLabel="Réviser toutes les questions échouées"
            >
              <Ionicons name="book" size={20} color="#FFF" />
              <Text style={styles.reviewAllText}>Réviser toutes les questions</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* Message si aucune erreur */}
      {stats.failedQuestions.length === 0 && (
        <Animated.View
          entering={FadeInUp.duration(600).delay(200)}
          style={[styles.perfectCard, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="trophy" size={48} color="#FFD700" />
          <Text style={[styles.perfectTitle, { color: colors.text }]}>Aucune erreur!</Text>
          <Text style={[styles.perfectMessage, { color: colors.textSecondary }]}>
            Félicitations! Vous avez répondu correctement à toutes les questions.
          </Text>
        </Animated.View>
      )}
    </>
  );
});

const styles = StyleSheet.create({
  themeCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  themeItem: {
    marginBottom: spacing.md,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeColorIndicator: {
    width: 4,
    height: 50,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  themeName: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  themeProgressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  themeProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  themeInsight: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  themeRight: {
    alignItems: 'flex-end',
  },
  themeScore: {
    ...typography.bodyBold,
  },
  themePercentage: {
    ...typography.small,
  },
  sousThemesList: {
    paddingLeft: spacing.xl,
    paddingTop: spacing.sm,
  },
  sousThemeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  sousThemeName: {
    ...typography.small,
    flex: 1,
  },
  sousThemeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sousThemeScore: {
    ...typography.small,
    fontWeight: '600',
  },
  globalStats: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.small,
  },
  statValue: {
    ...typography.small,
    fontWeight: '600',
  },
  failedQuestionsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  failedQuestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  expandButton: {
    ...typography.small,
    fontWeight: '600',
  },
  failedQuestionsList: {
    maxHeight: 300,
    marginBottom: spacing.md,
  },
  failedQuestionItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  failedQuestionContent: {
    flex: 1,
  },
  failedQuestionText: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  failedQuestionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  failedQuestionTags: {
    flexDirection: 'row',
    flex: 1,
  },
  failedTheme: {
    ...typography.caption,
  },
  failedSousTheme: {
    ...typography.caption,
    marginLeft: spacing.xs,
  },
  answerComparison: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  answerBox: {
    flex: 1,
  },
  answerLabel: {
    ...typography.caption,
    marginBottom: 2,
  },
  answerText: {
    ...typography.small,
    fontWeight: '600',
  },
  reviewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  reviewAllText: {
    ...typography.body,
    fontWeight: '600',
  },
  flexOne: {
    flex: 1,
  },
  errorText: {
    color: '#EF4444',
  },
  successText: {
    color: '#10B981',
  },
  perfectCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  perfectTitle: {
    ...typography.h4,
    marginTop: spacing.md,
  },
  perfectMessage: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  noQuestionsText: {
    ...typography.body,
    textAlign: 'center',
    padding: spacing.lg,
    fontStyle: 'italic',
  },
});

DetailsTab.displayName = 'DetailsTab';
