import { NavigatorScreenParams } from '@react-navigation/native';
// Types imported but used as unknown in navigation params from './app-types';
import type {
  Badge as _Badge,
  Challenge as _Challenge,
  Notification as _Notification,
} from './app-types';
import { StackScreenProps } from '@react-navigation/stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Revision: NavigatorScreenParams<RevisionStackParamList>;
  Progress: NavigatorScreenParams<ProgressStackParamList>;
  Ranking: NavigatorScreenParams<RankingStackParamList>;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  ProfileScreen: undefined;
  TrainingConfig: undefined;
  TrainingSession: {
    themes: number[];
    sousThemes: number[];
    settings: {
      questionType: 'QCU' | 'QCM' | 'MIXTE';
      timerEnabled: boolean;
      timePerQuestion: number;
      scoring: {
        correct: number;
        incorrect: number;
        noAnswer: number;
        partial: number;
      };
    };
  };
  SessionReport: {
    sessionId: number;
    stats: unknown;
    sessionParams?: unknown;
    isAbandoned?: boolean;
  };
  RewardAnimation: {
    rewards: Array<{
      type: 'badge' | 'challenge' | 'rank';
      id: number;
      name: string;
      description: string;
      icon?: string;
      color?: string;
      rarity?: 'common' | 'rare' | 'epic' | 'legendary';
      points?: number;
    }>;
    sessionStats: unknown;
  };
  ReviewQuestions: {
    questions: Array<{
      questionId: number;
      enonce: string;
      themeName: string;
      sousThemeName: string;
      userAnswer: string | null;
      correctAnswer: string;
      explication: string;
    }>;
  };
  Announcement: { id: string };
};

export type RevisionStackParamList = {
  RevisionScreen: undefined;
};

export type RankingStackParamList = {
  RankingScreen: undefined;
};

export type TrainingStackParamList = {
  TrainingList: undefined;
  TrainingConfig: undefined;
  TrainingSession: {
    themes: number[];
    sousThemes: number[];
    settings: {
      questionType: 'QCU' | 'QCM' | 'MIXTE';
      timerEnabled: boolean;
      timePerQuestion: number;
      scoring: {
        correct: number;
        incorrect: number;
        noAnswer: number;
        partial: number;
      };
    };
  };
  SessionReport: {
    sessionId: number;
    stats: unknown;
    sessionParams?: unknown;
    isAbandoned?: boolean;
  };
  RewardAnimation: {
    rewards: Array<{
      type: 'badge' | 'challenge' | 'rank';
      id: number;
      name: string;
      description: string;
      icon?: string;
      color?: string;
      rarity?: 'common' | 'rare' | 'epic' | 'legendary';
      points?: number;
    }>;
    sessionStats: unknown;
  };
  ReviewQuestions: {
    questions: Array<{
      questionId: number;
      enonce: string;
      themeName: string;
      sousThemeName: string;
      userAnswer: string | null;
      correctAnswer: string;
      explication: string;
    }>;
  };
  TrainingDetail: { id: string };
  TrainingProgress: { trainingId: string };
};

export type ProgressStackParamList = {
  ProgressScreen: undefined;
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  EditProfile: undefined;
  Settings: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = StackScreenProps<
  RootStackParamList,
  T
>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = StackScreenProps<
  AuthStackParamList,
  T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = BottomTabScreenProps<
  MainTabParamList,
  T
>;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> = StackScreenProps<
  HomeStackParamList,
  T
>;

export type TrainingStackScreenProps<T extends keyof TrainingStackParamList> = StackScreenProps<
  TrainingStackParamList,
  T
>;

export type RevisionStackScreenProps<T extends keyof RevisionStackParamList> = StackScreenProps<
  RevisionStackParamList,
  T
>;

export type ProgressStackScreenProps<T extends keyof ProgressStackParamList> = StackScreenProps<
  ProgressStackParamList,
  T
>;

export type RankingStackScreenProps<T extends keyof RankingStackParamList> = StackScreenProps<
  RankingStackParamList,
  T
>;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> = StackScreenProps<
  ProfileStackParamList,
  T
>;
