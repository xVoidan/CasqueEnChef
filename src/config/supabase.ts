import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import 'react-native-url-polyfill/auto';

/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
// Essayer d'abord les variables d'environnement, puis Constants.expoConfig
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants.expoConfig?.extra?.supabaseUrl ||
  Constants.manifest?.extra?.supabaseUrl ||
  '';

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  Constants.manifest?.extra?.supabaseAnonKey ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Les clés Supabase sont manquantes.');
  console.error('URL:', supabaseUrl ? '✅' : '❌');
  console.error('Key:', supabaseAnonKey ? '✅' : '❌');
  console.error(
    'Vérifiez: 1) .env.local existe, 2) Variables EXPO_PUBLIC_*, 3) Redémarrez avec --clear'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
