/**
 * Service centralisé de gestion des erreurs
 * Gère les erreurs de manière cohérente dans toute l'application
 */

import { Alert, Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';

/**
 * Types d'erreurs
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  PERMISSION = 'PERMISSION',
  BUSINESS = 'BUSINESS',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Sévérité des erreurs
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Structure d'une erreur applicative
 */
export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string;
  details?: Record<string, unknown>;
  stack?: string;
  timestamp: Date;
  context?: {
    userId?: string;
    action?: string;
    component?: string;
  };
}

/**
 * Options de retry
 */
interface RetryOptions {
  maxAttempts: number;
  delay: number;
  backoff: 'linear' | 'exponential';
  onRetry?: (attempt: number) => void;
}

/**
 * Service de gestion des erreurs
 */
class ErrorService {
  private errorQueue: AppError[] = [];
  private isProduction = !__DEV__;
  private sentryEnabled = false;

  constructor() {
    this.initializeSentry();
  }

  /**
   * Initialiser Sentry pour le monitoring en production
   */
  private initializeSentry(): void {
    if (this.isProduction && Platform.OS !== 'web') {
      try {
        // Sentry.init({
        //   dsn: process.env.SENTRY_DSN,
        //   environment: this.isProduction ? 'production' : 'development',
        // });
        // this.sentryEnabled = true;
      } catch {
        console.warn('[ErrorService] Sentry initialization failed');
      }
    }
  }

  /**
   * Capturer et traiter une erreur
   */
  captureError(error: unknown, context?: AppError['context']): AppError {
    const appError = this.normalizeError(error, context);

    // Ajouter à la queue
    this.errorQueue.push(appError);
    if (this.errorQueue.length > 100) {
      this.errorQueue.shift(); // Limiter la taille de la queue
    }

    // Logger selon la sévérité
    this.logError(appError);

    // Envoyer à Sentry si configuré
    if (this.sentryEnabled && appError.severity !== ErrorSeverity.LOW) {
      this.sendToSentry(appError);
    }

    return appError;
  }

  /**
   * Normaliser une erreur en AppError
   */
  private normalizeError(error: unknown, context?: AppError['context']): AppError {
    const timestamp = new Date();

    // Erreur Supabase
    if (this.isSupabaseError(error)) {
      return this.handleSupabaseError(error, context, timestamp);
    }

    // Erreur réseau
    if (this.isNetworkError(error)) {
      return {
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        message: error.message || 'Network error',
        userMessage: 'Problème de connexion. Veuillez vérifier votre connexion internet.',
        timestamp,
        context,
      };
    }

    // Erreur standard
    if (error instanceof Error) {
      return {
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        message: error.message,
        userMessage: this.getUserFriendlyMessage(error.message),
        stack: error.stack,
        timestamp,
        context,
      };
    }

    // Erreur inconnue
    return {
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.LOW,
      message: String(error),
      userMessage: 'Une erreur inattendue est survenue.',
      timestamp,
      context,
    };
  }

