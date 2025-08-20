-- Migration: Optimisation des requêtes quiz par catégorie (VERSION CORRIGÉE)
-- Date: 2025-08-20
-- Description: Amélioration des performances pour les requêtes quiz sans utiliser points_total

-- ============================================
-- CRÉATION D'UNE VUE MATÉRIALISÉE POUR LES QUIZ PAR CATÉGORIE
-- ============================================

-- Supprimer la vue matérialisée si elle existe
DROP MATERIALIZED VIEW IF EXISTS public.quiz_by_category_cached;

-- Créer une vue matérialisée pour accélérer les requêtes
-- Note: Suppression de points_total qui n'existe pas dans la table
CREATE MATERIALIZED VIEW public.quiz_by_category_cached AS
SELECT 
    q.id,
    q.titre,
    q.description,
    q.categorie_id,
    c.nom as categorie_nom,
    q.entreprise_id,
    e.nom as entreprise_nom,
    q.duree_minutes,
    q.nombre_questions,
    q.est_public,
    q.niveau_difficulte,
    q.created_at,
    q.updated_at,
    COUNT(DISTINCT quest.id) as questions_count,
    COUNT(DISTINCT s.id) as sessions_count,
    AVG(s.score_final) as avg_score,
    -- Calculer les points totaux basés sur les questions
    COALESCE(SUM(DISTINCT quest.points), 100) as points_total_calcule
FROM public.quiz q
LEFT JOIN public.categories c ON q.categorie_id = c.id
LEFT JOIN public.entreprises e ON q.entreprise_id = e.id
LEFT JOIN public.questions quest ON quest.quiz_id = q.id
LEFT JOIN public.sessions_quiz s ON s.quiz_id = q.id AND s.statut = 'complete'
GROUP BY 
    q.id, q.titre, q.description, q.categorie_id, c.nom,
    q.entreprise_id, e.nom, q.duree_minutes, q.nombre_questions,
    q.est_public, q.niveau_difficulte, q.created_at, q.updated_at;

-- Créer un index unique pour le refresh concurrent
CREATE UNIQUE INDEX idx_quiz_by_category_cached_id ON public.quiz_by_category_cached(id);

-- Index pour accélérer les recherches par catégorie
CREATE INDEX idx_quiz_by_category_cached_cat ON public.quiz_by_category_cached(categorie_id);
CREATE INDEX idx_quiz_by_category_cached_public ON public.quiz_by_category_cached(est_public);
CREATE INDEX idx_quiz_by_category_cached_entreprise ON public.quiz_by_category_cached(entreprise_id);

-- ============================================
-- FONCTION POUR RÉCUPÉRER LES QUIZ PAR CATÉGORIE
-- ============================================

DROP FUNCTION IF EXISTS public.get_quiz_by_category;

