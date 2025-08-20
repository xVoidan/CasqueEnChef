-- Schema de la base de données CasqueEnMain
-- Généré le: 2025-08-20
-- Description: Structure complète de la base de données pour l'application de quiz sécurité

-- ============================================
-- TABLES DE BASE
-- ============================================

-- Table: categories
-- Description: Catégories de quiz (Sécurité, Ergonomie, etc.)
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: entreprises
-- Description: Entreprises utilisant l'application
CREATE TABLE IF NOT EXISTS public.entreprises (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: profiles
-- Description: Profils utilisateurs liés à auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    entreprise_id INTEGER REFERENCES public.entreprises(id),
    role VARCHAR(50) DEFAULT 'user',
    avatar_url TEXT,
    experience_points INTEGER DEFAULT 0,
    niveau INTEGER DEFAULT 1,
    badges_earned TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLES DE QUIZ
-- ============================================

-- Table: quiz
-- Description: Quiz disponibles dans l'application
CREATE TABLE IF NOT EXISTS public.quiz (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    categorie_id INTEGER REFERENCES public.categories(id),
    entreprise_id INTEGER REFERENCES public.entreprises(id),
    duree_minutes INTEGER DEFAULT 30,
    nombre_questions INTEGER DEFAULT 10,
    est_public BOOLEAN DEFAULT true,
    niveau_difficulte INTEGER DEFAULT 1 CHECK (niveau_difficulte BETWEEN 1 AND 5),
    points_total INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: questions
-- Description: Questions associées aux quiz
CREATE TABLE IF NOT EXISTS public.questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES public.quiz(id) ON DELETE CASCADE,
    texte TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'choix_multiple' CHECK (type IN ('choix_multiple', 'vrai_faux', 'texte_libre')),
    ordre INTEGER DEFAULT 1,
    points INTEGER DEFAULT 10,
    temps_limite_secondes INTEGER,
    image_url TEXT,
    explication TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: reponses
-- Description: Réponses possibles pour chaque question
CREATE TABLE IF NOT EXISTS public.reponses (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES public.questions(id) ON DELETE CASCADE,
    texte TEXT NOT NULL,
    est_correcte BOOLEAN DEFAULT false,
    ordre INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLES DE SESSIONS
-- ============================================

-- Table: sessions_quiz
-- Description: Sessions de quiz des utilisateurs
CREATE TABLE IF NOT EXISTS public.sessions_quiz (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES public.quiz(id),
    user_id UUID REFERENCES auth.users(id),
    statut VARCHAR(20) DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'termine', 'abandonne')),
    score_actuel INTEGER DEFAULT 0,
    score_final INTEGER,
    question_actuelle INTEGER DEFAULT 1,
    temps_total INTEGER DEFAULT 0,
    temps_passe INTEGER DEFAULT 0,
    questions_repondues INTEGER DEFAULT 0,
    reponses_correctes INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: reponses_utilisateur
-- Description: Réponses données par les utilisateurs
CREATE TABLE IF NOT EXISTS public.reponses_utilisateur (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES public.sessions_quiz(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES public.questions(id),
    reponse_id INTEGER REFERENCES public.reponses(id),
    reponse_texte TEXT, -- Pour les questions à texte libre
    est_correcte BOOLEAN,
    temps_reponse INTEGER, -- Temps en secondes
    points_gagnes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLES DE GAMIFICATION
-- ============================================

-- Table: experience_levels
-- Description: Niveaux d'expérience
CREATE TABLE IF NOT EXISTS public.experience_levels (
    id SERIAL PRIMARY KEY,
    niveau INTEGER UNIQUE NOT NULL,
    nom VARCHAR(50) NOT NULL,
    points_requis INTEGER NOT NULL,
    badge_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: achievements
-- Description: Succès déblocables
CREATE TABLE IF NOT EXISTS public.achievements (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    condition_type VARCHAR(50) NOT NULL, -- 'quiz_complete', 'score_perfect', 'streak', etc.
    condition_value INTEGER,
    points_reward INTEGER DEFAULT 0,
    badge_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: user_achievements
-- Description: Succès débloqués par utilisateur
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id INTEGER REFERENCES public.achievements(id),
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- ============================================
-- TABLES DE LIAISON
-- ============================================

-- Table: quiz_questions (optionnelle, pour ordre personnalisé)
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES public.quiz(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES public.questions(id) ON DELETE CASCADE,
    ordre INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(quiz_id, question_id)
);

-- ============================================
-- INDEX POUR OPTIMISATION
-- ============================================

-- Index sur les clés étrangères
CREATE INDEX IF NOT EXISTS idx_quiz_categorie ON public.quiz(categorie_id);
CREATE INDEX IF NOT EXISTS idx_quiz_entreprise ON public.quiz(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON public.questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_reponses_question ON public.reponses(question_id);
CREATE INDEX IF NOT EXISTS idx_sessions_quiz_user ON public.sessions_quiz(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_quiz_quiz ON public.sessions_quiz(quiz_id);
CREATE INDEX IF NOT EXISTS idx_sessions_quiz_status ON public.sessions_quiz(statut);
CREATE INDEX IF NOT EXISTS idx_reponses_utilisateur_session ON public.reponses_utilisateur(session_id);
CREATE INDEX IF NOT EXISTS idx_profiles_entreprise ON public.profiles(entreprise_id);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_sessions_active ON public.sessions_quiz(user_id, statut) WHERE statut = 'en_cours';
CREATE INDEX IF NOT EXISTS idx_quiz_public ON public.quiz(est_public) WHERE est_public = true;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ============================================
-- TRIGGERS ET FONCTIONS
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at sur toutes les tables principales
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entreprises_updated_at BEFORE UPDATE ON public.entreprises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_updated_at BEFORE UPDATE ON public.quiz
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reponses_updated_at BEFORE UPDATE ON public.reponses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_quiz_updated_at BEFORE UPDATE ON public.sessions_quiz
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- POLITIQUES RLS (Row Level Security)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entreprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reponses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions_quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reponses_utilisateur ENABLE ROW LEVEL SECURITY;

-- Politique pour profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Politique pour quiz (lecture publique)
CREATE POLICY "Public quiz are viewable by everyone" ON public.quiz
    FOR SELECT USING (est_public = true);

-- Politique pour sessions_quiz
CREATE POLICY "Users can view own sessions" ON public.sessions_quiz
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON public.sessions_quiz
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.sessions_quiz
    FOR UPDATE USING (auth.uid() = user_id);

-- Politique pour reponses_utilisateur
CREATE POLICY "Users can view own answers" ON public.reponses_utilisateur
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sessions_quiz
            WHERE sessions_quiz.id = reponses_utilisateur.session_id
            AND sessions_quiz.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own answers" ON public.reponses_utilisateur
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sessions_quiz
            WHERE sessions_quiz.id = reponses_utilisateur.session_id
            AND sessions_quiz.user_id = auth.uid()
        )
    );

-- ============================================
-- DONNÉES INITIALES
-- ============================================

-- Insertion des catégories de base
INSERT INTO public.categories (nom, description) VALUES
    ('Sécurité', 'Questions sur la sécurité au travail et les EPI'),
    ('Ergonomie', 'Questions sur l''ergonomie et les bonnes postures'),
    ('Réglementation', 'Questions sur les normes et réglementations'),
    ('Premiers secours', 'Questions sur les gestes de premiers secours'),
    ('Prévention', 'Questions sur la prévention des risques')
ON CONFLICT (nom) DO NOTHING;

-- Insertion des niveaux d'expérience
INSERT INTO public.experience_levels (niveau, nom, points_requis) VALUES
    (1, 'Débutant', 0),
    (2, 'Apprenti', 100),
    (3, 'Confirmé', 300),
    (4, 'Expert', 600),
    (5, 'Maître', 1000)
ON CONFLICT (niveau) DO NOTHING;

-- Insertion des achievements de base
INSERT INTO public.achievements (nom, description, condition_type, condition_value, points_reward) VALUES
    ('Premier Quiz', 'Terminer votre premier quiz', 'quiz_complete', 1, 10),
    ('Score Parfait', 'Obtenir 100% à un quiz', 'score_perfect', 100, 50),
    ('Série de 5', 'Terminer 5 quiz d''affilée', 'streak', 5, 30),
    ('Marathon', 'Terminer 10 quiz en une journée', 'daily_count', 10, 100),
    ('Expert Sécurité', 'Terminer tous les quiz de sécurité', 'category_complete', 1, 200)
ON CONFLICT (nom) DO NOTHING;

-- ============================================
-- COMMENTAIRES SUR LES TABLES
-- ============================================

COMMENT ON TABLE public.profiles IS 'Profils utilisateurs avec informations de gamification';
COMMENT ON TABLE public.entreprises IS 'Entreprises utilisant l''application';
COMMENT ON TABLE public.categories IS 'Catégories de quiz (Sécurité, Ergonomie, etc.)';
COMMENT ON TABLE public.quiz IS 'Quiz disponibles dans l''application';
COMMENT ON TABLE public.questions IS 'Questions des quiz avec support multimédia';
COMMENT ON TABLE public.reponses IS 'Réponses possibles pour chaque question';
COMMENT ON TABLE public.sessions_quiz IS 'Sessions de quiz avec suivi détaillé';
COMMENT ON TABLE public.reponses_utilisateur IS 'Réponses données par les utilisateurs';
COMMENT ON TABLE public.experience_levels IS 'Niveaux d''expérience pour la gamification';
COMMENT ON TABLE public.achievements IS 'Succès déblocables dans l''application';

-- ============================================
-- FIN DU SCHEMA
-- ============================================