// Service alternatif pour contourner temporairement les problèmes RLS
// ⚠️ À UTILISER UNIQUEMENT POUR LE DÉBOGAGE ⚠️

import { createClient } from '@supabase/supabase-js';

// Créer un client Supabase avec la clé service (contourne RLS)
// ⚠️ ATTENTION : Ne jamais exposer cette clé côté client en production !
const supabaseServiceRole = () => {
  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Pour utiliser ce service de débogage, vous devez définir SUPABASE_SERVICE_ROLE_KEY dans votre .env'
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Sauvegarde une réponse en contournant RLS
 * ⚠️ À utiliser uniquement pour le débogage des problèmes RLS
 */
export async function saveAnswerNoRLS(
  sessionId: number,
  answer: {
    questionId: number;
    selectedAnswers: number[];
    isCorrect: boolean;
    timeSpent: number;
  }
): Promise<void> {
  console.warn('⚠️ Utilisation du service sans RLS - Mode débogage uniquement !');

  try {
    const supabase = supabaseServiceRole();
    const reponseId = answer.selectedAnswers.length > 0 ? answer.selectedAnswers[0] : null;

    const { data, error } = await supabase.from('reponses_utilisateur').insert({
      session_id: sessionId,
      question_id: answer.questionId,
      reponse_id: reponseId,
      est_correcte: answer.isCorrect,
      temps_reponse: answer.timeSpent,
    });

    if (error) {
      console.error('Erreur même sans RLS:', error);
      throw error;
    }

    console.warn('✅ Réponse sauvegardée avec succès (sans RLS):', data);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde sans RLS:', error);
    throw error;
  }
}

/**
 * Instructions pour utiliser ce service de débogage :
 *
 * 1. Obtenez votre clé service role depuis Supabase :
 *    - Dashboard Supabase > Settings > API
 *    - Copiez la clé "service_role" (secret)
 *
 * 2. Ajoutez-la à votre .env.local :
 *    SUPABASE_SERVICE_ROLE_KEY=votre_cle_ici
 *
 * 3. Dans sessionService.ts, remplacez temporairement l'appel normal par :
 *    import { saveAnswerNoRLS } from './sessionServiceNoRLS';
 *    await saveAnswerNoRLS(sessionId, answer);
 *
 * 4. Testez l'application
 *
 * 5. Si cela fonctionne, le problème est bien RLS
 *
 * 6. ⚠️ IMPORTANT : Revenez au service normal après débogage !
 */