CREATE OR REPLACE FUNCTION public.get_quiz_by_category(
    p_categorie_id INTEGER DEFAULT NULL,
    p_entreprise_id INTEGER DEFAULT NULL,
    p_only_public BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    id INTEGER,
    titre VARCHAR,
    description TEXT,
    categorie_id INTEGER,
    categorie_nom VARCHAR,
    entreprise_id INTEGER,
    entreprise_nom VARCHAR,
    duree_minutes INTEGER,
    nombre_questions INTEGER,
    est_public BOOLEAN,
    niveau_difficulte INTEGER,
    points_total_calcule NUMERIC,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    questions_count BIGINT,
    sessions_count BIGINT,
    avg_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qbc.id,
        qbc.titre,
        qbc.description,
        qbc.categorie_id,
        qbc.categorie_nom,
        qbc.entreprise_id,
        qbc.entreprise_nom,
        qbc.duree_minutes,
        qbc.nombre_questions,
        qbc.est_public,
        qbc.niveau_difficulte,
        qbc.points_total_calcule,
        qbc.created_at,
        qbc.updated_at,
        qbc.questions_count,
        qbc.sessions_count,
        qbc.avg_score
    FROM public.quiz_by_category_cached qbc
    WHERE 
        (p_categorie_id IS NULL OR qbc.categorie_id = p_categorie_id)
        AND (p_entreprise_id IS NULL OR qbc.entreprise_id = p_entreprise_id)
        AND (NOT p_only_public OR qbc.est_public = true)
    ORDER BY qbc.created_at DESC;
END;
$$;

-- ============================================
-- FONCTION POUR RAFRAÎCHIR LA VUE MATÉRIALISÉE
-- ============================================

DROP FUNCTION IF EXISTS public.refresh_quiz_cache();

CREATE OR REPLACE FUNCTION public.refresh_quiz_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.quiz_by_category_cached;
END;
$$;

-- ============================================
-- TABLE DE MAINTENANCE POUR GÉRER LES CACHES
-- ============================================

CREATE TABLE IF NOT EXISTS public.cache_maintenance (
    cache_name VARCHAR(255) PRIMARY KEY,
    needs_refresh BOOLEAN DEFAULT false,
    triggered_at TIMESTAMPTZ,
    last_refresh TIMESTAMPTZ
);

-- ============================================
-- FONCTION TRIGGER POUR MARQUER LE CACHE COMME OBSOLÈTE
-- ============================================

DROP FUNCTION IF EXISTS public.mark_quiz_cache_stale() CASCADE;

CREATE OR REPLACE FUNCTION public.mark_quiz_cache_stale()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insérer un flag dans la table de maintenance
    INSERT INTO public.cache_maintenance (cache_name, needs_refresh, triggered_at)
    VALUES ('quiz_by_category_cached', true, NOW())
    ON CONFLICT (cache_name) 
    DO UPDATE SET needs_refresh = true, triggered_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGERS SUR LES TABLES CONCERNÉES
-- ============================================

-- Supprimer les triggers existants
DROP TRIGGER IF EXISTS trigger_quiz_change ON public.quiz;
DROP TRIGGER IF EXISTS trigger_questions_change ON public.questions;
DROP TRIGGER IF EXISTS trigger_sessions_change ON public.sessions_quiz;

-- Recréer les triggers
CREATE TRIGGER trigger_quiz_change
AFTER INSERT OR UPDATE OR DELETE ON public.quiz
FOR EACH STATEMENT
EXECUTE FUNCTION public.mark_quiz_cache_stale();

CREATE TRIGGER trigger_questions_change
AFTER INSERT OR UPDATE OR DELETE ON public.questions
FOR EACH STATEMENT
EXECUTE FUNCTION public.mark_quiz_cache_stale();

CREATE TRIGGER trigger_sessions_change
AFTER INSERT OR UPDATE ON public.sessions_quiz
FOR EACH STATEMENT
EXECUTE FUNCTION public.mark_quiz_cache_stale();

-- ============================================
-- FONCTION DE RAFRAÎCHISSEMENT AUTOMATIQUE
-- ============================================

DROP FUNCTION IF EXISTS public.auto_refresh_caches();

CREATE OR REPLACE FUNCTION public.auto_refresh_caches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_needs_refresh BOOLEAN;
BEGIN
    -- Vérifier si le cache quiz a besoin d'être rafraîchi
    SELECT needs_refresh INTO v_needs_refresh
    FROM public.cache_maintenance
    WHERE cache_name = 'quiz_by_category_cached';
    
    IF v_needs_refresh THEN
        -- Rafraîchir le cache
        REFRESH MATERIALIZED VIEW CONCURRENTLY public.quiz_by_category_cached;
        
        -- Marquer comme rafraîchi
        UPDATE public.cache_maintenance
        SET needs_refresh = false, last_refresh = NOW()
        WHERE cache_name = 'quiz_by_category_cached';
    END IF;
END;
$$;

-- ============================================
-- FONCTION POUR OBTENIR LES STATISTIQUES D'UN QUIZ
-- ============================================

DROP FUNCTION IF EXISTS public.get_quiz_statistics;

CREATE OR REPLACE FUNCTION public.get_quiz_statistics(p_quiz_id INTEGER)
RETURNS TABLE (
    quiz_id INTEGER,
    total_sessions BIGINT,
    completed_sessions BIGINT,
    average_score NUMERIC,
    average_time_minutes NUMERIC,
    success_rate NUMERIC,
    total_points_possible INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id as quiz_id,
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(DISTINCT CASE WHEN s.statut = 'complete' THEN s.id END) as completed_sessions,
        AVG(s.score_final) as average_score,
        AVG(s.temps_total / 60.0) as average_time_minutes,
        AVG(CASE WHEN s.statut = 'complete' THEN s.reponses_correctes::NUMERIC / NULLIF(s.questions_repondues, 0) END) * 100 as success_rate,
        COALESCE(SUM(DISTINCT quest.points), 100) as total_points_possible
    FROM public.quiz q
    LEFT JOIN public.sessions_quiz s ON s.quiz_id = q.id
    LEFT JOIN public.questions quest ON quest.quiz_id = q.id
    WHERE q.id = p_quiz_id
    GROUP BY q.id;
END;
$$;

-- ============================================
-- INITIALISATION
-- ============================================

-- Initialiser la table de maintenance
INSERT INTO public.cache_maintenance (cache_name, needs_refresh, last_refresh)
VALUES ('quiz_by_category_cached', false, NOW())
ON CONFLICT (cache_name) DO NOTHING;

-- Rafraîchir une première fois la vue matérialisée
REFRESH MATERIALIZED VIEW public.quiz_by_category_cached;