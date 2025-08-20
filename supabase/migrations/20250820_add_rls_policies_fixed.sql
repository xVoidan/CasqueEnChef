-- Migration: Ajout des RLS policies pour sécuriser la base de données (VERSION CORRIGÉE)
-- Date: 2025-08-20
-- Description: Mise en place des politiques de sécurité Row Level Security avec vérification d'existence

-- ============================================
-- ACTIVATION RLS SUR TOUTES LES TABLES
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entreprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reponses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions_quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reponses_utilisateur ENABLE ROW LEVEL SECURITY;

-- Tables de gamification (si elles existent)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'experience_levels') THEN
        ALTER TABLE public.experience_levels ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'achievements') THEN
        ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_achievements') THEN
        ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ============================================
-- POLICIES POUR LA TABLE PROFILES
-- ============================================

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- POLICIES POUR LA TABLE ENTREPRISES
-- ============================================

DROP POLICY IF EXISTS "Anyone can view active entreprises" ON public.entreprises;
DROP POLICY IF EXISTS "Only admins can manage entreprises" ON public.entreprises;

-- Tout le monde peut voir les entreprises actives
CREATE POLICY "Anyone can view active entreprises" ON public.entreprises
    FOR SELECT USING (actif = true);

-- Seuls les admins peuvent modifier
CREATE POLICY "Only admins can manage entreprises" ON public.entreprises
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- POLICIES POUR LA TABLE CATEGORIES
-- ============================================

DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Only admins can manage categories" ON public.categories;

-- Tout le monde peut voir les catégories
CREATE POLICY "Anyone can view categories" ON public.categories
    FOR SELECT USING (true);

-- Seuls les admins peuvent modifier
CREATE POLICY "Only admins can manage categories" ON public.categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- POLICIES POUR LA TABLE QUIZ
-- ============================================

DROP POLICY IF EXISTS "View public or company quiz" ON public.quiz;
DROP POLICY IF EXISTS "Admins can manage all quiz" ON public.quiz;

-- Voir les quiz publics ou de son entreprise
CREATE POLICY "View public or company quiz" ON public.quiz
    FOR SELECT USING (
        est_public = true OR
        entreprise_id IN (
            SELECT entreprise_id FROM public.profiles
            WHERE id = auth.uid()
        )
    );

-- Admins peuvent tout gérer
CREATE POLICY "Admins can manage all quiz" ON public.quiz
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- POLICIES POUR LA TABLE QUESTIONS
-- ============================================

DROP POLICY IF EXISTS "View questions from accessible quiz" ON public.questions;
DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;

-- Voir les questions des quiz accessibles
CREATE POLICY "View questions from accessible quiz" ON public.questions
    FOR SELECT USING (
        quiz_id IN (
            SELECT id FROM public.quiz
            WHERE est_public = true OR
            entreprise_id IN (
                SELECT entreprise_id FROM public.profiles
                WHERE id = auth.uid()
            )
        )
    );

-- Admins peuvent tout gérer
CREATE POLICY "Admins can manage questions" ON public.questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- POLICIES POUR LA TABLE REPONSES
-- ============================================

DROP POLICY IF EXISTS "View answers from accessible questions" ON public.reponses;
DROP POLICY IF EXISTS "Admins can manage answers" ON public.reponses;

-- Voir les réponses des questions accessibles
CREATE POLICY "View answers from accessible questions" ON public.reponses
    FOR SELECT USING (
        question_id IN (
            SELECT id FROM public.questions q
            JOIN public.quiz qz ON q.quiz_id = qz.id
            WHERE qz.est_public = true OR
            qz.entreprise_id IN (
                SELECT entreprise_id FROM public.profiles
                WHERE id = auth.uid()
            )
        )
    );

-- Admins peuvent tout gérer
CREATE POLICY "Admins can manage answers" ON public.reponses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- POLICIES POUR LA TABLE SESSIONS_QUIZ
-- ============================================

DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions_quiz;
DROP POLICY IF EXISTS "Users can create own sessions" ON public.sessions_quiz;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions_quiz;

-- Les utilisateurs ne voient que leurs propres sessions
CREATE POLICY "Users can view own sessions" ON public.sessions_quiz
    FOR SELECT USING (user_id = auth.uid());

-- Les utilisateurs peuvent créer leurs propres sessions
CREATE POLICY "Users can create own sessions" ON public.sessions_quiz
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Les utilisateurs peuvent mettre à jour leurs propres sessions
CREATE POLICY "Users can update own sessions" ON public.sessions_quiz
    FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- POLICIES POUR LA TABLE REPONSES_UTILISATEUR
-- ============================================

DROP POLICY IF EXISTS "Users can view own answers" ON public.reponses_utilisateur;
DROP POLICY IF EXISTS "Users can create own answers" ON public.reponses_utilisateur;

-- Les utilisateurs ne voient que leurs propres réponses
CREATE POLICY "Users can view own answers" ON public.reponses_utilisateur
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM public.sessions_quiz
            WHERE user_id = auth.uid()
        )
    );

-- Les utilisateurs peuvent créer leurs propres réponses
CREATE POLICY "Users can create own answers" ON public.reponses_utilisateur
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM public.sessions_quiz
            WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- POLICIES POUR LES TABLES DE GAMIFICATION (si elles existent)
-- ============================================

DO $$ 
BEGIN
    -- Experience levels
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'experience_levels') THEN
        DROP POLICY IF EXISTS "Anyone can view experience levels" ON public.experience_levels;
        CREATE POLICY "Anyone can view experience levels" ON public.experience_levels
            FOR SELECT USING (true);
    END IF;
    
    -- Achievements
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'achievements') THEN
        DROP POLICY IF EXISTS "Anyone can view achievements" ON public.achievements;
        CREATE POLICY "Anyone can view achievements" ON public.achievements
            FOR SELECT USING (true);
    END IF;
    
    -- User achievements
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_achievements') THEN
        DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
        DROP POLICY IF EXISTS "System can grant achievements" ON public.user_achievements;
        
        CREATE POLICY "Users can view own achievements" ON public.user_achievements
            FOR SELECT USING (user_id = auth.uid());
            
        CREATE POLICY "System can grant achievements" ON public.user_achievements
            FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- ============================================
-- CRÉATION D'INDEX POUR OPTIMISER LES REQUÊTES
-- ============================================

-- Index pour améliorer les performances de recherche par catégorie
CREATE INDEX IF NOT EXISTS idx_quiz_categorie_id ON public.quiz(categorie_id);
CREATE INDEX IF NOT EXISTS idx_quiz_entreprise_id ON public.quiz(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_quiz_public_categorie ON public.quiz(est_public, categorie_id);

-- Index pour les sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions_quiz(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_statut ON public.sessions_quiz(statut);

-- Index pour les questions
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON public.questions(quiz_id);

-- Index pour les réponses utilisateur
CREATE INDEX IF NOT EXISTS idx_reponses_user_session ON public.reponses_utilisateur(session_id);