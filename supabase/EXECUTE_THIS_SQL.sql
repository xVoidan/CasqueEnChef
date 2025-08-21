-- ============================================
-- SCRIPT COMPLET POUR SYSTÈME DE CLASSEMENT
-- ============================================

-- ÉTAPE 1: NETTOYER TOUTES LES FONCTIONS EXISTANTES
DO $$ 
DECLARE
    func_record RECORD;
    func_names TEXT[] := ARRAY[
        'get_classement_global',
        'get_classement_hebdomadaire', 
        'get_classement_mensuel',
        'get_classement_par_theme',
        'get_classement_par_concours',
        'rechercher_utilisateur_classement',
        'get_position_utilisateur',
        'calculate_session_points',
        'update_rangs',
        'reset_points_hebdomadaires',
        'reset_points_mensuels',
        'creer_defi',
        'trigger_update_rangs',
        'get_user_stats',
        'calculate_score',
        'get_leaderboard',
        'get_user_progress'
    ];
    func_name TEXT;
BEGIN
    FOREACH func_name IN ARRAY func_names
    LOOP
        FOR func_record IN 
            SELECT proname, oidvectortypes(proargtypes) as args 
            FROM pg_proc 
            WHERE proname = func_name
        LOOP
            BEGIN
                EXECUTE format('DROP FUNCTION IF EXISTS %I(%s) CASCADE', func_record.proname, func_record.args);
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
        END LOOP;
    END LOOP;
END $$;

DROP TRIGGER IF EXISTS update_rangs_on_points_change ON profiles CASCADE;

-- ÉTAPE 2: CRÉER LA TABLE sessions SI ELLE N'EXISTE PAS
-- (Compatible avec sessions_quiz existante)
CREATE TABLE IF NOT EXISTS public.sessions (
    id SERIAL PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type_session VARCHAR(50),
    theme_id INTEGER,
    sous_theme_id INTEGER,
    score INTEGER DEFAULT 0,
    nombre_questions INTEGER DEFAULT 0,
    nombre_reponses_correctes INTEGER DEFAULT 0,
    temps_total INTEGER DEFAULT 0,
    statut VARCHAR(20) DEFAULT 'en_cours',
    date_debut TIMESTAMPTZ DEFAULT NOW(),
    date_fin TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    nombre_correct INTEGER DEFAULT 0,
    taux_reussite DECIMAL DEFAULT 0,
    points_gagnes INTEGER DEFAULT 0
);

-- Si sessions_quiz existe mais pas sessions, créer une vue
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions_quiz' AND table_schema = 'public')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions' AND table_schema = 'public')
    THEN
        CREATE OR REPLACE VIEW public.sessions AS
        SELECT 
            id,
            user_id as profile_id,
            'entrainement' as type_session,
            NULL::INTEGER as theme_id,
            NULL::INTEGER as sous_theme_id,
            COALESCE(score_final, score_actuel, 0) as score,
            questions_repondues as nombre_questions,
            reponses_correctes as nombre_reponses_correctes,
            temps_total,
            statut,
            started_at as date_debut,
            completed_at as date_fin,
            created_at,
            updated_at,
            reponses_correctes as nombre_correct,
            CASE WHEN questions_repondues > 0 
                THEN (reponses_correctes::DECIMAL / questions_repondues * 100)
                ELSE 0 
            END as taux_reussite,
            0 as points_gagnes
        FROM sessions_quiz;
    END IF;
END $$;

-- ÉTAPE 3: EXÉCUTER LE SCRIPT DE MIGRATION
-- Copiez et exécutez maintenant le contenu de 20250121_ranking_system_fixed.sql