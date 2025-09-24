/**
 * Navigateur d'authentification pour Claudyne
 * Gère les écrans de connexion et d'inscription
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';

interface Props {
  onAuthSuccess: () => void;
}

type AuthScreen = 'login' | 'register';

export default function AuthNavigator({ onAuthSuccess }: Props) {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');

  const navigateToLogin = () => setCurrentScreen('login');
  const navigateToRegister = () => setCurrentScreen('register');

  return (
    <View style={styles.container}>
      {currentScreen === 'login' ? (
        <LoginScreen
          onLoginSuccess={onAuthSuccess}
          onNavigateToRegister={navigateToRegister}
        />
      ) : (
        <RegisterScreen
          onRegisterSuccess={onAuthSuccess}
          onNavigateToLogin={navigateToLogin}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});