/**
 * Navigation principale pour Claudyne
 * Architecture React Navigation robuste
 */

import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Types
import type { RootStackParamList, MainTabParamList } from '../types';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import LessonsScreen from '../screens/LessonsScreen';
import BattlesScreen from '../screens/BattlesScreen';
import MentorScreen from '../screens/MentorScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Constants
import { THEME_CONSTANTS, SCREEN_NAMES } from '../constants/config';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ============================================================================
// TAB NAVIGATOR
// ============================================================================
interface MainTabNavigatorProps {
  onLogout: () => void;
}

function MainTabNavigator({ onLogout }: MainTabNavigatorProps) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: THEME_CONSTANTS.COLORS.PRIMARY,
        tabBarInactiveTintColor: THEME_CONSTANTS.COLORS.TEXT_SECONDARY,
        tabBarStyle: {
          backgroundColor: THEME_CONSTANTS.COLORS.SURFACE,
          borderTopWidth: 1,
          borderTopColor: THEME_CONSTANTS.COLORS.DIVIDER,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name={SCREEN_NAMES.DASHBOARD}
        component={DashboardScreen}
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.LESSONS}
        component={LessonsScreen}
        options={{
          title: 'Leçons',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.BATTLES}
        component={BattlesScreen}
        options={{
          title: 'Battles',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flash" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.MENTOR}
        component={MentorScreen}
        options={{
          title: 'Mentor IA',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.PROFILE}
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      >
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ============================================================================
// ROOT NAVIGATOR
// ============================================================================
interface AppNavigatorProps {
  onLogout: () => void;
}

export default function AppNavigator({ onLogout }: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor={THEME_CONSTANTS.COLORS.PRIMARY} />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: THEME_CONSTANTS.COLORS.BACKGROUND },
        }}
      >
        <Stack.Screen name="Main">
          {(props) => <MainTabNavigator {...props} onLogout={onLogout} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}