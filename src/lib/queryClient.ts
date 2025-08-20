/**
 * Configuration React Query pour cache et optimisation
 */

import { QueryClient } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

/**
 * Configuration personnalisée du QueryClient
 * Optimisée pour React Native et Supabase
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache pendant 5 minutes par défaut
      staleTime: 5 * 60 * 1000,
      // Garde en cache pendant 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry 3 fois avec exponential backoff
      retry: (failureCount, error) => {
        // Ne pas retry sur erreurs 4xx (client errors)
        if (error instanceof Error) {
          const message = error.message;
          if (message.includes('401') || message.includes('403') || message.includes('404')) {
            return false;
          }
        }
        return failureCount < 3;
      },
      // Délai de retry exponential
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Refetch quand l'app revient au premier plan
      refetchOnWindowFocus: true,
      // Network mode adaptatif
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations 2 fois
      retry: 2,
      // Network mode pour mutations
      networkMode: 'online',
    },
  },
});

/**
 * Configuration pour React Query avec gestion offline
 */
export async function setupQueryClient(): Promise<void> {
  // Écouter les changements de connexion réseau
  NetInfo.addEventListener(state => {
    if (!state.isConnected) {
      // Mettre en pause les requêtes si offline
      queryClient.setDefaultOptions({
        queries: {
          networkMode: 'offline',
        },
        mutations: {
          networkMode: 'offline',
        },
      });
    } else {
      // Reprendre les requêtes si online
      queryClient.setDefaultOptions({
        queries: {
          networkMode: 'online',
        },
        mutations: {
          networkMode: 'online',
        },
      });
      // Refetch toutes les queries actives
      void queryClient.refetchQueries();
    }
  });
}

/**
 * Clés de cache standardisées
 */
export const queryKeys = {
  all: ['supabase'] as const,
  auth: () => [...queryKeys.all, 'auth'] as const,
  user: (userId: string) => [...queryKeys.auth(), 'user', userId] as const,
  profile: (userId: string) => [...queryKeys.all, 'profile', userId] as const,

  quiz: {
    all: () => [...queryKeys.all, 'quiz'] as const,
    lists: () => [...queryKeys.quiz.all(), 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.quiz.lists(), filters] as const,
    details: () => [...queryKeys.quiz.all(), 'detail'] as const,
    detail: (id: number) => [...queryKeys.quiz.details(), id] as const,
    questions: (quizId: number) => [...queryKeys.quiz.detail(quizId), 'questions'] as const,
  },

  session: {
    all: () => [...queryKeys.all, 'session'] as const,
    lists: () => [...queryKeys.session.all(), 'list'] as const,
    list: (userId: string) => [...queryKeys.session.lists(), userId] as const,
    detail: (id: number) => [...queryKeys.session.all(), 'detail', id] as const,
    current: (userId: string) => [...queryKeys.session.all(), 'current', userId] as const,
  },

  categories: () => [...queryKeys.all, 'categories'] as const,
  enterprises: () => [...queryKeys.all, 'enterprises'] as const,
  rankings: () => [...queryKeys.all, 'rankings'] as const,
  achievements: (userId: string) => [...queryKeys.all, 'achievements', userId] as const,
};

/**
 * Helper pour invalider le cache de manière ciblée
 */
export async function invalidateQueries(keys: readonly unknown[]): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: keys });
}

/**
 * Helper pour prefetch des données
 */
export async function prefetchQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  staleTime?: number
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: staleTime ?? 5 * 60 * 1000,
  });
}

/**
 * Helper pour optimistic updates
 */
export function setQueryData<T>(
  queryKey: readonly unknown[],
  updater: T | ((old: T | undefined) => T | undefined)
): void {
  queryClient.setQueryData(queryKey, updater);
}

/**
 * Clear tout le cache (utile lors du logout)
 */
export async function clearCache(): Promise<void> {
  queryClient.clear();
}

/**
 * Statistiques de cache pour debug
 */
export function getCacheStats(): {
  queriesCount: number;
  mutationsCount: number;
} {
  if (Platform.OS === 'web' || __DEV__) {
    const cache = queryClient.getQueryCache();
    const mutationCache = queryClient.getMutationCache();

    return {
      queriesCount: cache.getAll().length,
      mutationsCount: mutationCache.getAll().length,
    };
  }

  return {
    queriesCount: 0,
    mutationsCount: 0,
  };
}
