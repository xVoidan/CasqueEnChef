-- Migration OPTIONNELLE: Ajouter le support des admins
-- Date: 2025-08-20
-- Description: Ajoute la colonne is_admin et met à jour les policies pour supporter les admins
-- ⚠️ À APPLIQUER SEULEMENT SI VOUS AVEZ BESOIN DE LA GESTION DES ADMINS

-- ============================================
-- ÉTAPE 1: AJOUTER LA COLONNE is_admin
-- ============================================

-- Ajouter la colonne is_admin si elle n'existe pas
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Définir vos admins (modifier selon vos besoins)
UPDATE public.profiles 
SET is_admin = true 
WHERE username IN ('AdminJo');  -- Remplacez par vos usernames admin

-- ============================================
-- ÉTAPE 2: METTRE À JOUR LES POLICIES POUR SUPPORTER LES ADMINS
-- ============================================

-- PROFILES: Les admins peuvent voir tous les profils
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- ENTREPRISES: Les admins peuvent tout gérer
DROP POLICY IF EXISTS "Admins can manage entreprises" ON public.entreprises;
CREATE POLICY "Admins can manage entreprises" ON public.entreprises
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- CATEGORIES: Les admins peuvent tout gérer
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- QUIZ: Les admins peuvent tout gérer
DROP POLICY IF EXISTS "Admins can manage all quiz" ON public.quiz;
CREATE POLICY "Admins can manage all quiz" ON public.quiz
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- QUESTIONS: Les admins peuvent tout gérer
DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;
CREATE POLICY "Admins can manage questions" ON public.questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- REPONSES: Les admins peuvent tout gérer
DROP POLICY IF EXISTS "Admins can manage answers" ON public.reponses;
CREATE POLICY "Admins can manage answers" ON public.reponses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- SESSIONS: Les admins peuvent voir toutes les sessions
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.sessions_quiz;
CREATE POLICY "Admins can view all sessions" ON public.sessions_quiz
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- REPONSES UTILISATEUR: Les admins peuvent voir toutes les réponses
DROP POLICY IF EXISTS "Admins can view all user answers" ON public.reponses_utilisateur;
CREATE POLICY "Admins can view all user answers" ON public.reponses_utilisateur
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM public.sessions_quiz
            WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- ============================================
-- ÉTAPE 3: CRÉER UNE VUE POUR LES ADMINS
-- ============================================

-- Vue pour faciliter la gestion des admins
CREATE OR REPLACE VIEW public.admin_users AS
SELECT 
    id,
    username,
    full_name,
    entreprise_id,
    is_admin,
    created_at,
    updated_at
FROM public.profiles
WHERE is_admin = true;

-- ============================================
-- ÉTAPE 4: FONCTION POUR PROMOUVOIR/RÉTROGRADER UN ADMIN
-- ============================================

CREATE OR REPLACE FUNCTION public.set_admin_status(
    p_user_id UUID,
    p_is_admin BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_user_is_admin BOOLEAN;
BEGIN
    -- Vérifier que l'utilisateur actuel est admin
    SELECT is_admin INTO v_current_user_is_admin
    FROM public.profiles
    WHERE id = auth.uid();
    
    IF NOT v_current_user_is_admin THEN
        RAISE EXCEPTION 'Seuls les admins peuvent modifier le statut admin';
    END IF;
    
    -- Mettre à jour le statut
    UPDATE public.profiles
    SET is_admin = p_is_admin,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN FOUND;
END;
$$;

-- ============================================
-- MESSAGE FINAL
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Support des admins ajouté avec succès!';
    RAISE NOTICE '👤 Les utilisateurs avec is_admin = true ont maintenant des privilèges étendus';
    RAISE NOTICE '🔧 Utilisez la fonction set_admin_status() pour gérer les admins';
END $$;