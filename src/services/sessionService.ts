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
  numberOfQuestions?: number;
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
      .from('sessions_quiz')
      .insert({
        user_id: userId,
        quiz_id: 1, // ID de quiz par défaut pour l'entraînement libre
        score_actuel: 0,
        score_final: null,
        question_actuelle: 1,
        temps_total: 0,
        temps_passe: 0,
        questions_repondues: 0,
        reponses_correctes: 0,
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

        // Tentative de sauvegarde avec les données

        // Tentative d'insertion avec gestion d'erreur améliorée
        const insertData = {
          session_id: sessionId,
          question_id: answer.questionId,
          reponse_id: reponseId,
          est_correcte: answer.isCorrect,
          temps_reponse: answer.timeSpent,
        };

        // Essayer d'abord avec la fonction RPC de contournement
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let error: any = null;

        try {
          const { data: rpcResult, error: rpcError } = await supabase.rpc('insert_reponse_bypass', {
            p_session_id: sessionId,
            p_question_id: answer.questionId,
            p_reponse_id: reponseId,
            p_est_correcte: answer.isCorrect,
            p_temps_reponse: answer.timeSpent,
          });

          if (rpcError) {
            // Si la fonction RPC n'existe pas, essayer l'insertion normale
            if (
              rpcError.message?.includes('function') ||
              rpcError.message?.includes('does not exist')
            ) {
              // Insertion normale sans la fonction RPC
              const { error: insertError } = await supabase
                .from('reponses_utilisateur')
                .insert(insertData);
              error = insertError;
            } else {
              error = rpcError;
            }
          } else if (rpcResult && !rpcResult.success) {
            error = { message: rpcResult.error ?? 'Erreur RPC' };
          }
        } catch {
          // En cas d'erreur, essayer l'insertion normale
          const { error: insertError } = await supabase
            .from('reponses_utilisateur')
            .insert(insertData);
          error = insertError;
        }

        if (error) {
          // Si l'erreur est liée à "du.complete", c'est un problème de politique RLS
          if (error.message?.includes('du.complete')) {
            console.error(
              '\n🔴🔴🔴 ERREUR CRITIQUE DE POLITIQUE RLS 🔴🔴🔴',
              '\n',
              '\n📋 SOLUTION IMMÉDIATE (dans Supabase SQL Editor):',
              '\n',
              '\nALTER TABLE reponses_utilisateur DISABLE ROW LEVEL SECURITY;',
              '\n',
              '\n✅ Cela résoudra le problème immédiatement.',
              '\n',
              '\n📝 Pour une solution permanente:',
              '\n1. Exécutez: supabase/find_du_complete_everywhere.sql',
              '\n2. Identifiez la politique problématique',
              '\n3. Exécutez: supabase/URGENT_fix_rls_complete.sql',
              '\n',
              '\n⚠️ RLS sera désactivé temporairement pour cette table.'
            );
            console.error('Données tentées:', insertData);

            // Essayer de sauvegarder localement en attendant
            try {
              const localKey = `pending_answer_${sessionId}_${answer.questionId}`;
              await AsyncStorage.setItem(localKey, JSON.stringify(insertData));
              console.warn('💾 Réponse sauvegardée localement en attendant la correction');
            } catch (localError) {
              console.error('Impossible de sauvegarder localement:', localError);
            }
          }

          console.error(
            'Erreur lors de la sauvegarde dans Supabase:',
            JSON.stringify(error, null, 2)
          );
          console.error("Détails de l'erreur:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
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
          .from('sessions_quiz')
          .update({
            score_actuel: session.score,
            score_final: session.score,
            reponses_correctes: correctAnswers,
            questions_repondues: session.answers.length,
            temps_total: totalTime,
            temps_passe: totalTime,
            statut: status,
            completed_at: new Date().toISOString(),
          })
          .eq('id', sessionId);
      }

      // Nettoyer la session locale
      await AsyncStorage.removeItem(`${this.SESSION_KEY}${userId}`);

      // Retourner les données de session pour l'écran de rapport
      // Le total de questions est basé sur le nombre de questions réellement posées/répondues
      // Pas sur le nombre total de questions disponibles dans la base
      const answeredQuestions = session.answers.length;
      const effectiveTotalQuestions = answeredQuestions;

      return {
        sessionId,
        score: session.score,
        totalQuestions: effectiveTotalQuestions,
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
        // Pour une session abandonnée, ne traiter que les questions répondues
        const answer = sessionData.answers[index];

        // Si pas de réponse (session abandonnée), ignorer cette question dans les stats
        if (!answer && index >= sessionData.answers.length) {
          return;
        }

        const sousTheme = sousThemesData?.find(st => st.id === question.sous_theme_id);

        if (sousTheme?.theme) {
          const theme = Array.isArray(sousTheme.theme) ? sousTheme.theme[0] : sousTheme.theme;
          const themeId = theme.id;

          if (!themeStatsMap.has(themeId)) {
            themeStatsMap.set(themeId, {
              themeId,
              themeName: theme.nom,
              themeColor: theme.couleur,
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sousThemes: Array.from(theme.sousThemes.values()).map((st: any) => ({
          ...st,
          successRate: (st.correctAnswers / st.totalQuestions) * 100,
        })),
      }));

      // Récupérer les questions échouées avec leurs détails
      const failedQuestions = sessionData.questions
        .slice(0, sessionData.answers.length) // Ne prendre que les questions répondues
        .map((question, index) => {
          const answer = sessionData.answers[index];
          if (!answer || answer.isCorrect) {
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
            themeName:
              (Array.isArray(sousTheme?.theme)
                ? sousTheme?.theme[0]?.nom
                : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (sousTheme?.theme as any)?.nom) ?? '',
            sousThemeName: sousTheme?.nom ?? '',
            userAnswer: userAnswerText,
            correctAnswer: correctAnswerText,
            explication: question.explication?.texte_explication ?? '',
          };
        })
        .filter(q => q !== null);

      // Pour le calcul de la réussite et du temps moyen, utiliser le nombre de questions répondues
      const answeredQuestions = Math.min(sessionData.answers.length, sessionData.totalQuestions);
      const successRate =
        answeredQuestions > 0 ? (sessionData.correctAnswers / answeredQuestions) * 100 : 0;
      const averageTime =
        answeredQuestions > 0 ? Math.floor(sessionData.totalTime / answeredQuestions) : 0;

      // Vérifier si la session contient des questions QCM
      const hasQCM = sessionData.questions.some(q => q.type_question === 'QCM');

      // Calculer la série de bonnes réponses consécutives
      let currentStreak = 0;
      let maxStreak = 0;
      sessionData.answers.forEach(answer => {
        if (answer.isCorrect) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      });

      return {
        sessionId: sessionData.sessionId,
        score: sessionData.score,
        totalQuestions: sessionData.totalQuestions,
        correctAnswers: sessionData.correctAnswers,
        successRate: successRate,
        totalTime: sessionData.totalTime,
        averageTime: averageTime,
        themeStats,
        failedQuestions,
        pointsEarned: Math.round(sessionData.score),
        hasQCM,
        streakCount: maxStreak,
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
