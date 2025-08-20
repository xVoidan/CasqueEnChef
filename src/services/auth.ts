import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  isGuest?: boolean;
}

export interface AuthError {
  message: string;
  code?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const translateError = (error: { message?: string; error_description?: string } | any): string => {
  const errorMessages: { [key: string]: string } = {
    'Invalid login credentials': 'Email ou mot de passe incorrect',
    'Email not confirmed': 'Veuillez confirmer votre email',
    'User already registered': 'Cet email est déjà utilisé',
    'Password should be at least 6 characters':
      'Le mot de passe doit contenir au moins 6 caractères',
    'Invalid email': 'Email invalide',
    'User not found': 'Utilisateur non trouvé',
    'Network request failed': 'Erreur de connexion réseau',
  };

  const message = error?.message ?? error?.error_description ?? error;

  for (const [key, translation] of Object.entries(errorMessages)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return translation;
    }
  }

  return message ?? 'Une erreur est survenue';
};

class AuthService {
  async signUp(
    email: string,
    password: string,
    username: string
  ): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
        },
      });

      if (error) {
        return {
          user: null,
          error: { message: translateError(error) },
        };
      }

      if (data.user) {
        return {
          user: {
            id: data.user.id,
            email: data.user.email!,
            username: username,
          },
          error: null,
        };
      }

      return {
        user: null,
        error: { message: "Erreur lors de l'inscription" },
      };
    } catch (error) {
      return {
        user: null,
        error: { message: translateError(error) },
      };
    }
  }

  async signIn(
    email: string,
    password: string
  ): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          user: null,
          error: { message: translateError(error) },
        };
      }

      if (data.user) {
        return {
          user: {
            id: data.user.id,
            email: data.user.email!,
            username: data.user.user_metadata?.username,
          },
          error: null,
        };
      }

      return {
        user: null,
        error: { message: 'Erreur lors de la connexion' },
      };
    } catch (error) {
      return {
        user: null,
        error: { message: translateError(error) },
      };
    }
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();

      await AsyncStorage.removeItem('guestMode');

      if (error) {
        return { error: { message: translateError(error) } };
      }

      return { error: null };
    } catch (error) {
      return { error: { message: translateError(error) } };
    }
  }

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'casqueenmain://reset-password',
      });

      if (error) {
        return { error: { message: translateError(error) } };
      }

      return { error: null };
    } catch (error) {
      return { error: { message: translateError(error) } };
    }
  }

  async signInAsGuest(): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const guestUser: AuthUser = {
        id: 'guest',
        email: 'invité@casqueenmain.fr',
        username: 'Invité',
        isGuest: true,
      };

      await AsyncStorage.setItem('guestMode', 'true');

      return {
        user: guestUser,
        error: null,
      };
    } catch {
      return {
        user: null,
        error: { message: 'Erreur lors de la connexion en mode invité' },
      };
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const guestMode = await AsyncStorage.getItem('guestMode');
      if (guestMode === 'true') {
        return {
          id: 'guest',
          email: 'invité@casqueenmain.fr',
          username: 'Invité',
          isGuest: true,
        };
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        return {
          id: user.id,
          email: user.email!,
          username: user.user_metadata?.username,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async refreshSession(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.refreshSession();

      if (error) {
        return { error: { message: translateError(error) } };
      }

      return { error: null };
    } catch (error) {
      return { error: { message: translateError(error) } };
    }
  }
}

export const authService = new AuthService();
