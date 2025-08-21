-- ============================================
-- SUPPRESSION COMPLÈTE DE TOUTES LES FONCTIONS EXISTANTES
-- ============================================

-- Étape 1: Lister et supprimer toutes les fonctions de classement existantes
DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    -- Supprimer toutes les versions de get_classement_global
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args 
        FROM pg_proc 
        WHERE proname = 'get_classement_global'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I(%s) CASCADE', func_record.proname, func_record.args);
    END LOOP;
    
    -- Supprimer toutes les versions de get_classement_hebdomadaire
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args 
        FROM pg_proc 
        WHERE proname = 'get_classement_hebdomadaire'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I(%s) CASCADE', func_record.proname, func_record.args);
    END LOOP;
    
    -- Supprimer toutes les versions de get_classement_mensuel
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args 
        FROM pg_proc 
        WHERE proname = 'get_classement_mensuel'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I(%s) CASCADE', func_record.proname, func_record.args);
    END LOOP;
    
    -- Supprimer toutes les versions de get_classement_par_theme
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args 
        FROM pg_proc 
        WHERE proname = 'get_classement_par_theme'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I(%s) CASCADE', func_record.proname, func_record.args);
    END LOOP;
    
    -- Supprimer toutes les versions de get_classement_par_concours
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args 
        FROM pg_proc 
        WHERE proname = 'get_classement_par_concours'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I(%s) CASCADE', func_record.proname, func_record.args);
    END LOOP;
    
    -- Supprimer toutes les versions de rechercher_utilisateur_classement
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args 
        FROM pg_proc 
        WHERE proname = 'rechercher_utilisateur_classement'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I(%s) CASCADE', func_record.proname, func_record.args);
    END LOOP;
    
    -- Supprimer toutes les versions de get_position_utilisateur
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args 
        FROM pg_proc 
        WHERE proname = 'get_position_utilisateur'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I(%s) CASCADE', func_record.proname, func_record.args);
    END LOOP;
    
    -- Supprimer toutes les versions de calculate_session_points
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args 
        FROM pg_proc 
        WHERE proname = 'calculate_session_points'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I(%s) CASCADE', func_record.proname, func_record.args);
    END LOOP;
    
    -- Supprimer toutes les versions de update_rangs
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args 
        FROM pg_proc 
        WHERE proname = 'update_rangs'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I(%s) CASCADE', func_record.proname, func_record.args);
    END LOOP;
    
    -- Supprimer toutes les versions de reset_points_hebdomadaires
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args 
        FROM pg_proc 
        WHERE proname = 'reset_points_hebdomadaires'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I(%s) CASCADE', func_record.proname, func_record.args);
    END LOOP;
    
    -- Supprimer toutes les versions de reset_points_mensuels
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args 
        FROM pg_proc 
        WHERE proname = 'reset_points_mensuels'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I(%s) CASCADE', func_record.proname, func_record.args);
    END LOOP;
    
    -- Supprimer toutes les versions de creer_defi
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args 
        FROM pg_proc 
        WHERE proname = 'creer_defi'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I(%s) CASCADE', func_record.proname, func_record.args);
    END LOOP;
    
    -- Supprimer toutes les versions de trigger_update_rangs
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args 
        FROM pg_proc 
        WHERE proname = 'trigger_update_rangs'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I(%s) CASCADE', func_record.proname, func_record.args);
    END LOOP;
END $$;

-- Supprimer le trigger s'il existe
DROP TRIGGER IF EXISTS update_rangs_on_points_change ON profiles;

-- ============================================
-- SYSTÈME DE CLASSEMENT ET GRADES POMPIERS
-- ============================================

-- Table pour stocker l'historique des points
CREATE TABLE IF NOT EXISTS public.points_history (
    id SERIAL PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    points_gagnes INTEGER NOT NULL,
    type_action VARCHAR(50) NOT NULL, -- 'session', 'serie', 'badge', 'bonus'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les classements hebdomadaires/mensuels
CREATE TABLE IF NOT EXISTS public.ranking_snapshots (
    id SERIAL PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type_classement VARCHAR(20) NOT NULL, -- 'hebdomadaire', 'mensuel'
    points INTEGER NOT NULL DEFAULT 0,
    rang INTEGER,
    periode_debut DATE NOT NULL,
    periode_fin DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, type_classement, periode_debut)
);

