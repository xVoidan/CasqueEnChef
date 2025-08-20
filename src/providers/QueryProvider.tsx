/**
 * Provider pour React Query
 * Encapsule l'application avec le QueryClientProvider
 */

import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient, setupQueryClient } from '../lib/queryClient';
import { Platform } from 'react-native';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps): JSX.Element {
  useEffect(() => {
    // Configurer le client avec gestion offline
    void setupQueryClient();
  }, []);

  // En développement, ajouter les devtools (web uniquement)
  if (__DEV__ && Platform.OS === 'web') {
    // Les devtools seront automatiquement détectés si installés
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
