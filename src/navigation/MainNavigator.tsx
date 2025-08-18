import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MainTabParamList, HomeStackParamList, RevisionStackParamList, ProgressStackParamList, RankingStackParamList, TrainingStackParamList, ProfileStackParamList } from '../types/navigation';
import { HomeScreen } from '../screens/HomeScreen';
import { RevisionScreen } from '../screens/RevisionScreen';
import { RankingScreen } from '../screens/RankingScreen';
import { TrainingScreen } from '../screens/TrainingScreen';
import { TrainingConfigScreen } from '../screens/TrainingConfigScreen';
import { TrainingSessionScreen } from '../screens/TrainingSessionScreen';
import { SessionReportScreen } from '../screens/SessionReportScreen';
import { ReviewQuestionsScreen } from '../screens/ReviewQuestionsScreen';
import { RewardAnimationScreen } from '../screens/RewardAnimationScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { ProfileCompleteScreen } from '../screens/ProfileCompleteScreen';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import BubbleTabBar from '../components/BubbleTabBar';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const RevisionStack = createStackNavigator<RevisionStackParamList>();
const ProgressStack = createStackNavigator<ProgressStackParamList>();
const RankingStack = createStackNavigator<RankingStackParamList>();
const TrainingStack = createStackNavigator<TrainingStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

const HomeStackNavigator = () => {
  const { colors } = useTheme();
  
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <HomeStack.Screen 
        name="HomeScreen" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name="ProfileScreen" 
        component={ProfileCompleteScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name="TrainingConfig" 
        component={TrainingConfigScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name="TrainingSession" 
        component={TrainingSessionScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name="SessionReport" 
        component={SessionReportScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name="RewardAnimation" 
        component={RewardAnimationScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name="ReviewQuestions" 
        component={ReviewQuestionsScreen}
        options={{ headerShown: false }}
      />
    </HomeStack.Navigator>
  );
};

const RevisionStackNavigator = () => {
  const { colors } = useTheme();
  
  return (
    <RevisionStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <RevisionStack.Screen 
        name="RevisionScreen" 
        component={RevisionScreen}
        options={{ headerShown: false }}
      />
    </RevisionStack.Navigator>
  );
};

const RankingStackNavigator = () => {
  const { colors } = useTheme();
  
  return (
    <RankingStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <RankingStack.Screen 
        name="RankingScreen" 
        component={RankingScreen}
        options={{ headerShown: false }}
      />
    </RankingStack.Navigator>
  );
};

const TrainingStackNavigator = () => {
  const { colors } = useTheme();
  
  return (
    <TrainingStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <TrainingStack.Screen 
        name="TrainingList" 
        component={TrainingScreen}
        options={{ headerShown: false }}
      />
      <TrainingStack.Screen 
        name="TrainingConfig" 
        component={TrainingConfigScreen}
        options={{ headerShown: false }}
      />
      <TrainingStack.Screen 
        name="TrainingSession" 
        component={TrainingSessionScreen}
        options={{ headerShown: false }}
      />
      <TrainingStack.Screen 
        name="SessionReport" 
        component={SessionReportScreen}
        options={{ headerShown: false }}
      />
      <TrainingStack.Screen 
        name="RewardAnimation" 
        component={RewardAnimationScreen}
        options={{ headerShown: false }}
      />
      <TrainingStack.Screen 
        name="ReviewQuestions" 
        component={ReviewQuestionsScreen}
        options={{ headerShown: false }}
      />
    </TrainingStack.Navigator>
  );
};

const ProgressStackNavigator = () => {
  const { colors } = useTheme();
  
  return (
    <ProgressStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <ProgressStack.Screen 
        name="ProgressScreen" 
        component={ProgressScreen}
        options={{ headerShown: false }}
      />
    </ProgressStack.Navigator>
  );
};

const ProfileStackNavigator = () => {
  const { colors } = useTheme();
  
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <ProfileStack.Screen 
        name="ProfileScreen" 
        component={ProfileCompleteScreen}
        options={{ headerShown: false }}
      />
    </ProfileStack.Navigator>
  );
};

export const MainNavigator = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      tabBar={(props) => <BubbleTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator}
      />
      <Tab.Screen 
        name="Revision" 
        component={RevisionStackNavigator}
      />
      <Tab.Screen 
        name="Progress" 
        component={ProgressStackNavigator}
      />
      <Tab.Screen 
        name="Ranking" 
        component={RankingStackNavigator}
      />
    </Tab.Navigator>
  );
};