-- Table pour les défis entre utilisateurs
CREATE TABLE IF NOT EXISTS public.defis (
    id SERIAL PRIMARY KEY,
    challenger_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenged_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    theme_id INTEGER REFERENCES public.themes(id),
    statut VARCHAR(20) DEFAULT 'en_attente', -- 'en_attente', 'accepte', 'refuse', 'termine'
    gagnant_id UUID REFERENCES public.profiles(id),
    score_challenger INTEGER,
    score_challenged INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter des colonnes manquantes à profiles si nécessaire
DO $$ 
BEGIN
    -- Ajouter les colonnes si elles n'existent pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'points_hebdo') THEN
        ALTER TABLE public.profiles ADD COLUMN points_hebdo INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'points_mensuel') THEN
        ALTER TABLE public.profiles ADD COLUMN points_mensuel INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'rang_global') THEN
        ALTER TABLE public.profiles ADD COLUMN rang_global INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'rang_hebdo') THEN
        ALTER TABLE public.profiles ADD COLUMN rang_hebdo INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'rang_mensuel') THEN
        ALTER TABLE public.profiles ADD COLUMN rang_mensuel INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'grade_id') THEN
        ALTER TABLE public.profiles ADD COLUMN grade_id INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'derniere_activite') THEN
        ALTER TABLE public.profiles ADD COLUMN derniere_activite TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'serie_actuelle') THEN
        ALTER TABLE public.profiles ADD COLUMN serie_actuelle INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'meilleure_serie') THEN
        ALTER TABLE public.profiles ADD COLUMN meilleure_serie INTEGER DEFAULT 0;
    END IF;
