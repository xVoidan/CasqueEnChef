/**
 * Hook personnalisé pour la gestion des sessions avec React Query
 * Optimise les performances et gère le cache automatiquement
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { queryKeys } from '../lib/queryClient';
import type { Database } from '../types/database.types';

type Session = Database['public']['Tables']['sessions_quiz']['Row'];
type ReponseUtilisateur = Database['public']['Tables']['reponses_utilisateur']['Row'];

interface SessionWithDetails extends Session {
  quiz?: {
    id: number;
    titre: string;
    nombre_questions: number;
  };
  reponses_utilisateur?: ReponseUtilisateur[];
}

/**
 * Hook pour récupérer les sessions d'un utilisateur
 */
export function useUserSessions(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.session.list(userId ?? ''),
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const { data, error } = await supabase
        .from('sessions_quiz')
        .select(
          `
          *,
          quiz (
            id,
            titre,
            nombre_questions,
            duree_minutes,
            categories (nom)
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      return data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook pour récupérer la session active
 */
export function useActiveSession(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.session.current(userId ?? ''),
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const { data, error } = await supabase
        .from('sessions_quiz')
        .select(
          `
          *,
          quiz (
            *,
            questions (
              *,
              reponses (*)
            )
          ),
          reponses_utilisateur (*)
        `
        )
        .eq('user_id', userId)
        .eq('statut', 'en_cours')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Pas de session active
          return null;
        }
        throw error;
      }

      return data as SessionWithDetails;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 secondes (session active change souvent)
    refetchInterval: 60 * 1000, // Refetch toutes les minutes
  });
}

/**
 * Hook pour créer une nouvelle session
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quizId, userId }: { quizId: number; userId: string }) => {
      // Vérifier s'il y a déjà une session active
      const { data: activeSession } = await supabase
        .from('sessions_quiz')
        .select('id')
        .eq('user_id', userId)
        .eq('statut', 'en_cours')
        .single();

      if (activeSession) {
        throw new Error('Une session est déjà en cours');
      }

      // Créer la nouvelle session
      const { data, error } = await supabase
        .from('sessions_quiz')
        .insert({
          quiz_id: quizId,
          user_id: userId,
          statut: 'en_cours',
          score_actuel: 0,
          question_actuelle: 1,
          temps_total: 0,
          temps_passe: 0,
          questions_repondues: 0,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: (data, { userId }) => {
      // Invalider les caches pertinents
      void queryClient.invalidateQueries({
        queryKey: queryKeys.session.list(userId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.session.current(userId),
      });
    },
  });
}

/**
 * Hook pour sauvegarder une réponse
 */
export function useSaveAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      questionId,
      reponseId,
      estCorrecte,
      tempsReponse,
      pointsGagnes,
    }: {
      sessionId: number;
      questionId: number;
      reponseId: number;
      estCorrecte: boolean;
      tempsReponse: number;
      pointsGagnes: number;
    }) => {
      // Sauvegarder la réponse
      const { data: reponseData, error: reponseError } = await supabase
        .from('reponses_utilisateur')
        .insert({
          session_id: sessionId,
          question_id: questionId,
          reponse_id: reponseId,
          est_correcte: estCorrecte,
          temps_reponse: tempsReponse,
          points_gagnes: pointsGagnes,
        })
        .select()
        .single();

      if (reponseError) {
        throw reponseError;
      }

      // Mettre à jour la session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions_quiz')
        .update({
          score_actuel: supabase.raw('score_actuel + ?', [pointsGagnes]),
          question_actuelle: supabase.raw('question_actuelle + 1'),
          questions_repondues: supabase.raw('questions_repondues + 1'),
          temps_passe: supabase.raw('temps_passe + ?', [tempsReponse]),
          reponses_correctes: estCorrecte
            ? supabase.raw('COALESCE(reponses_correctes, 0) + 1')
            : supabase.raw('COALESCE(reponses_correctes, 0)'),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (sessionError) {
        throw sessionError;
      }

      return { reponse: reponseData, session: sessionData };
    },
    onSuccess: data => {
      // Invalider le cache de la session
      void queryClient.invalidateQueries({
        queryKey: queryKeys.session.detail(data.session.id),
      });

      // Mettre à jour le cache de la session active si c'est la bonne
      const userId = data.session.user_id;
      if (userId) {
        queryClient.setQueryData(queryKeys.session.current(userId), data.session);
      }
    },
  });
}

/**
 * Hook pour terminer une session
 */
export function useCompleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: number) => {
      const { data, error } = await supabase
        .from('sessions_quiz')
        .update({
          statut: 'termine',
          score_final: supabase.raw('score_actuel'),
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: data => {
      const userId = data.user_id;
      if (userId) {
        // Invalider tous les caches de session pour cet utilisateur
        void queryClient.invalidateQueries({
          queryKey: queryKeys.session.list(userId),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.session.current(userId),
        });
      }
    },
  });
}

/**
 * Hook pour abandonner une session
 */
export function useAbandonSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: number) => {
      const { data, error } = await supabase
        .from('sessions_quiz')
        .update({
          statut: 'abandonne',
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: data => {
      const userId = data.user_id;
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.session.list(userId),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.session.current(userId),
        });
      }
    },
  });
}
