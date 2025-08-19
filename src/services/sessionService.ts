import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Question {
  id: number;
  enonce: string;
  type_question: 'QCU' | 'QCM';
  niveau_difficulte: number;
  temps_limite: number;
  points: number;
  sous_theme_id: number;
  reponses: Answer[];
  explication?: Explanation;
}

export interface Answer {
  id: number;
  lettre: 'A' | 'B' | 'C' | 'D';
  texte: string;
  est_correcte: boolean;
}

export interface Explanation {
  texte_explication: string;
  source?: string;
  lien_ressource?: string;
}

export interface SessionData {
  id?: number;
  profile_id: string;
  questions: Question[];
  currentQuestionIndex: number;
  answers: UserAnswer[];
  score: number;
  startTime: Date;
  isPaused: boolean;
  settings: SessionSettings;
}

export interface UserAnswer {
  questionId: number;
  selectedAnswers: number[];
  isCorrect: boolean;
  points: number;
  timeSpent: number;
}

export interface SessionSettings {
  questionType: 'QCU' | 'QCM' | 'MIXTE';
  timerEnabled: boolean;
  timePerQuestion: number;
  scoring: {
    correct: number;
    incorrect: number;
    noAnswer: number;
    partial: number;
  };
}

class SessionService {
  private readonly SESSION_KEY = '@training_session_';

  async loadQuestions(
    sousThemeIds: number[],
    questionType: 'QCU' | 'QCM' | 'MIXTE',
    limit?: number
  ): Promise<Question[]> {
    try {
      let query = supabase
        .from('questions')
        .select(
          `
          id,
          enonce,
          type_question,
          niveau_difficulte,
          temps_limite,
          points,
          sous_theme_id,
          reponses (
            id,
            lettre,
            texte,
            est_correcte
          ),
          explications (
            texte_explication,
            source,
            lien_ressource
          )
        `
        )
        .in('sous_theme_id', sousThemeIds)
        .eq('actif', true);

      // Filtrer par type si nécessaire
      if (questionType !== 'MIXTE') {
        query = query.eq('type_question', questionType);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Mélanger les questions
      const shuffledQuestions = this.shuffleArray(data ?? []);

      // Limiter si nécessaire
      const questions = limit ? shuffledQuestions.slice(0, limit) : shuffledQuestions;

      // Formatter les questions
      return questions.map(q => {
        // Les explications peuvent être un tableau ou un objet unique
        const explicationData = Array.isArray(q.explications) ? q.explications[0] : q.explications;

        const formatted = {
          ...q,
          explication: explicationData ?? undefined,
          reponses: this.shuffleArray(q.reponses ?? []),
        };
        return formatted;
      });
    } catch (error) {
      console.error('Erreur lors du chargement des questions:', error);
      throw error;
    }
  }

  async createSession(
    userId: string,
    questions: Question[],
    settings: SessionSettings
  ): Promise<SessionData> {
    const sessionData: SessionData = {
      profile_id: userId,
      questions,
      currentQuestionIndex: 0,
      answers: [],
      score: 0,
      startTime: new Date(),
      isPaused: false,
      settings,
    };

    // Sauvegarder dans la base de données
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        profile_id: userId,
        type_session: 'entrainement',
        score: 0,
        nombre_questions: questions.length,
        nombre_reponses_correctes: 0,
        temps_total: 0,
        statut: 'en_cours',
      })
      .select('id');

    if (error) {
      console.error('Erreur lors de la création de la session:', error);
    } else if (data && data.length > 0) {
      sessionData.id = data[0].id;
    }

    // Sauvegarder localement
    await this.saveSessionLocally(userId, sessionData);

