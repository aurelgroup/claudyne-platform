/**
 * Écran de connexion Claudyne
 * Adapté de l'application web Claudyne
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { THEME_CONSTANTS, STORAGE_KEYS } from '../../constants/config';
import ApiService from '../../services/apiService';
import type { LoginCredentials } from '../../types';

interface Props {
  onLoginSuccess: () => void;
  onNavigateToRegister: () => void;
}

export default function LoginScreen({ onLoginSuccess, onNavigateToRegister }: Props) {
  const [formData, setFormData] = useState<LoginCredentials>({
    credential: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.credential.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre email');
      return false;
    }

    if (!formData.credential.includes('@')) {
      Alert.alert('Erreur', 'Veuillez saisir un email valide');
      return false;
    }

    if (!formData.password.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre mot de passe');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await ApiService.login(formData);

      if (response.success && response.data) {
        Alert.alert(
          'Connexion réussie',
          `Bienvenue ${response.data.user.firstName} !`,
          [{ text: 'Continuer', onPress: onLoginSuccess }]
        );
      } else {
        Alert.alert(
          'Erreur de connexion',
          response.error || 'Email ou mot de passe incorrect'
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Erreur',
        'Impossible de se connecter. Vérifiez votre connexion internet.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" backgroundColor={THEME_CONSTANTS.COLORS.PRIMARY} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header avec logo Claudyne */}
        <View style={styles.header}>
          <Text style={styles.logo}>🇨🇲</Text>
          <Text style={styles.title}>Claudyne</Text>
          <Text style={styles.subtitle}>Plateforme éducative camerounaise</Text>
          <Text style={styles.tagline}>La Symbiose Quantique de l'Excellence</Text>
        </View>

        {/* Formulaire de connexion */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Connexion</Text>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="votre.email@exemple.com"
              placeholderTextColor={THEME_CONSTANTS.COLORS.TEXT_DISABLED}
              value={formData.credential}
              onChangeText={(text) => handleInputChange('credential', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {/* Mot de passe */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Votre mot de passe"
                placeholderTextColor={THEME_CONSTANTS.COLORS.TEXT_DISABLED}
                value={formData.password}
                onChangeText={(text) => handleInputChange('password', text)}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bouton de connexion */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={THEME_CONSTANTS.COLORS.SURFACE} size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          {/* Lien mot de passe oublié */}
          <TouchableOpacity style={styles.forgotPassword} disabled={isLoading}>
            <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </View>

        {/* Inscription */}
        <View style={styles.registerSection}>
          <Text style={styles.registerText}>Pas encore de compte ?</Text>
          <TouchableOpacity
            onPress={onNavigateToRegister}
            disabled={isLoading}
          >
            <Text style={styles.registerLink}>Créer un compte</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Hommage à Ma'a Meffo TCHANDJIO Claudine{'\n'}
            La force du savoir en héritage
          </Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_CONSTANTS.COLORS.PRIMARY,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: THEME_CONSTANTS.SPACING.LG,
  },
  header: {
    alignItems: 'center',
    marginBottom: THEME_CONSTANTS.SPACING.XXL,
  },
  logo: {
    fontSize: 64,
    marginBottom: THEME_CONSTANTS.SPACING.MD,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: THEME_CONSTANTS.COLORS.SURFACE,
    marginBottom: THEME_CONSTANTS.SPACING.SM,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: THEME_CONSTANTS.SPACING.SM,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  formContainer: {
    backgroundColor: THEME_CONSTANTS.COLORS.SURFACE,
    borderRadius: THEME_CONSTANTS.RADIUS.LG,
    padding: THEME_CONSTANTS.SPACING.LG,
    marginBottom: THEME_CONSTANTS.SPACING.LG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME_CONSTANTS.COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: THEME_CONSTANTS.SPACING.LG,
  },
  inputGroup: {
    marginBottom: THEME_CONSTANTS.SPACING.MD,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginBottom: THEME_CONSTANTS.SPACING.SM,
  },
  input: {
    borderWidth: 2,
    borderColor: THEME_CONSTANTS.COLORS.DIVIDER,
    borderRadius: THEME_CONSTANTS.RADIUS.SM,
    padding: THEME_CONSTANTS.SPACING.MD,
    fontSize: 16,
    color: THEME_CONSTANTS.COLORS.TEXT_PRIMARY,
    backgroundColor: THEME_CONSTANTS.COLORS.SURFACE,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: THEME_CONSTANTS.SPACING.MD,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  eyeIcon: {
    fontSize: 20,
  },
  loginButton: {
    backgroundColor: THEME_CONSTANTS.COLORS.PRIMARY,
    borderRadius: THEME_CONSTANTS.RADIUS.SM,
    padding: THEME_CONSTANTS.SPACING.MD,
    alignItems: 'center',
    marginTop: THEME_CONSTANTS.SPACING.MD,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: THEME_CONSTANTS.COLORS.SURFACE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: THEME_CONSTANTS.SPACING.MD,
  },
  forgotPasswordText: {
    color: THEME_CONSTANTS.COLORS.PRIMARY,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  registerSection: {
    alignItems: 'center',
    marginBottom: THEME_CONSTANTS.SPACING.LG,
  },
  registerText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    marginBottom: THEME_CONSTANTS.SPACING.SM,
  },
  registerLink: {
    color: THEME_CONSTANTS.COLORS.CAMEROON_YELLOW,
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    marginTop: THEME_CONSTANTS.SPACING.LG,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});