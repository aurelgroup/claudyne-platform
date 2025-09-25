/**
 * App.tsx - Application Claudyne
 * Plateforme éducative camerounaise révolutionnaire
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/screens/auth/AuthNavigator';
import ApiService from './src/services/apiService';
import { THEME_CONSTANTS, STORAGE_KEYS } from './src/constants/config';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);

      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);

      if (token) {
        const isValid = await ApiService.checkStoredToken();
        setIsAuthenticated(isValid);

        if (!isValid) {
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.USER_TOKEN,
            STORAGE_KEYS.USER_DATA,
          ]);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await ApiService.logout();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" backgroundColor={THEME_CONSTANTS.COLORS.PRIMARY} />

        <View style={styles.brandingContainer}>
          <Text style={styles.emoji}>🇨🇲</Text>
          <Text style={styles.title}>Claudyne</Text>
          <Text style={styles.subtitle}>Plateforme éducative camerounaise</Text>
          <Text style={styles.tagline}>La Symbiose Quantique de l'Excellence</Text>
        </View>

        <View style={styles.loadingSection}>
          <ActivityIndicator
            size="large"
            color={THEME_CONSTANTS.COLORS.ACCENT_1}
          />
          <Text style={styles.loadingText}>Initialisation...</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Hommage à Ma'a Meffo TCHANDJIO Claudine{'\n'}
            La force du savoir en héritage
          </Text>
          <Text style={styles.version}>v1.0.0</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={THEME_CONSTANTS.COLORS.PRIMARY} />

      {isAuthenticated ? (
        <AppNavigator onLogout={handleLogout} />
      ) : (
        <AuthNavigator onAuthSuccess={handleAuthSuccess} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_CONSTANTS.COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: THEME_CONSTANTS.COLORS.BACKGROUND,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME_CONSTANTS.SPACING.LG,
  },
  brandingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: THEME_CONSTANTS.SPACING.LG,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: THEME_CONSTANTS.COLORS.SURFACE,
    textAlign: 'center',
    marginBottom: THEME_CONSTANTS.SPACING.SM,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: THEME_CONSTANTS.SPACING.SM,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  loadingSection: {
    alignItems: 'center',
    marginBottom: THEME_CONSTANTS.SPACING.XXL,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    marginTop: THEME_CONSTANTS.SPACING.MD,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: THEME_CONSTANTS.SPACING.SM,
  },
  version: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
  },
});