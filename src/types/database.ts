// ============================================
// TYPES TYPESCRIPT POUR LA BASE DE DONNÉES
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          concours_type: 'caporal' | 'lieutenant';
          niveau: 'debutant' | 'intermediaire' | 'avance';
          date_concours: string | null;
          objectif_quotidien: number;
          points_total: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          concours_type?: 'caporal' | 'lieutenant';
          niveau?: 'debutant' | 'intermediaire' | 'avance';
          date_concours?: string | null;
          objectif_quotidien?: number;
          points_total?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          concours_type?: 'caporal' | 'lieutenant';
          niveau?: 'debutant' | 'intermediaire' | 'avance';
          date_concours?: string | null;
          objectif_quotidien?: number;
          points_total?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      themes: {
        Row: {
          id: number;
          nom: string;
          description: string | null;
          couleur: string;
          icone: string | null;
          ordre: number;
          actif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          nom: string;
          description?: string | null;
          couleur?: string;
          icone?: string | null;
          ordre?: number;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          nom?: string;
          description?: string | null;
          couleur?: string;
          icone?: string | null;
          ordre?: number;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sous_themes: {
        Row: {
          id: number;
          theme_id: number;
          nom: string;
          description: string | null;
          ordre: number;
          actif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          theme_id: number;
          nom: string;
          description?: string | null;
          ordre?: number;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          theme_id?: number;
          nom?: string;
          description?: string | null;
          ordre?: number;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      questions: {
        Row: {
          id: number;
          sous_theme_id: number;
          type_question: 'QCU' | 'QCM';
          niveau_difficulte: number;
          enonce: string;
          points: number;
          temps_limite: number;
          actif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          sous_theme_id: number;
          type_question?: 'QCU' | 'QCM';
          niveau_difficulte?: number;
          enonce: string;
          points?: number;
          temps_limite?: number;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          sous_theme_id?: number;
          type_question?: 'QCU' | 'QCM';
          niveau_difficulte?: number;
          enonce?: string;
          points?: number;
          temps_limite?: number;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      reponses: {
        Row: {
          id: number;
          question_id: number;
          lettre: 'A' | 'B' | 'C' | 'D';
          texte: string;
          est_correcte: boolean;
          ordre: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          question_id: number;
          lettre: 'A' | 'B' | 'C' | 'D';
          texte: string;
          est_correcte?: boolean;
          ordre?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          question_id?: number;
          lettre?: 'A' | 'B' | 'C' | 'D';
          texte?: string;
          est_correcte?: boolean;
          ordre?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      explications: {
        Row: {
          id: number;
          question_id: number;
          texte_explication: string;
          source: string | null;
          lien_ressource: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          question_id: number;
          texte_explication: string;
          source?: string | null;
          lien_ressource?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          question_id?: number;
          texte_explication?: string;
          source?: string | null;
          lien_ressource?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: number;
          profile_id: string;
          type_session: 'entrainement' | 'examen' | 'revision';
          theme_id: number | null;
          sous_theme_id: number | null;
          score: number;
          nombre_questions: number;
          nombre_reponses_correctes: number;
          temps_total: number;
          statut: 'en_cours' | 'terminee' | 'abandonnee';
          date_debut: string;
          date_fin: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          profile_id: string;
          type_session?: 'entrainement' | 'examen' | 'revision';
          theme_id?: number | null;
          sous_theme_id?: number | null;
          score?: number;
          nombre_questions?: number;
          nombre_reponses_correctes?: number;
          temps_total?: number;
          statut?: 'en_cours' | 'terminee' | 'abandonnee';
          date_debut?: string;
          date_fin?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          profile_id?: string;
          type_session?: 'entrainement' | 'examen' | 'revision';
          theme_id?: number | null;
          sous_theme_id?: number | null;
          score?: number;
          nombre_questions?: number;
          nombre_reponses_correctes?: number;
          temps_total?: number;
          statut?: 'en_cours' | 'terminee' | 'abandonnee';
          date_debut?: string;
          date_fin?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reponses_utilisateur: {
        Row: {
          id: number;
          session_id: number;
          question_id: number;
          reponse_id: number | null;
          est_correcte: boolean;
          temps_reponse: number | null;
          marquee_pour_revision: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          session_id: number;
          question_id: number;
          reponse_id?: number | null;
          est_correcte?: boolean;
          temps_reponse?: number | null;
          marquee_pour_revision?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          session_id?: number;
          question_id?: number;
          reponse_id?: number | null;
          est_correcte?: boolean;
          temps_reponse?: number | null;
          marquee_pour_revision?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {
      get_random_questions: {
        Args: {
          p_theme_id?: number | null;
          p_sous_theme_id?: number | null;
          p_limit?: number;
        };
        Returns: {
          question_id: number;
          enonce: string;
          type_question: string;
          niveau_difficulte: number;
          temps_limite: number;
          theme_nom: string;
          sous_theme_nom: string;
        }[];
      };
      get_user_stats: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          total_sessions: number;
          total_questions: number;
          questions_correctes: number;
          taux_reussite: number;
          temps_moyen: number;
          points_total: number;
        }[];
      };
    };
    Enums: {
      concours_type: 'caporal' | 'lieutenant';
      niveau: 'debutant' | 'intermediaire' | 'avance';
      type_session: 'entrainement' | 'examen' | 'revision';
      type_question: 'QCU' | 'QCM';
      statut_session: 'en_cours' | 'terminee' | 'abandonnee';
    };
  };
}

// Types utilitaires
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

export type InsertTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

export type UpdateTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];

// Types spécifiques pour l'application
export type Profile = Tables<'profiles'>;
export type Theme = Tables<'themes'>;
export type SousTheme = Tables<'sous_themes'>;
export type Question = Tables<'questions'>;
export type Reponse = Tables<'reponses'>;
export type Explication = Tables<'explications'>;
export type Session = Tables<'sessions'>;
export type ReponseUtilisateur = Tables<'reponses_utilisateur'>;

// Types étendus avec relations
export interface QuestionWithReponses extends Question {
  reponses: Reponse[];
  explication?: Explication;
  sous_theme?: SousTheme & {
    theme?: Theme;
  };
}

export interface SessionWithDetails extends Session {
  profile?: Profile;
  theme?: Theme;
  sous_theme?: SousTheme;
  reponses_utilisateur?: ReponseUtilisateur[];
}

export interface ThemeWithSousThemes extends Theme {
  sous_themes: SousTheme[];
}

export interface UserStats {
  total_sessions: number;
  total_questions: number;
  questions_correctes: number;
  taux_reussite: number;
  temps_moyen: number;
  points_total: number;
  progression_par_theme?: {
    theme: string;
    pourcentage: number;
    questions_repondues: number;
  }[];
}