import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import type { Theme as DBTheme, SousTheme as DBSousTheme } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import { spacing, typography, borderRadius, shadows } from '../styles/theme';
import { TrainingStackScreenProps } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { sessionService } from '../services/sessionService';
import { ButtonContainer } from '../components/ButtonContainer';
import * as Haptics from 'expo-haptics';

/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-native/no-color-literals */

interface Theme extends DBTheme {
  sous_themes: SousTheme[];
  isExpanded: boolean;
  isSelected: boolean;
}

interface SousTheme extends DBSousTheme {
  questionCount: number;
  isSelected: boolean;
}

interface SessionSettings {
  useDefaults: boolean;
  questionType: 'QCU' | 'QCM' | 'MIXTE';
  timerEnabled: boolean;
  timePerQuestion: number;
  numberOfQuestions: number;
  scoring: {
    correct: number;
    incorrect: number;
    noAnswer: number;
    partial: number;
  };
}

export const TrainingConfigScreen: React.FC<TrainingStackScreenProps<'TrainingConfig'>> = ({
  navigation,
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [timerInputValue, setTimerInputValue] = useState('60');
  const [numberOfQuestionsValue, setNumberOfQuestionsValue] = useState('20');
  const [settings, setSettings] = useState<SessionSettings>({
    useDefaults: true,
    questionType: 'MIXTE',
    timerEnabled: false,
    timePerQuestion: 60,
    numberOfQuestions: 20,
    scoring: {
      correct: 1,
      incorrect: -0.5,
      noAnswer: -0.5,
      partial: 0.5,
    },
  });

  const checkPausedSession = useCallback(async () => {
    if (user) {
      const pausedSession = await sessionService.getLocalSession(user.id);
      if (pausedSession?.isPaused) {
        Alert.alert(
          'Session en pause',
          'Vous avez une session en pause. Voulez-vous la reprendre ?',
          [
            { text: 'Non', style: 'cancel' },
            {
              text: 'Reprendre',
              onPress: () => {
                navigation.navigate('TrainingSession', {
                  themes: [],
                  sousThemes: [],
                  settings: pausedSession.settings,
                });
              },
            },
          ]
        );
      }
    }
  }, [user, navigation]);

  useEffect(() => {
    void checkPausedSession();
    void loadThemesAndQuestions();
  }, [checkPausedSession]);

  useEffect(() => {
    setTimerInputValue(settings.timePerQuestion.toString());
    setNumberOfQuestionsValue(settings.numberOfQuestions.toString());
  }, [settings.timePerQuestion, settings.numberOfQuestions]);

  const loadThemesAndQuestions = async () => {
    try {
      setLoading(true);

      // Récupérer les thèmes et sous-thèmes
      const { data: themesData, error: themesError } = await supabase
        .from('themes')
        .select(
          `
          id,
          nom,
          description,
          couleur,
          icone,
          sous_themes (
            id,
            nom,
            description
          )
        `
        )
        .eq('actif', true)
        .order('ordre');

      if (themesError) {
        throw themesError;
      }

      // Compter les questions pour chaque sous-thème
      const { data: questionsCount, error: countError } = await supabase
        .from('questions')
        .select('sous_theme_id')
        .eq('actif', true);

      if (countError) {
        throw countError;
      }

      // Mapper les données
      const formattedThemes: Theme[] =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        themesData?.map((theme: any) => ({
          ...theme,
          isExpanded: false,
          isSelected: false,
          ordre: theme.ordre ?? 0,
          actif: theme.actif ?? true,
          created_at: theme.created_at ?? new Date().toISOString(),
          updated_at: theme.updated_at ?? new Date().toISOString(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sous_themes: theme.sous_themes.map((st: any) => ({
            ...st,
            questionCount:
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              questionsCount?.filter((q: any) => q.sous_theme_id === st.id).length ?? 0,
            isSelected: false,
          })),
        })) || [];

      setThemes(formattedThemes);
    } catch (error) {
      console.error('Erreur lors du chargement des thèmes:', error);
      Alert.alert('Erreur', 'Impossible de charger les thèmes');
    } finally {
      setLoading(false);
    }
  };

  const toggleThemeExpansion = (themeId: number) => {
    setThemes(prev =>
      prev.map(theme =>
        theme.id === themeId ? { ...theme, isExpanded: !theme.isExpanded } : theme
      )
    );
  };

  const toggleThemeSelection = (themeId: number) => {
    setThemes(prev =>
      prev.map(theme =>
        theme.id === themeId
          ? {
              ...theme,
              isSelected: !theme.isSelected,
              sous_themes: theme.sous_themes.map(st => ({
                ...st,
                isSelected: !theme.isSelected,
              })),
            }
          : theme
      )
    );
  };

  const toggleSousThemeSelection = (themeId: number, sousThemeId: number) => {
    setThemes(prev =>
      prev.map(theme =>
        theme.id === themeId
          ? {
              ...theme,
              sous_themes: theme.sous_themes.map(st =>
                st.id === sousThemeId ? { ...st, isSelected: !st.isSelected } : st
              ),
              isSelected: theme.sous_themes.some(st =>
                st.id === sousThemeId ? !st.isSelected : st.isSelected
              ),
            }
          : theme
      )
    );
  };

  const getTotalQuestions = () => {
    return themes.reduce(
      (total, theme) =>
        total +
        theme.sous_themes.reduce(
          (subTotal, st) => subTotal + (st.isSelected ? st.questionCount : 0),
          0
        ),
      0
    );
  };

  const ScoreInput = ({
    label,
    value,
    onValueChange,
    colors,
    step = 0.5,
    min = -10,
    max = 10,
  }: {
    label: string;
    value: number;
    onValueChange: (value: number) => void;
    colors: { text: string; background: string; surface: string; primary: string; border: string };
    step?: number;
    min?: number;
    max?: number;
  }) => {
    const handleDecrease = () => {
      const newValue = Math.max(min, Number((value - step).toFixed(1)));
      onValueChange(newValue);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleIncrease = () => {
      const newValue = Math.min(max, Number((value + step).toFixed(1)));
      onValueChange(newValue);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    return (
      <View style={styles.scoringItem}>
        <Text style={[styles.scoringLabel, { color: colors.text }]}>{label}</Text>
        <View style={styles.scoreInputContainer}>
          <TouchableOpacity
            style={[
              styles.scoreButton,
              {
                backgroundColor: value <= min ? colors.border : colors.primary,
                opacity: value <= min ? 0.5 : 1,
              },
            ]}
            onPress={handleDecrease}
            disabled={value <= min}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={16} color={value <= min ? colors.text : '#FFF'} />
          </TouchableOpacity>

          <View
            style={[
              styles.scoreDisplay,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.scoreValue, { color: colors.text }]}>
              {value >= 0 ? '+' : ''}
              {value.toFixed(1)}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.scoreButton,
              {
                backgroundColor: value >= max ? colors.border : colors.primary,
                opacity: value >= max ? 0.5 : 1,
              },
            ]}
            onPress={handleIncrease}
            disabled={value >= max}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color={value >= max ? colors.text : '#FFF'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const validateAndStart = () => {
    const totalQuestions = getTotalQuestions();

    if (totalQuestions === 0) {
      Alert.alert('Sélection requise', 'Veuillez sélectionner au moins un thème ou sous-thème');
      return;
    }

    if (!settings.useDefaults) {
      if (settings.timePerQuestion < 10 || settings.timePerQuestion > 300) {
        Alert.alert('Temps invalide', 'Le temps par question doit être entre 10 et 300 secondes');
        return;
      }
    }

    // Navigation vers l'écran de session avec les paramètres
    const selectedThemes = themes.filter(
      t => t.isSelected || t.sous_themes.some(st => st.isSelected)
    );
    const selectedSousThemes = selectedThemes.flatMap(t =>
      t.sous_themes.filter(st => st.isSelected).map(st => st.id)
    );

    // Navigation vers la session d'entraînement
    navigation.navigate('TrainingSession', {
      themes: selectedThemes.map(t => t.id),
      sousThemes: selectedSousThemes,
      settings: settings,
    });
  };

  const renderThemeItem = (theme: Theme) => (
    <View key={theme.id} style={[styles.themeContainer, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        style={styles.themeHeader}
        onPress={() => toggleThemeExpansion(theme.id)}
        activeOpacity={0.7}
      >
        <View style={styles.themeLeft}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              { borderColor: colors.border },
              theme.isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => toggleThemeSelection(theme.id)}
          >
            {theme.isSelected && <Ionicons name="checkmark" size={16} color={colors.surface} />}
          </TouchableOpacity>
          <View style={[styles.themeIcon, { backgroundColor: `${theme.couleur}20` }]}>
            <Ionicons
              name={theme.icone as keyof typeof Ionicons.glyphMap}
              size={20}
              color={theme.couleur}
            />
          </View>
          <View style={styles.themeInfo}>
            <Text style={[styles.themeName, { color: colors.text }]}>{theme.nom}</Text>
            <Text style={[styles.themeDesc, { color: colors.textSecondary }]}>
              {theme.sous_themes.length} sous-thèmes
            </Text>
          </View>
        </View>
        <Ionicons
          name={theme.isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {theme.isExpanded && (
        <View style={styles.sousThemesList}>
          {theme.sous_themes.map(sousTheme => (
            <TouchableOpacity
              key={sousTheme.id}
              style={styles.sousThemeItem}
              onPress={() => toggleSousThemeSelection(theme.id, sousTheme.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  styles.sousThemeCheckbox,
                  { borderColor: colors.border },
                  sousTheme.isSelected && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
              >
                {sousTheme.isSelected && (
                  <Ionicons name="checkmark" size={14} color={colors.surface} />
                )}
              </View>
              <View style={styles.sousThemeInfo}>
                <Text style={[styles.sousThemeName, { color: colors.text }]}>{sousTheme.nom}</Text>
                <Text style={[styles.questionCount, { color: colors.textSecondary }]}>
                  {sousTheme.questionCount} questions
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderSettings = () => (
    <View style={[styles.settingsContainer, { backgroundColor: colors.surface }]}>
      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          Utiliser les paramètres par défaut
        </Text>
        <Switch
          value={settings.useDefaults}
          onValueChange={value => setSettings(prev => ({ ...prev, useDefaults: value }))}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>

      {!settings.useDefaults && (
        <>
          <View style={styles.separator} />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Type de questions</Text>
          <View style={styles.radioGroup}>
            {['QCU', 'QCM', 'MIXTE'].map(type => (
              <TouchableOpacity
                key={type}
                style={styles.radioOption}
                onPress={() =>
                  setSettings(prev => ({ ...prev, questionType: type as 'QCU' | 'QCM' | 'MIXTE' }))
                }
              >
                <View
                  style={[
                    styles.radio,
                    { borderColor: colors.border },
                    settings.questionType === type && { borderColor: colors.primary },
                  ]}
                >
                  {settings.questionType === type && (
                    <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                  )}
                </View>
                <Text style={[styles.radioLabel, { color: colors.text }]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.separator} />

          <View style={styles.timerInput}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Nombre de questions
            </Text>
            <TextInput
              style={[
                styles.numberInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              value={numberOfQuestionsValue}
              onChangeText={setNumberOfQuestionsValue}
              onBlur={() => {
                const num = parseInt(numberOfQuestionsValue);
                if (!isNaN(num) && num >= 1 && num <= 100) {
                  setSettings(prev => ({ ...prev, numberOfQuestions: num }));
                } else {
                  setNumberOfQuestionsValue(settings.numberOfQuestions.toString());
                }
              }}
              keyboardType="numeric"
              maxLength={3}
              placeholder="20"
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Chronomètre</Text>
            <Switch
              value={settings.timerEnabled}
              onValueChange={value => setSettings(prev => ({ ...prev, timerEnabled: value }))}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>

          {settings.timerEnabled && (
            <View style={styles.timerInput}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Temps par question (secondes)
              </Text>
              <TextInput
                style={[
                  styles.numberInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                value={timerInputValue}
                onChangeText={setTimerInputValue}
                onBlur={() => {
                  const num = parseInt(timerInputValue);
                  if (!isNaN(num) && num >= 10 && num <= 300) {
                    setSettings(prev => ({ ...prev, timePerQuestion: num }));
                  } else {
                    setTimerInputValue(settings.timePerQuestion.toString());
                  }
                }}
                keyboardType="numeric"
                maxLength={3}
                placeholder="60"
              />
            </View>
          )}

          <View style={styles.separator} />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Barème</Text>
          <View style={styles.scoringGrid}>
            <ScoreInput
              label="Bonne réponse"
              value={settings.scoring.correct}
              onValueChange={value =>
                setSettings(prev => ({
                  ...prev,
                  scoring: { ...prev.scoring, correct: value },
                }))
              }
              colors={colors}
              step={0.5}
              min={0}
              max={10}
            />

            <ScoreInput
              label="Mauvaise réponse"
              value={settings.scoring.incorrect}
              onValueChange={value =>
                setSettings(prev => ({
                  ...prev,
                  scoring: { ...prev.scoring, incorrect: value },
                }))
              }
              colors={colors}
              step={0.5}
              min={-5}
              max={0}
            />

            <ScoreInput
              label="Sans réponse"
              value={settings.scoring.noAnswer}
              onValueChange={value =>
                setSettings(prev => ({
                  ...prev,
                  scoring: { ...prev.scoring, noAnswer: value },
                }))
              }
              colors={colors}
              step={0.5}
              min={-5}
              max={0}
            />

            <ScoreInput
              label="Réponse partielle"
              value={settings.scoring.partial}
              onValueChange={value =>
                setSettings(prev => ({
                  ...prev,
                  scoring: { ...prev.scoring, partial: value },
                }))
              }
              colors={colors}
              step={0.5}
              min={0}
              max={5}
            />
          </View>
        </>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Configuration de l'entraînement
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Sélection des thèmes</Text>
        {themes.map(renderThemeItem)}

        <Text style={[styles.sectionHeader, { color: colors.text }]}>Paramètres de session</Text>
        {renderSettings()}
      </ScrollView>

      <ButtonContainer
        backgroundColor={colors.background}
        borderColor={colors.border}
        floating={false}
      >
        <TouchableOpacity
          style={[
            styles.startButton,
            { backgroundColor: colors.primary },
            getTotalQuestions() === 0 && styles.disabledButton,
          ]}
          onPress={validateAndStart}
          disabled={getTotalQuestions() === 0}
        >
          <Text style={styles.startButtonText}>Commencer l'entraînement</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </ButtonContainer>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.h3,
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    ...typography.bodyBold,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  themeContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  themeIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    ...typography.bodyBold,
  },
  themeDesc: {
    ...typography.small,
    marginTop: 2,
  },
  sousThemesList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  sousThemeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingLeft: spacing.xl + spacing.md,
  },
  sousThemeCheckbox: {
    width: 20,
    height: 20,
  },
  sousThemeInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  sousThemeName: {
    ...typography.body,
  },
  questionCount: {
    ...typography.small,
    marginTop: 2,
  },
  settingsContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  settingLabel: {
    ...typography.body,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: spacing.md,
  },
  sectionTitle: {
    ...typography.bodyBold,
    marginBottom: spacing.sm,
  },
  radioGroup: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    ...typography.body,
  },
  timerInput: {
    marginTop: spacing.sm,
  },
  inputLabel: {
    ...typography.small,
    marginBottom: spacing.xs,
  },
  numberInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    width: 100,
  },
  scoringGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  scoringItem: {
    width: '50%',
    paddingRight: spacing.sm,
    marginBottom: spacing.md,
  },
  scoringLabel: {
    ...typography.small,
    marginBottom: spacing.xs,
  },
  scoreInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreDisplay: {
    flex: 1,
    marginHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  scoreValue: {
    ...typography.bodyBold,
    minWidth: 40,
    textAlign: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  startButtonText: {
    ...typography.bodyBold,
    color: '#FFF',
    marginRight: spacing.sm,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
