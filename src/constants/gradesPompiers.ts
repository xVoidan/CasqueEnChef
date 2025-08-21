export interface Grade {
  id: number;
  nom: string;
  nomComplet: string;
  pointsMin: number;
  pointsMax: number;
  icon: number;
  couleur: string;
  description: string;
}

export const GRADES_POMPIERS: Grade[] = [
  {
    id: 1,
    nom: 'Aspirant',
    nomComplet: 'Aspirant',
    pointsMin: 0,
    pointsMax: 999,
    icon: require('../../assets/1Aspirant.png'),
    couleur: '#8B4513',
    description: 'Début de votre parcours de pompier',
  },
  {
    id: 2,
    nom: 'Sapeur',
    nomComplet: 'Sapeur',
    pointsMin: 1000,
    pointsMax: 2499,
    icon: require('../../assets/2Sapeur.png'),
    couleur: '#CD853F',
    description: 'Premier grade de sapeur-pompier',
  },
  {
    id: 3,
    nom: 'Caporal',
    nomComplet: 'Caporal',
    pointsMin: 2500,
    pointsMax: 4999,
    icon: require('../../assets/3Caporal.png'),
    couleur: '#FFD700',
    description: "Chef d'équipe confirmé",
  },
  {
    id: 4,
    nom: 'Caporal-Chef',
    nomComplet: 'Caporal-Chef',
    pointsMin: 5000,
    pointsMax: 7999,
    icon: require('../../assets/4CaporalChef.png'),
    couleur: '#FFD700',
    description: "Chef d'équipe expérimenté",
  },
  {
    id: 5,
    nom: 'Sergent',
    nomComplet: 'Sergent',
    pointsMin: 8000,
    pointsMax: 11999,
    icon: require('../../assets/5Sergent.png'),
    couleur: '#FFA500',
    description: 'Sous-officier',
  },
  {
    id: 6,
    nom: 'Sergent-Chef',
    nomComplet: 'Sergent-Chef',
    pointsMin: 12000,
    pointsMax: 16999,
    icon: require('../../assets/6SergentChef.png'),
    couleur: '#FFA500',
    description: 'Sous-officier supérieur',
  },
  {
    id: 7,
    nom: 'Adjudant',
    nomComplet: 'Adjudant',
    pointsMin: 17000,
    pointsMax: 22999,
    icon: require('../../assets/7Adjudant.png'),
    couleur: '#FF8C00',
    description: 'Sous-officier supérieur confirmé',
  },
  {
    id: 8,
    nom: 'Adjudant-Chef',
    nomComplet: 'Adjudant-Chef',
    pointsMin: 23000,
    pointsMax: 29999,
    icon: require('../../assets/8AdjudantChef.png'),
    couleur: '#FF8C00',
    description: 'Plus haut grade de sous-officier',
  },
  {
    id: 9,
    nom: 'Lieutenant',
    nomComplet: 'Lieutenant',
    pointsMin: 30000,
    pointsMax: 39999,
    icon: require('../../assets/9Lieutenant.png'),
    couleur: '#DC143C',
    description: 'Officier',
  },
  {
    id: 10,
    nom: 'Commandant',
    nomComplet: 'Commandant',
    pointsMin: 40000,
    pointsMax: 54999,
    icon: require('../../assets/10Commandant.png'),
    couleur: '#DC143C',
    description: 'Officier supérieur',
  },
  {
    id: 11,
    nom: 'Capitaine',
    nomComplet: 'Capitaine',
    pointsMin: 55000,
    pointsMax: 74999,
    icon: require('../../assets/11Capitaine.png'),
    couleur: '#B22222',
    description: 'Officier supérieur confirmé',
  },
  {
    id: 12,
    nom: 'Lieutenant-Colonel',
    nomComplet: 'Lieutenant-Colonel',
    pointsMin: 75000,
    pointsMax: 99999,
    icon: require('../../assets/12LieutenantColonel.png'),
    couleur: '#8B0000',
    description: 'Officier supérieur de haut rang',
  },
  {
    id: 13,
    nom: 'Colonel',
    nomComplet: 'Colonel',
    pointsMin: 100000,
    pointsMax: 149999,
    icon: require('../../assets/13Colonel.png'),
    couleur: '#8B0000',
    description: "Officier supérieur d'état-major",
  },
  {
    id: 14,
    nom: 'Contrôleur Général',
    nomComplet: 'Contrôleur Général',
    pointsMin: 150000,
    pointsMax: 249999,
    icon: require('../../assets/14ControleurGeneral.png'),
    couleur: '#4B0082',
    description: 'Haut gradé',
  },
  {
    id: 15,
    nom: "Contrôleur Général d'État",
    nomComplet: "Contrôleur Général d'État",
    pointsMin: 250000,
    pointsMax: 999999,
    icon: require('../../assets/15ControleurGeneralEtat.png'),
    couleur: '#4B0082',
    description: 'Plus haut grade',
  },
];

export const getGradeByPoints = (points: number): Grade => {
  return (
    GRADES_POMPIERS.find(grade => points >= grade.pointsMin && points <= grade.pointsMax) ??
    GRADES_POMPIERS[0]
  );
};

export const getNextGrade = (currentPoints: number): Grade | null => {
  const currentGrade = getGradeByPoints(currentPoints);
  const nextIndex = GRADES_POMPIERS.findIndex(g => g.id === currentGrade.id) + 1;
  return nextIndex < GRADES_POMPIERS.length ? GRADES_POMPIERS[nextIndex] : null;
};

export const getProgressToNextGrade = (points: number): number => {
  const currentGrade = getGradeByPoints(points);
  const pointsInCurrentGrade = points - currentGrade.pointsMin;
  const pointsNeededForCurrentGrade = currentGrade.pointsMax - currentGrade.pointsMin + 1;
  return Math.min(100, Math.floor((pointsInCurrentGrade / pointsNeededForCurrentGrade) * 100));
};