END $$;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_profiles_points ON public.profiles(points_total DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_points_hebdo ON public.profiles(points_hebdo DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_points_mensuel ON public.profiles(points_mensuel DESC);
CREATE INDEX IF NOT EXISTS idx_points_history_profile ON public.points_history(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_snapshots ON public.ranking_snapshots(type_classement, periode_debut DESC);

-- ============================================
-- FONCTION: Calculer et attribuer les points
-- ============================================
CREATE OR REPLACE FUNCTION calculate_session_points(
    p_profile_id UUID,
    p_score INTEGER,
    p_taux_reussite DECIMAL,
    p_temps_total INTEGER,
    p_nombre_questions INTEGER
) RETURNS INTEGER AS $$
DECLARE
    v_points INTEGER := 0;
    v_bonus_multiplier DECIMAL := 1.0;
    v_serie_actuelle INTEGER;
BEGIN
    -- Points de base selon le score (10-50 points)
    v_points := LEAST(50, GREATEST(10, p_score * 5));
    
    -- Bonus pour taux de réussite > 80%
    IF p_taux_reussite > 80 THEN
        v_bonus_multiplier := 1.5;
    ELSIF p_taux_reussite > 60 THEN
        v_bonus_multiplier := 1.2;
    END IF;
    
    -- Bonus pour rapidité (moins de 30 secondes par question)
    IF p_temps_total < (p_nombre_questions * 30) THEN
        v_points := v_points + 10;
    END IF;
    
    -- Appliquer le multiplicateur
    v_points := FLOOR(v_points * v_bonus_multiplier);
    
    -- Gérer la série de jours consécutifs
    SELECT serie_actuelle INTO v_serie_actuelle FROM profiles WHERE id = p_profile_id;
    
    -- Si l'utilisateur joue aujourd'hui, augmenter sa série
    IF DATE(CURRENT_TIMESTAMP) > DATE((SELECT derniere_activite FROM profiles WHERE id = p_profile_id)) THEN
        v_serie_actuelle := COALESCE(v_serie_actuelle, 0) + 1;
        v_points := v_points + (v_serie_actuelle * 5); -- +5 points par jour de série
        
        UPDATE profiles 
        SET serie_actuelle = v_serie_actuelle,
            meilleure_serie = GREATEST(COALESCE(meilleure_serie, 0), v_serie_actuelle)
        WHERE id = p_profile_id;
    END IF;
    
    -- Mettre à jour les points du profil
    UPDATE profiles 
    SET points_total = COALESCE(points_total, 0) + v_points,
        points_hebdo = COALESCE(points_hebdo, 0) + v_points,
        points_mensuel = COALESCE(points_mensuel, 0) + v_points,
        derniere_activite = NOW(),
        experience_points = COALESCE(points_total, 0) + v_points,
        grade_id = CASE 
            WHEN COALESCE(points_total, 0) + v_points >= 250000 THEN 15
            WHEN COALESCE(points_total, 0) + v_points >= 150000 THEN 14
            WHEN COALESCE(points_total, 0) + v_points >= 100000 THEN 13
            WHEN COALESCE(points_total, 0) + v_points >= 75000 THEN 12
            WHEN COALESCE(points_total, 0) + v_points >= 55000 THEN 11
            WHEN COALESCE(points_total, 0) + v_points >= 40000 THEN 10
            WHEN COALESCE(points_total, 0) + v_points >= 30000 THEN 9
            WHEN COALESCE(points_total, 0) + v_points >= 23000 THEN 8
            WHEN COALESCE(points_total, 0) + v_points >= 17000 THEN 7
            WHEN COALESCE(points_total, 0) + v_points >= 12000 THEN 6
            WHEN COALESCE(points_total, 0) + v_points >= 8000 THEN 5
            WHEN COALESCE(points_total, 0) + v_points >= 5000 THEN 4
            WHEN COALESCE(points_total, 0) + v_points >= 2500 THEN 3
            WHEN COALESCE(points_total, 0) + v_points >= 1000 THEN 2
            ELSE 1
        END
    WHERE id = p_profile_id;
    
    -- Enregistrer dans l'historique
    INSERT INTO points_history (profile_id, points_gagnes, type_action, description)
    VALUES (p_profile_id, v_points, 'session', 
            'Session terminée - Score: ' || p_score || ', Taux: ' || p_taux_reussite || '%');
    
    RETURN v_points;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FONCTION: Obtenir le classement global
-- ============================================
CREATE OR REPLACE FUNCTION get_classement_global(
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    rang INTEGER,
    user_id UUID,
    username VARCHAR,
    avatar_url TEXT,
    points_total INTEGER,
    niveau VARCHAR,
    grade_id INTEGER,
    evolution VARCHAR,
    est_utilisateur_actuel BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_users AS (
        SELECT 
            ROW_NUMBER() OVER (ORDER BY p.points_total DESC NULLS LAST) AS rank_num,
            p.id,
            p.username,
            p.avatar_url,
            COALESCE(p.points_total, 0) as pts_total,
            p.niveau,
            COALESCE(p.grade_id, 1) as grd_id,
            CASE 
                WHEN p.rang_global IS NULL THEN 'new'
                WHEN p.rang_global < ROW_NUMBER() OVER (ORDER BY p.points_total DESC NULLS LAST) THEN 'down'
                WHEN p.rang_global > ROW_NUMBER() OVER (ORDER BY p.points_total DESC NULLS LAST) THEN 'up'
                ELSE 'stable'
            END AS evolution_status
        FROM profiles p
        WHERE COALESCE(p.points_total, 0) > 0
    )
    SELECT 
        rank_num::INTEGER,
        id,
        username,
        avatar_url,
        pts_total::INTEGER,
        niveau,
        grd_id::INTEGER,
        evolution_status,
        (id = auth.uid()) AS est_utilisateur_actuel
    FROM ranked_users
    ORDER BY rank_num
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FONCTION: Obtenir le classement hebdomadaire
-- ============================================
CREATE OR REPLACE FUNCTION get_classement_hebdomadaire(
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    rang INTEGER,
    user_id UUID,
    username VARCHAR,
    avatar_url TEXT,
    points_periode INTEGER,
    niveau VARCHAR,
    grade_id INTEGER,
    evolution VARCHAR,
    est_utilisateur_actuel BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_users AS (
        SELECT 
            ROW_NUMBER() OVER (ORDER BY p.points_hebdo DESC NULLS LAST) AS rank_num,
            p.id,
            p.username,
            p.avatar_url,
            COALESCE(p.points_hebdo, 0) as pts_hebdo,
            p.niveau,
            COALESCE(p.grade_id, 1) as grd_id,
            CASE 
                WHEN p.rang_hebdo IS NULL THEN 'new'
                WHEN p.rang_hebdo < ROW_NUMBER() OVER (ORDER BY p.points_hebdo DESC NULLS LAST) THEN 'down'
                WHEN p.rang_hebdo > ROW_NUMBER() OVER (ORDER BY p.points_hebdo DESC NULLS LAST) THEN 'up'
                ELSE 'stable'
            END AS evolution_status
        FROM profiles p
        WHERE COALESCE(p.points_hebdo, 0) > 0
    )
    SELECT 
        rank_num::INTEGER,
        id,
        username,
        avatar_url,
        pts_hebdo::INTEGER,
        niveau,
        grd_id::INTEGER,
        evolution_status,
        (id = auth.uid()) AS est_utilisateur_actuel
    FROM ranked_users
    ORDER BY rank_num
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FONCTION: Obtenir le classement mensuel
-- ============================================
CREATE OR REPLACE FUNCTION get_classement_mensuel(
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    rang INTEGER,
    user_id UUID,
    username VARCHAR,
    avatar_url TEXT,
    points_periode INTEGER,
    niveau VARCHAR,
    grade_id INTEGER,
    evolution VARCHAR,
    est_utilisateur_actuel BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_users AS (
        SELECT 
            ROW_NUMBER() OVER (ORDER BY p.points_mensuel DESC NULLS LAST) AS rank_num,
            p.id,
            p.username,
            p.avatar_url,
            COALESCE(p.points_mensuel, 0) as pts_mensuel,
            p.niveau,
            COALESCE(p.grade_id, 1) as grd_id,
            CASE 
                WHEN p.rang_mensuel IS NULL THEN 'new'
                WHEN p.rang_mensuel < ROW_NUMBER() OVER (ORDER BY p.points_mensuel DESC NULLS LAST) THEN 'down'
                WHEN p.rang_mensuel > ROW_NUMBER() OVER (ORDER BY p.points_mensuel DESC NULLS LAST) THEN 'up'
                ELSE 'stable'
            END AS evolution_status
        FROM profiles p
        WHERE COALESCE(p.points_mensuel, 0) > 0
    )
    SELECT 
        rank_num::INTEGER,
        id,
        username,
        avatar_url,
        pts_mensuel::INTEGER,
        niveau,
        grd_id::INTEGER,
        evolution_status,
        (id = auth.uid()) AS est_utilisateur_actuel
    FROM ranked_users
    ORDER BY rank_num
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FONCTION: Obtenir le classement par thème
-- ============================================
CREATE OR REPLACE FUNCTION get_classement_par_theme(
    p_theme_id INTEGER,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    rang INTEGER,
    user_id UUID,
    username VARCHAR,
    avatar_url TEXT,
    questions_reussies INTEGER,
    taux_reussite DECIMAL,
    temps_moyen INTEGER,
    est_utilisateur_actuel BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH theme_stats AS (
        SELECT 
            s.profile_id,
            COUNT(DISTINCT s.id) AS sessions_count,
            SUM(COALESCE(s.nombre_reponses_correctes, 0)) AS total_correct,
            SUM(COALESCE(s.nombre_questions, 0)) AS total_questions,
            AVG(COALESCE(s.temps_total, 0)) AS avg_time,
            CASE 
                WHEN SUM(COALESCE(s.nombre_questions, 0)) > 0 
                THEN (SUM(COALESCE(s.nombre_reponses_correctes, 0))::DECIMAL / SUM(s.nombre_questions)) * 100
                ELSE 0
            END AS avg_taux
        FROM sessions s
        WHERE s.theme_id = p_theme_id
        AND s.statut = 'terminee'
        GROUP BY s.profile_id
    ),
    ranked_users AS (
        SELECT 
            ROW_NUMBER() OVER (ORDER BY ts.total_correct DESC, ts.avg_taux DESC) AS rank_num,
            p.id,
            p.username,
            p.avatar_url,
            ts.total_correct::INTEGER,
            ts.avg_taux,
            ts.avg_time::INTEGER
        FROM theme_stats ts
        JOIN profiles p ON p.id = ts.profile_id
    )
    SELECT 
        rank_num::INTEGER,
        id,
        username,
        avatar_url,
        total_correct,
        avg_taux,
        avg_time,
        (id = auth.uid()) AS est_utilisateur_actuel
    FROM ranked_users
    ORDER BY rank_num
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FONCTION: Rechercher un utilisateur
-- ============================================
CREATE OR REPLACE FUNCTION rechercher_utilisateur_classement(
    p_search_term VARCHAR
) RETURNS TABLE (
    rang_global INTEGER,
    user_id UUID,
    username VARCHAR,
    avatar_url TEXT,
    points_total INTEGER,
    grade_id INTEGER,
    niveau VARCHAR,
    serie_actuelle INTEGER,
    taux_reussite_global DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_users AS (
        SELECT 
            ROW_NUMBER() OVER (ORDER BY p.points_total DESC NULLS LAST) AS rank_num,
            p.*
        FROM profiles p
        WHERE COALESCE(p.points_total, 0) > 0
    ),
    user_stats AS (
        SELECT 
            profile_id,
            CASE 
                WHEN SUM(COALESCE(nombre_questions, 0)) > 0 
                THEN (SUM(COALESCE(nombre_reponses_correctes, 0))::DECIMAL / SUM(nombre_questions)) * 100
                ELSE 0
            END AS avg_taux
        FROM sessions
        WHERE statut = 'terminee'
        GROUP BY profile_id
    )
    SELECT 
        ru.rank_num::INTEGER,
        ru.id,
        ru.username,
        ru.avatar_url,
        COALESCE(ru.points_total, 0),
        COALESCE(ru.grade_id, 1),
        ru.niveau,
        COALESCE(ru.serie_actuelle, 0),
        COALESCE(us.avg_taux, 0)
    FROM ranked_users ru
    LEFT JOIN user_stats us ON us.profile_id = ru.id
    WHERE LOWER(ru.username) LIKE LOWER('%' || p_search_term || '%')
    ORDER BY ru.rank_num
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FONCTION: Mettre à jour les rangs
-- ============================================
CREATE OR REPLACE FUNCTION update_rangs() RETURNS void AS $$
BEGIN
    -- Mettre à jour les rangs globaux
    WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY COALESCE(points_total, 0) DESC) AS new_rank
        FROM profiles
        WHERE COALESCE(points_total, 0) > 0
    )
    UPDATE profiles p
    SET rang_global = r.new_rank
    FROM ranked r
    WHERE p.id = r.id;
    
    -- Mettre à jour les rangs hebdomadaires
    WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY COALESCE(points_hebdo, 0) DESC) AS new_rank
        FROM profiles
        WHERE COALESCE(points_hebdo, 0) > 0
    )
    UPDATE profiles p
    SET rang_hebdo = r.new_rank
    FROM ranked r
    WHERE p.id = r.id;
    
    -- Mettre à jour les rangs mensuels
    WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY COALESCE(points_mensuel, 0) DESC) AS new_rank
        FROM profiles
        WHERE COALESCE(points_mensuel, 0) > 0
    )
    UPDATE profiles p
    SET rang_mensuel = r.new_rank
    FROM ranked r
    WHERE p.id = r.id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FONCTION: Reset hebdomadaire
-- ============================================
CREATE OR REPLACE FUNCTION reset_points_hebdomadaires() RETURNS void AS $$
BEGIN
    -- Sauvegarder les scores de la semaine
    INSERT INTO ranking_snapshots (profile_id, type_classement, points, rang, periode_debut, periode_fin)
    SELECT 
        id,
        'hebdomadaire',
        points_hebdo,
        rang_hebdo,
        DATE_TRUNC('week', CURRENT_DATE - INTERVAL '7 days'),
        DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 day'
    FROM profiles
    WHERE COALESCE(points_hebdo, 0) > 0;
    
    -- Reset les points hebdomadaires
    UPDATE profiles SET points_hebdo = 0, rang_hebdo = NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FONCTION: Reset mensuel
-- ============================================
CREATE OR REPLACE FUNCTION reset_points_mensuels() RETURNS void AS $$
BEGIN
    -- Sauvegarder les scores du mois
    INSERT INTO ranking_snapshots (profile_id, type_classement, points, rang, periode_debut, periode_fin)
    SELECT 
        id,
        'mensuel',
        points_mensuel,
        rang_mensuel,
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'),
        DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day'
    FROM profiles
    WHERE COALESCE(points_mensuel, 0) > 0;
    
    -- Reset les points mensuels
    UPDATE profiles SET points_mensuel = 0, rang_mensuel = NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FONCTION: Créer un défi
-- ============================================
CREATE OR REPLACE FUNCTION creer_defi(
    p_challenger_id UUID,
    p_challenged_id UUID,
    p_theme_id INTEGER DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_defi_id INTEGER;
BEGIN
    INSERT INTO defis (challenger_id, challenged_id, theme_id, statut)
    VALUES (p_challenger_id, p_challenged_id, p_theme_id, 'en_attente')
    RETURNING id INTO v_defi_id;
    
    RETURN v_defi_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FONCTION: Obtenir la position d'un utilisateur
-- ============================================
CREATE OR REPLACE FUNCTION get_position_utilisateur(
    p_user_id UUID DEFAULT NULL
) RETURNS TABLE (
    type_classement VARCHAR,
    rang INTEGER,
    points INTEGER,
    total_participants INTEGER
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := COALESCE(p_user_id, auth.uid());
    
    RETURN QUERY
    -- Position globale
    SELECT 
        'global'::VARCHAR,
        (SELECT COUNT(*)::INTEGER + 1 FROM profiles WHERE COALESCE(points_total, 0) > 
            (SELECT COALESCE(points_total, 0) FROM profiles WHERE id = v_user_id)),
        (SELECT COALESCE(points_total, 0) FROM profiles WHERE id = v_user_id)::INTEGER,
        (SELECT COUNT(*)::INTEGER FROM profiles WHERE COALESCE(points_total, 0) > 0)
    UNION ALL
    -- Position hebdomadaire
    SELECT 
        'hebdomadaire'::VARCHAR,
        (SELECT COUNT(*)::INTEGER + 1 FROM profiles WHERE COALESCE(points_hebdo, 0) > 
            (SELECT COALESCE(points_hebdo, 0) FROM profiles WHERE id = v_user_id)),
        (SELECT COALESCE(points_hebdo, 0) FROM profiles WHERE id = v_user_id)::INTEGER,
        (SELECT COUNT(*)::INTEGER FROM profiles WHERE COALESCE(points_hebdo, 0) > 0)
    UNION ALL
    -- Position mensuelle
    SELECT 
        'mensuel'::VARCHAR,
        (SELECT COUNT(*)::INTEGER + 1 FROM profiles WHERE COALESCE(points_mensuel, 0) > 
            (SELECT COALESCE(points_mensuel, 0) FROM profiles WHERE id = v_user_id)),
        (SELECT COALESCE(points_mensuel, 0) FROM profiles WHERE id = v_user_id)::INTEGER,
        (SELECT COUNT(*)::INTEGER FROM profiles WHERE COALESCE(points_mensuel, 0) > 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger pour mettre à jour les rangs après chaque changement de points
CREATE OR REPLACE FUNCTION trigger_update_rangs() RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_rangs();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_rangs_on_points_change ON profiles;
CREATE TRIGGER update_rangs_on_points_change
AFTER UPDATE OF points_total, points_hebdo, points_mensuel ON profiles
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_update_rangs();

-- ============================================
-- PERMISSIONS
-- ============================================

-- Permissions pour les fonctions
GRANT EXECUTE ON FUNCTION calculate_session_points TO authenticated;
GRANT EXECUTE ON FUNCTION get_classement_global TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_classement_hebdomadaire TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_classement_mensuel TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_classement_par_theme TO anon, authenticated;
GRANT EXECUTE ON FUNCTION rechercher_utilisateur_classement TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_position_utilisateur TO anon, authenticated;
GRANT EXECUTE ON FUNCTION creer_defi TO authenticated;

-- Permissions pour les tables
GRANT SELECT ON public.points_history TO authenticated;
GRANT SELECT ON public.ranking_snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.defis TO authenticated;

-- ============================================
-- INITIALISATION DES DONNÉES
-- ============================================

-- Mettre à jour les rangs existants
SELECT update_rangs();