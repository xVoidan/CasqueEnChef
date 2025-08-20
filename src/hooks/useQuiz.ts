/**
 * Hook personnalisé pour la gestion des quiz avec React Query
 * Optimise les performances avec cache automatique
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { queryKeys } from '../lib/queryClient';
import type { Database } from '../types/database.types';

type Quiz = Database['public']['Tables']['quiz']['Row'];
type Question = Database['public']['Tables']['questions']['Row'];
type Reponse = Database['public']['Tables']['reponses']['Row'];

interface QuizWithQuestions extends Quiz {
  questions: (Question & {
    reponses: Reponse[];
  })[];
}

/**
 * Hook pour récupérer la liste des quiz
 */
export function useQuizList(filters?: {
  category?: number;
  enterprise?: number;
  public?: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.quiz.list(filters ?? {}),
    queryFn: async () => {
      let query = supabase.from('quiz').select(`
          *,
          categories (nom),
          entreprises (nom)
        `);

      if (filters?.category) {
        query = query.eq('categorie_id', filters.category);
      }
      if (filters?.enterprise) {
        query = query.eq('entreprise_id', filters.enterprise);
      }
      if (filters?.public !== undefined) {
        query = query.eq('est_public', filters.public);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook pour récupérer un quiz avec ses questions
 * Utilise le cache et optimise les requêtes
 */
export function useQuizDetails(quizId: number | null) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.quiz.detail(quizId ?? 0),
    queryFn: async () => {
      if (!quizId) {
        throw new Error('Quiz ID is required');
      }

      // Optimisation: récupérer tout en une seule requête
      const { data, error } = await supabase
        .from('quiz')
        .select(
          `
          *,
          categories (nom),
          entreprises (nom),
          questions (
            *,
            reponses (*)
          )
        `
        )
        .eq('id', quizId)
        .single();

      if (error) {
        throw error;
      }

      // Trier les questions et réponses
      if (data?.questions) {
        interface QuestionWithReponses {
          id: number;
          ordre?: number;
          reponses?: Array<{ ordre?: number }>;
        }

        (data.questions as QuestionWithReponses[]).sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
        (data.questions as QuestionWithReponses[]).forEach(q => {
          if (q.reponses) {
            q.reponses.sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
          }
        });
      }

      // Mettre en cache les questions individuellement
      if (data?.questions) {
        (data.questions as Array<{ id: number }>).forEach(question => {
          queryClient.setQueryData(['question', question.id], question);
        });
      }

      return data as QuizWithQuestions;
    },
    enabled: !!quizId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook pour créer un nouveau quiz
 */
export function useCreateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quiz: Omit<Quiz, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('quiz').insert(quiz).select().single();

      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      // Invalider le cache de la liste des quiz
      void queryClient.invalidateQueries({
        queryKey: queryKeys.quiz.lists(),
      });
    },
  });
}

/**
 * Hook pour mettre à jour un quiz
 */
export function useUpdateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Quiz> & { id: number }) => {
      const { data, error } = await supabase
        .from('quiz')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: data => {
      // Mettre à jour le cache immédiatement (optimistic update)
      queryClient.setQueryData(queryKeys.quiz.detail(data.id), data);
      // Invalider la liste pour s'assurer de la cohérence
      void queryClient.invalidateQueries({
        queryKey: queryKeys.quiz.lists(),
      });
    },
  });
}

/**
 * Hook pour supprimer un quiz
 */
export function useDeleteQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quizId: number) => {
      const { error } = await supabase.from('quiz').delete().eq('id', quizId);

      if (error) {
        throw error;
      }
    },
    onSuccess: (_, quizId) => {
      // Retirer du cache
      queryClient.removeQueries({
        queryKey: queryKeys.quiz.detail(quizId),
      });
      // Invalider la liste
      void queryClient.invalidateQueries({
        queryKey: queryKeys.quiz.lists(),
      });
    },
  });
}

/**
 * Hook pour prefetch un quiz (chargement anticipé)
 */
export function usePrefetchQuiz() {
  const queryClient = useQueryClient();

  return async (quizId: number) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.quiz.detail(quizId),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('quiz')
          .select(
            `
            *,
            questions (
              *,
              reponses (*)
            )
          `
          )
          .eq('id', quizId)
          .single();

        if (error) {
          throw error;
        }
        return data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
}
