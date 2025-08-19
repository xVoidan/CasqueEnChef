// Types pour les éléments sans typage

export interface Badge {
  id?: number;
  nom: string;
  description: string;
  icone: string;
  couleur: string;
  points?: number;
  niveau?: number;
  categorie?: string;
}

export interface Challenge {
  id: number;
  nom: string;
  description: string;
  progression: number;
  objectif: number;
  icone?: string;
  couleur?: string;
  points_recompense?: number;
}

export interface Notification {
  id: string;
  titre: string;
  message: string;
  type: string;
  icone?: string;
  couleur?: string;
  lu?: boolean;
}

export interface Reward {
  type: 'badge' | 'challenge' | 'rank';
  id: number | string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
}

export interface SessionStats {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  averageTime: number;
  themes: string[];
  duration: number;
}

export interface QuestionItem {
  id: number;
  enonce: string;
  type_question: 'QCU' | 'QCM';
  niveau_difficulte: number;
  temps_limite: number;
  points: number;
  reponses: Array<{
    id: number;
    lettre: string;
    texte: string;
    est_correcte: boolean;
  }>;
  explication?: {
    texte_explication: string;
    source?: string;
    lien_ressource?: string;
  };
  sous_theme?: {
    id: number;
    nom: string;
    theme?: {
      id: number;
      nom: string;
      couleur: string;
    };
  };
}
