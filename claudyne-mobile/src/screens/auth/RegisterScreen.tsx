/**
 * Écran d'inscription Claudyne
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
import { Picker } from '@react-native-picker/picker';

import { THEME_CONSTANTS } from '../../constants/config';
import ApiService from '../../services/apiService';
import type { RegisterData, UserRole, Grade } from '../../types';

interface Props {
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
}

export default function RegisterScreen({ onRegisterSuccess, onNavigateToLogin }: Props) {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'student',
    phoneNumber: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const grades: Grade[] = [
    'SIL', 'CP', 'CE1', 'CE2', 'CM1', 'CM2',
    '6ème', '5ème', '4ème', '3ème',
    '2nde', '1ère', 'Tle'
  ];

  const roles: { value: UserRole; label: string }[] = [
    { value: 'student', label: 'Étudiant' },
    { value: 'parent', label: 'Parent' },
    { value: 'teacher', label: 'Enseignant' }
  ];

  const handleInputChange = (field: keyof RegisterData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    // Validation nom et prénom
    if (!formData.firstName.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre prénom');
      return false;
    }

    if (!formData.lastName.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre nom');
      return false;
    }

    // Validation email
    if (!formData.email.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre email');
      return false;
    }

    if (!formData.email.includes('@')) {
      Alert.alert('Erreur', 'Veuillez saisir un email valide');
      return false;
    }

    // Validation mot de passe
    if (!formData.password.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un mot de passe');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    if (formData.password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return false;
    }

    // Validation classe pour les étudiants
    if (formData.role === 'student' && !formData.grade) {
      Alert.alert('Erreur', 'Veuillez sélectionner votre classe');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await ApiService.register(formData);

      if (response.success && response.data) {
        Alert.alert(
          'Inscription réussie',
          `Bienvenue dans la famille Claudyne, ${response.data.user.firstName} !`,
          [{ text: 'Continuer', onPress: onRegisterSuccess }]
        );
      } else {
        Alert.alert(
          'Erreur d\'inscription',
          response.error || 'Une erreur est survenue lors de l\'inscription'
        );
      }
    } catch (error) {
      console.error('Register error:', error);
      Alert.alert(
        'Erreur',
        'Impossible de créer le compte. Vérifiez votre connexion internet.'
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

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🇨🇲</Text>
          <Text style={styles.title}>Rejoindre Claudyne</Text>
          <Text style={styles.subtitle}>Créez votre compte et commencez votre parcours d'excellence</Text>
        </View>

        {/* Formulaire d'inscription */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Inscription</Text>

          {/* Prénom et Nom */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Prénom</Text>
              <TextInput
                style={styles.input}
                placeholder="Votre prénom"
                placeholderTextColor={THEME_CONSTANTS.COLORS.TEXT_DISABLED}
                value={formData.firstName}
                onChangeText={(text) => handleInputChange('firstName', text)}
                editable={!isLoading}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Nom</Text>
              <TextInput
                style={styles.input}
                placeholder="Votre nom"
                placeholderTextColor={THEME_CONSTANTS.COLORS.TEXT_DISABLED}
                value={formData.lastName}
                onChangeText={(text) => handleInputChange('lastName', text)}
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="votre.email@exemple.com"
              placeholderTextColor={THEME_CONSTANTS.COLORS.TEXT_DISABLED}
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {/* Téléphone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone (optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="+237 6XX XXX XXX"
              placeholderTextColor={THEME_CONSTANTS.COLORS.TEXT_DISABLED}
              value={formData.phoneNumber}
              onChangeText={(text) => handleInputChange('phoneNumber', text)}
              keyboardType="phone-pad"
              editable={!isLoading}
            />
          </View>

          {/* Rôle */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Je suis un(e)</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
                style={styles.picker}
                enabled={!isLoading}
              >
                {roles.map(role => (
                  <Picker.Item key={role.value} label={role.label} value={role.value} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Classe (pour les étudiants) */}
          {formData.role === 'student' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Classe</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.grade}
                  onValueChange={(value) => handleInputChange('grade', value)}
                  style={styles.picker}
                  enabled={!isLoading}
                >
                  <Picker.Item label="Sélectionnez votre classe" value="" />
                  {grades.map(grade => (
                    <Picker.Item key={grade} label={grade} value={grade} />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          {/* Mot de passe */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Minimum 6 caractères"
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

          {/* Confirmation mot de passe */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmer le mot de passe</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Répétez votre mot de passe"
                placeholderTextColor={THEME_CONSTANTS.COLORS.TEXT_DISABLED}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bouton d'inscription */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={THEME_CONSTANTS.COLORS.SURFACE} size="small" />
            ) : (
              <Text style={styles.registerButtonText}>Créer mon compte</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Connexion */}
        <View style={styles.loginSection}>
          <Text style={styles.loginText}>Déjà un compte ?</Text>
          <TouchableOpacity
            onPress={onNavigateToLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            En vous inscrivant, vous acceptez nos conditions d'utilisation{'\n'}
            et notre politique de confidentialité
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
    padding: THEME_CONSTANTS.SPACING.LG,
  },
  header: {
    alignItems: 'center',
    marginBottom: THEME_CONSTANTS.SPACING.XL,
    marginTop: THEME_CONSTANTS.SPACING.LG,
  },
  logo: {
    fontSize: 48,
    marginBottom: THEME_CONSTANTS.SPACING.MD,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME_CONSTANTS.COLORS.SURFACE,
    marginBottom: THEME_CONSTANTS.SPACING.SM,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    marginBottom: THEME_CONSTANTS.SPACING.MD,
  },
  halfWidth: {
    width: '48%',
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
  pickerContainer: {
    borderWidth: 2,
    borderColor: THEME_CONSTANTS.COLORS.DIVIDER,
    borderRadius: THEME_CONSTANTS.RADIUS.SM,
    backgroundColor: THEME_CONSTANTS.COLORS.SURFACE,
  },
  picker: {
    height: 50,
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
  registerButton: {
    backgroundColor: THEME_CONSTANTS.COLORS.PRIMARY,
    borderRadius: THEME_CONSTANTS.RADIUS.SM,
    padding: THEME_CONSTANTS.SPACING.MD,
    alignItems: 'center',
    marginTop: THEME_CONSTANTS.SPACING.MD,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: THEME_CONSTANTS.COLORS.SURFACE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginSection: {
    alignItems: 'center',
    marginBottom: THEME_CONSTANTS.SPACING.LG,
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    marginBottom: THEME_CONSTANTS.SPACING.SM,
  },
  loginLink: {
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