  /**
   * Vérifier si c'est une erreur Supabase
   */
  private isSupabaseError(error: unknown): error is {
    message: string;
    code?: string;
    details?: string;
  } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      (error as Record<string, unknown>).message !== undefined
    );
  }

  /**
   * Gérer les erreurs Supabase
   */
  private handleSupabaseError(
    error: { message: string; code?: string; details?: string },
    context: AppError['context'] | undefined,
    timestamp: Date
  ): AppError {
    let type = ErrorType.DATABASE;
    let severity = ErrorSeverity.MEDIUM;
    let userMessage = 'Une erreur est survenue avec la base de données.';

    // Analyser le message d'erreur
    const message = error.message.toLowerCase();

    if (message.includes('auth') || message.includes('jwt')) {
      type = ErrorType.AUTH;
      severity = ErrorSeverity.HIGH;

      if (message.includes('invalid login')) {
        userMessage = 'Email ou mot de passe incorrect.';
      } else if (message.includes('expired')) {
        userMessage = 'Votre session a expiré. Veuillez vous reconnecter.';
      } else {
        userMessage = "Problème d'authentification. Veuillez vous reconnecter.";
      }
    } else if (message.includes('row-level security') || message.includes('permission')) {
      type = ErrorType.PERMISSION;
      severity = ErrorSeverity.HIGH;
      userMessage = "Vous n'avez pas la permission d'effectuer cette action.";
    } else if (message.includes('duplicate') || message.includes('unique')) {
      type = ErrorType.VALIDATION;
      severity = ErrorSeverity.LOW;
      userMessage = 'Cette information existe déjà.';
    } else if (message.includes('foreign key') || message.includes('constraint')) {
      type = ErrorType.VALIDATION;
      severity = ErrorSeverity.MEDIUM;
      userMessage = 'Données invalides. Veuillez vérifier vos informations.';
    }

    return {
      type,
      severity,
      message: error.message,
      userMessage,
      code: error.code,
      details: error.details ? { details: error.details } : undefined,
      timestamp,
      context,
    };
  }

  /**
   * Vérifier si c'est une erreur réseau
   */
  private isNetworkError(error: unknown): error is { message: string } {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const message = (error as { message?: string }).message?.toLowerCase() ?? '';
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('connection')
    );
  }

  /**
   * Obtenir un message user-friendly
   */
  private getUserFriendlyMessage(message: string): string {
    const messageMap: Record<string, string> = {
      'Network request failed': 'Problème de connexion internet.',
      'Invalid email': 'Adresse email invalide.',
      'Password should be at least 6 characters':
        'Le mot de passe doit contenir au moins 6 caractères.',
      'User already registered': 'Cet email est déjà utilisé.',
      'Invalid login credentials': 'Email ou mot de passe incorrect.',
    };

    // Chercher une correspondance
    for (const [key, value] of Object.entries(messageMap)) {
      if (message.includes(key)) {
        return value;
      }
    }

    return 'Une erreur est survenue. Veuillez réessayer.';
  }

  /**
   * Logger l'erreur selon la sévérité
   */
  private logError(error: AppError): void {
    const logMessage = `[${error.type}] ${error.message}`;

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        console.error(logMessage, error);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(logMessage, error);
        break;
      case ErrorSeverity.LOW:
        // Ignorer les erreurs de faible sévérité en production
        break;
    }
  }

  /**
   * Envoyer l'erreur à Sentry
   */
  private sendToSentry(error: AppError): void {
    if (!this.sentryEnabled) {
      return;
    }

    try {
      Sentry.captureException(new Error(error.message), {
        level: error.severity as Sentry.SeverityLevel,
        tags: {
          type: error.type,
        },
        contexts: {
          app: error.context ?? {},
          error: error.details ?? {},
        },
      });
    } catch {
      // Ignorer les erreurs Sentry
    }
  }

  /**
   * Afficher une erreur à l'utilisateur
   */
  showError(error: AppError | string, title = 'Erreur'): void {
    const message = typeof error === 'string' ? error : error.userMessage;

    if (Platform.OS === 'web') {
      // Pour le web, utiliser une notification ou un toast
      console.error(`[${title}] ${message}`);
    } else {
      Alert.alert(title, message, [{ text: 'OK' }]);
    }
  }

  /**
   * Retry avec backoff exponentiel
   */
  async retry<T>(fn: () => Promise<T>, options: Partial<RetryOptions> = {}): Promise<T> {
    const config: RetryOptions = {
      maxAttempts: 3,
      delay: 1000,
      backoff: 'exponential',
      ...options,
    };

    let lastError: unknown;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < config.maxAttempts) {
          config.onRetry?.(attempt);

          const delay =
            config.backoff === 'exponential'
              ? config.delay * Math.pow(2, attempt - 1)
              : config.delay * attempt;

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Obtenir les erreurs récentes
   */
  getRecentErrors(limit = 10): AppError[] {
    return this.errorQueue.slice(-limit);
  }

  /**
   * Nettoyer la queue d'erreurs
   */
  clearErrors(): void {
    this.errorQueue = [];
  }

  /**
   * Obtenir des statistiques sur les erreurs
   */
  getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
  } {
    const stats = {
      total: this.errorQueue.length,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
    };

    for (const error of this.errorQueue) {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    }

    return stats;
  }
}

// Export singleton
export const errorService = new ErrorService();

// Export helper functions
export function captureError(error: unknown, context?: AppError['context']): AppError {
  return errorService.captureError(error, context);
}

export function showError(error: AppError | string, title?: string): void {
  errorService.showError(error, title);
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> {
  return errorService.retry(fn, options);
}
