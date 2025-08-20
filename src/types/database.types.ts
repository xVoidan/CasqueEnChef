export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          concours_type: string;
          niveau: string;
          date_concours: string | null;
          objectif_quotidien: number;
          points_total: number;
          created_at: string;
          updated_at: string;
          objectif_temps: number;
          objectif_reussite: number;
          points_hebdo: number;
          points_mensuel: number;
          rang_actuel: number | null;
          rang_precedent: number | null;
          derniere_activite: string;
          serie_actuelle: number;
          experience_points: number;
          entreprise_id: number | null;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          concours_type?: string;
          niveau?: string;
          date_concours?: string | null;
          objectif_quotidien?: number;
          points_total?: number;
          created_at?: string;
          updated_at?: string;
          objectif_temps?: number;
          objectif_reussite?: number;
          points_hebdo?: number;
          points_mensuel?: number;
          rang_actuel?: number | null;
          rang_precedent?: number | null;
          derniere_activite?: string;
          serie_actuelle?: number;
          experience_points?: number;
          entreprise_id?: number | null;
        };
        Update: {
          id?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          concours_type?: string;
          niveau?: string;
          date_concours?: string | null;
          objectif_quotidien?: number;
          points_total?: number;
          created_at?: string;
          updated_at?: string;
          objectif_temps?: number;
          objectif_reussite?: number;
          points_hebdo?: number;
          points_mensuel?: number;
          rang_actuel?: number | null;
          rang_precedent?: number | null;
          derniere_activite?: string;
          serie_actuelle?: number;
          experience_points?: number;
          entreprise_id?: number | null;
        };
      };
      entreprises: {
        Row: {
          id: number;
          nom: string;
          description: string;
          logo_url: string | null;
          actif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          nom: string;
          description: string;
          logo_url?: string | null;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          nom?: string;
          description?: string;
          logo_url?: string | null;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: number;
          nom: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          nom: string;
          description: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          nom?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      quiz: {
        Row: {
          id: number;
          titre: string;
          description: string;
          categorie_id: number;
          entreprise_id: number;
          duree_minutes: number;
          nombre_questions: number;
          est_public: boolean;
          niveau_difficulte: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          titre: string;
          description: string;
          categorie_id: number;
          entreprise_id: number;
          duree_minutes?: number;
          nombre_questions?: number;
          est_public?: boolean;
          niveau_difficulte?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          titre?: string;
          description?: string;
          categorie_id?: number;
          entreprise_id?: number;
          duree_minutes?: number;
          nombre_questions?: number;
          est_public?: boolean;
          niveau_difficulte?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      questions: {
        Row: {
          id: number;
          sous_theme_id: number;
          type_question: string;
          niveau_difficulte: number;
          enonce: string;
          points: number;
          temps_limite: number;
          actif: boolean;
          created_at: string;
          updated_at: string;
          quiz_id: number | null;
          ordre: number;
          texte: string;
        };
        Insert: {
          id?: number;
          sous_theme_id: number;
          type_question: string;
          niveau_difficulte: number;
          enonce: string;
          points?: number;
          temps_limite?: number;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
          quiz_id?: number | null;
          ordre?: number;
          texte: string;
        };
        Update: {
          id?: number;
          sous_theme_id?: number;
          type_question?: string;
          niveau_difficulte?: number;
          enonce?: string;
          points?: number;
          temps_limite?: number;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
          quiz_id?: number | null;
          ordre?: number;
          texte?: string;
        };
      };
      reponses: {
        Row: {
          id: number;
          question_id: number;
          lettre: string;
          texte: string;
          est_correcte: boolean;
          ordre: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          question_id: number;
          lettre: string;
          texte: string;
          est_correcte?: boolean;
          ordre?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          question_id?: number;
          lettre?: string;
          texte?: string;
          est_correcte?: boolean;
          ordre?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      sessions_quiz: {
        Row: {
          id: number;
          quiz_id: number;
          user_id: string;
          statut: string;
          score_actuel: number;
          score_final: number | null;
          question_actuelle: number;
          temps_total: number;
          started_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
          temps_passe: number;
          questions_repondues: number;
          reponses_correctes: number;
        };
        Insert: {
          id?: number;
          quiz_id: number;
          user_id: string;
          statut?: string;
          score_actuel?: number;
          score_final?: number | null;
          question_actuelle?: number;
          temps_total?: number;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          temps_passe?: number;
          questions_repondues?: number;
          reponses_correctes?: number;
        };
        Update: {
          id?: number;
          quiz_id?: number;
          user_id?: string;
          statut?: string;
          score_actuel?: number;
          score_final?: number | null;
          question_actuelle?: number;
          temps_total?: number;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          temps_passe?: number;
          questions_repondues?: number;
          reponses_correctes?: number;
        };
      };
      reponses_utilisateur: {
        Row: {
          id: number;
          session_id: number;
          question_id: number;
          reponse_id: number;
          est_correcte: boolean;
          temps_reponse: number;
          marquee_pour_revision: boolean;
          created_at: string;
          points_gagnes: number;
        };
        Insert: {
          id?: number;
          session_id: number;
          question_id: number;
          reponse_id: number;
          est_correcte?: boolean;
          temps_reponse: number;
          marquee_pour_revision?: boolean;
          created_at?: string;
          points_gagnes?: number;
        };
        Update: {
          id?: number;
          session_id?: number;
          question_id?: number;
          reponse_id?: number;
          est_correcte?: boolean;
          temps_reponse?: number;
          marquee_pour_revision?: boolean;
          created_at?: string;
          points_gagnes?: number;
        };
      };
      experience_levels: {
        Row: {
          id: number;
          level: number;
          required_xp: number;
          title: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          level: number;
          required_xp: number;
          title: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          level?: number;
          required_xp?: number;
          title?: string;
          created_at?: string;
        };
      };
      achievements: {
        Row: {
          id: number;
          name: string;
          description: string;
          icon: string;
          points: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          description: string;
          icon: string;
          points: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          description?: string;
          icon?: string;
          points?: number;
          created_at?: string;
        };
      };
      user_achievements: {
        Row: {
          id: number;
          user_id: string;
          achievement_id: number;
          earned_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          achievement_id: number;
          earned_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          achievement_id?: number;
          earned_at?: string;
        };
      };
    };
    Views: {
      quiz_with_stats: {
        Row: {
          id: number;
          titre: string;
          description: string;
          categorie_id: number;
          entreprise_id: number;
          duree_minutes: number;
          nombre_questions: number;
          est_public: boolean;
          niveau_difficulte: number;
          created_at: string;
          updated_at: string;
          total_sessions: number;
          avg_score: number;
          completion_rate: number;
        };
      };
    };
    Functions: {
      get_user_statistics: {
        Args: { user_id: string };
        Returns: {
          total_sessions: number;
          completed_sessions: number;
          average_score: number;
          total_time_spent: number;
        };
      };
      add_experience_points: {
        Args: { user_id: string; points: number };
        Returns: void;
      };
      get_quiz_by_category: {
        Args: {
          p_categorie_id?: number;
          p_entreprise_id?: number;
          p_only_public?: boolean;
        };
        Returns: {
          id: number;
          titre: string;
          description: string;
          categorie_id: number;
          categorie_nom: string;
          entreprise_id: number;
          entreprise_nom: string;
          duree_minutes: number;
          nombre_questions: number;
          est_public: boolean;
          niveau_difficulte: number;
          points_total_calcule: number;
          created_at: string;
          updated_at: string;
          questions_count: number;
          sessions_count: number;
          avg_score: number;
        }[];
      };
      refresh_quiz_cache: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