    return sessionData;
  }

  async saveSessionLocally(userId: string, session: SessionData): Promise<void> {
    try {
      await AsyncStorage.setItem(`${this.SESSION_KEY}${userId}`, JSON.stringify(session));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde locale:', error);
    }
  }

  async getLocalSession(userId: string): Promise<SessionData | null> {
    try {
      const data = await AsyncStorage.getItem(`${this.SESSION_KEY}${userId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération de la session:', error);
      return null;
    }
  }

  async clearLocalSession(userId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.SESSION_KEY}${userId}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de la session locale:', error);
    }
  }

  async saveAnswer(
    userId: string,
    sessionId: number | undefined,
    answer: UserAnswer
  ): Promise<void> {
    try {
      // Récupérer la session locale
      const session = await this.getLocalSession(userId);
      if (session) {
        session.answers.push(answer);
        session.score += answer.points;
        await this.saveSessionLocally(userId, session);
      }

      // Sauvegarder dans la base de données si session existe
      if (sessionId) {
        // Pour QCM, on peut avoir plusieurs réponses sélectionnées
        // On prend la première réponse sélectionnée ou null si aucune
        const reponseId = answer.selectedAnswers.length > 0 ? answer.selectedAnswers[0] : null;

        console.log('Tentative de sauvegarde avec:', {
          session_id: sessionId,
          question_id: answer.questionId,
          reponse_id: reponseId,
          est_correcte: answer.isCorrect,
          temps_reponse: answer.timeSpent,
        });

        const { error } = await supabase
          .from('reponses_utilisateur')
          .insert({
            session_id: sessionId,
            question_id: answer.questionId,
            reponse_id: reponseId,
            est_correcte: answer.isCorrect,
            temps_reponse: answer.timeSpent,
          });

        if (error) {
          console.error('Erreur lors de la sauvegarde dans Supabase:', JSON.stringify(error, null, 2));
          console.error('Détails de l\'erreur:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }
      } else {
        console.warn('Session ID non défini - impossible de sauvegarder la réponse dans Supabase');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la réponse:', error);
      // Ne pas propager l'erreur pour ne pas bloquer l'utilisateur
      // mais logger pour le débogage
    }
  }

  async endSession(
    userId: string,
    sessionId: number | undefined,
    status: 'terminee' | 'abandonnee' = 'terminee'
  ): Promise<{
    sessionId: number | undefined;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    totalTime: number;
    answers: UserAnswer[];
    questions: Question[];
  } | null> {
    try {
      const session = await this.getLocalSession(userId);

      if (!session) {
        return null;
      }

      const totalTime = Math.floor(
        (new Date().getTime() - new Date(session.startTime).getTime()) / 1000
      );
      const correctAnswers = session.answers.filter(a => a.isCorrect).length;

      if (sessionId) {
        await supabase
          .from('sessions')
          .update({
            score: session.score,
            nombre_reponses_correctes: correctAnswers,
            temps_total: totalTime,
            statut: status,
            date_fin: new Date().toISOString(),
          })
          .eq('id', sessionId);
      }

      // Nettoyer la session locale
      await AsyncStorage.removeItem(`${this.SESSION_KEY}${userId}`);

      // Retourner les données de session pour l'écran de rapport
      return {
        sessionId,
        score: session.score,
        totalQuestions: session.questions.length,
        correctAnswers,
        totalTime,
        answers: session.answers,
        questions: session.questions,
      };
    } catch (error) {
      console.error('Erreur lors de la fin de session:', error);
      return null;
    }
  }

  calculateScore(
    question: Question,
    selectedAnswers: number[],
    settings: SessionSettings
  ): { isCorrect: boolean; points: number; isPartial?: boolean } {
    const correctAnswerIds = question.reponses.filter(r => r.est_correcte).map(r => r.id);

    if (selectedAnswers.length === 0) {
      return {
        isCorrect: false,
        points: settings.scoring.noAnswer,
      };
    }

    if (question.type_question === 'QCU') {
      const isCorrect =
        selectedAnswers.length === 1 && correctAnswerIds.includes(selectedAnswers[0]);
      return {
        isCorrect,
        points: isCorrect ? settings.scoring.correct : settings.scoring.incorrect,
      };
    } else {
      // QCM
      const correctSelections = selectedAnswers.filter(id => correctAnswerIds.includes(id)).length;
      const incorrectSelections = selectedAnswers.filter(
        id => !correctAnswerIds.includes(id)
      ).length;

      if (incorrectSelections === 0 && correctSelections === correctAnswerIds.length) {
        // Toutes les bonnes réponses et aucune mauvaise
        return {
          isCorrect: true,
          points: settings.scoring.correct,
        };
      } else if (correctSelections > 0 && incorrectSelections === 0) {
        // Réponse partielle correcte
        return {
          isCorrect: false,
          points: settings.scoring.partial,
          isPartial: true,
        };
      } else {
        // Réponse incorrecte
        return {
          isCorrect: false,
          points: settings.scoring.incorrect,
        };
      }
    }
  }

  async getSessionStats(sessionData: {
    sessionId: number | undefined;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    totalTime: number;
    answers: UserAnswer[];
    questions: Question[];
  }) {
    try {
      // Récupérer les informations des thèmes et sous-thèmes
      const sousThemeIds = [...new Set(sessionData.questions.map(q => q.sous_theme_id))];

      const { data: sousThemesData, error } = await supabase
        .from('sous_themes')
        .select(
          `
          id,
          nom,
          theme:themes (
            id,
            nom,
            couleur
          )
        `
        )
        .in('id', sousThemeIds);

      if (error) {
        throw error;
      }

      // Calculer les statistiques par thème
      const themeStatsMap = new Map();

      sessionData.questions.forEach((question, index) => {
        const answer = sessionData.answers[index];
        const sousTheme = sousThemesData?.find(st => st.id === question.sous_theme_id);

        if (sousTheme?.theme) {
          const themeId = sousTheme.theme.id;

          if (!themeStatsMap.has(themeId)) {
            themeStatsMap.set(themeId, {
              themeId,
              themeName: sousTheme.theme.nom,
              themeColor: sousTheme.theme.couleur,
              totalQuestions: 0,
              correctAnswers: 0,
              points: 0,
              sousThemes: new Map(),
            });
          }

          const themeStat = themeStatsMap.get(themeId);
          themeStat.totalQuestions++;
          if (answer?.isCorrect) {
            themeStat.correctAnswers++;
          }
          themeStat.points += answer?.points ?? 0;

          // Stats par sous-thème
          if (!themeStat.sousThemes.has(sousTheme.id)) {
            themeStat.sousThemes.set(sousTheme.id, {
              sousThemeId: sousTheme.id,
              sousThemeName: sousTheme.nom,
              totalQuestions: 0,
              correctAnswers: 0,
            });
          }

          const sousThemeStat = themeStat.sousThemes.get(sousTheme.id);
          sousThemeStat.totalQuestions++;
          if (answer?.isCorrect) {
            sousThemeStat.correctAnswers++;
          }
        }
      });

      // Convertir en tableau et calculer les taux de réussite
      const themeStats = Array.from(themeStatsMap.values()).map(theme => ({
        ...theme,
        successRate: (theme.correctAnswers / theme.totalQuestions) * 100,
        sousThemes: Array.from(theme.sousThemes.values()).map(st => ({
          ...st,
          successRate: (st.correctAnswers / st.totalQuestions) * 100,
        })),
      }));

      // Récupérer les questions échouées avec leurs détails
      const failedQuestions = sessionData.questions
        .map((question, index) => {
          const answer = sessionData.answers[index];
          if (!answer ?? answer.isCorrect) {
            return null;
          }

          const sousTheme = sousThemesData?.find(st => st.id === question.sous_theme_id);
          const userAnswerText =
            answer.selectedAnswers.length > 0
              ? question.reponses.find(r => r.id === answer.selectedAnswers[0])?.texte
              : null;
          const correctAnswerText = question.reponses.find(r => r.est_correcte)?.texte ?? '';

          return {
            questionId: question.id,
            enonce: question.enonce,
            themeName: sousTheme?.theme?.nom ?? '',
            sousThemeName: sousTheme?.nom ?? '',
            userAnswer: userAnswerText,
            correctAnswer: correctAnswerText,
            explication: question.explication?.texte_explication ?? '',
          };
        })
        .filter(q => q !== null);

      return {
        sessionId: sessionData.sessionId,
        score: sessionData.score,
        totalQuestions: sessionData.totalQuestions,
        correctAnswers: sessionData.correctAnswers,
        successRate: (sessionData.correctAnswers / sessionData.totalQuestions) * 100,
        totalTime: sessionData.totalTime,
        averageTime: Math.floor(sessionData.totalTime / sessionData.totalQuestions),
        themeStats,
        failedQuestions,
        pointsEarned: Math.round(sessionData.score),
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      return null;
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export const sessionService = new SessionService();
