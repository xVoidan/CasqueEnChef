/**
 * Configuration centralisée pour Supabase
 * Gère les variables d'environnement de manière sécurisée
 */

interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Valide et retourne la configuration Supabase
 * Throw une erreur si les variables requises sont manquantes
 */
export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Validation des variables requises
  if (!url) {
    throw new ConfigurationError(
      'EXPO_PUBLIC_SUPABASE_URL is not defined. Please check your .env file.'
    );
  }

  if (!anonKey) {
    throw new ConfigurationError(
      'EXPO_PUBLIC_SUPABASE_ANON_KEY is not defined. Please check your .env file.'
    );
  }

  // Validation du format URL
  try {
    new URL(url);
  } catch {
    throw new ConfigurationError(
      'EXPO_PUBLIC_SUPABASE_URL is not a valid URL. Please check your .env file.'
    );
  }

  // Validation basique du format de clé (JWT)
  if (!anonKey.includes('.')) {
    throw new ConfigurationError(
      'EXPO_PUBLIC_SUPABASE_ANON_KEY does not appear to be a valid JWT. Please check your .env file.'
    );
  }

  return {
    url,
    anonKey,
    serviceRoleKey,
  };
}

/**
 * Vérifie si on est en mode développement
 */
export function isDevelopment(): boolean {
  return __DEV__ || process.env.NODE_ENV === 'development';
}

/**
 * Vérifie si on est en mode production
 */
export function isProduction(): boolean {
  return !isDevelopment();
}

/**
 * Retourne la configuration appropriée selon l'environnement
 */
export function getEnvironmentConfig(): {
  enableLogging: boolean;
  enableDebug: boolean;
  enablePersistence: boolean;
} {
  return {
    enableLogging: isDevelopment(),
    enableDebug: isDevelopment(),
    enablePersistence: true,
  };
}

// Export par défaut de la configuration
export const supabaseConfig = getSupabaseConfig();
