/**
 * Service principal Supabase
 * Utilise la configuration centralisée et sécurisée
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseConfig, getEnvironmentConfig } from '../config/supabase.config';
import type { Database } from '../types/database.types';

const envConfig = getEnvironmentConfig();

/**
 * Client Supabase pour l'application
 * Utilise uniquement les clés publiques (anon key)
 */
export const supabase = createClient<Database>(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-application-name': 'CasqueEnMain',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Client admin Supabase (uniquement pour scripts serveur)
 * NE JAMAIS utiliser côté client!
 */
export function createAdminClient(): ReturnType<typeof createClient> | null {
  if (!supabaseConfig.serviceRoleKey) {
    console.warn('Service role key not available. Admin client cannot be created.');
    return null;
  }

  // Vérifier qu'on n'est pas côté client
  if (typeof window !== 'undefined') {
    throw new Error('SECURITY ERROR: Admin client should never be used in client-side code!');
  }

  return createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Helper pour gérer les erreurs Supabase
 */
export function handleSupabaseError(error: unknown): string {
  if (!error) {
    return 'Une erreur inconnue est survenue';
  }

  if (typeof error === 'object' && 'message' in error) {
    const message = (error as { message: string }).message;

    // Traduire les erreurs communes
    if (message.includes('Invalid login credentials')) {
      return 'Email ou mot de passe incorrect';
    }
    if (message.includes('User already registered')) {
      return 'Cet email est déjà utilisé';
    }
    if (message.includes('Password should be at least')) {
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }
    if (message.includes('Invalid email')) {
      return 'Adresse email invalide';
    }
    if (message.includes('row-level security')) {
      return 'Accès non autorisé';
    }

    // Si pas de traduction, retourner le message original mais loggé
    if (envConfig.enableLogging) {
      console.error('Supabase error:', message);
    }
    return 'Une erreur est survenue. Veuillez réessayer.';
  }

  return 'Une erreur inconnue est survenue';
}

/**
 * Type guard pour vérifier si une erreur est une erreur Supabase
 */
export function isSupabaseError(
  error: unknown
): error is { message: string; code?: string; details?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

export default supabase;
