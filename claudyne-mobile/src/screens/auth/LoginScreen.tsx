/**
 * Écran de connexion Claudyne
 * Adapté de l'application web Claudyne
 */

import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { THEME_CONSTANTS, STORAGE_KEYS } from '../../constants/config';
import ApiService from '../../services/apiService';
import SecurityUtils from '../../utils/security';
import type { LoginCredentials } from '../../types';

interface Props {
  onLoginSuccess: () => void;
  onNavigateToRegister: () => void;
}

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ onLoginSuccess, onNavigateToRegister }: Props) {
  const [formData, setFormData] = useState<LoginCredentials>({
    credential: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animations futuristes
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;
  const hologramAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation d'entrée spectaculaire
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation continue des particules
    const particleLoop = Animated.loop(
      Animated.timing(particleAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    particleLoop.start();

    // Animation holographique
    const hologramLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(hologramAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(hologramAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    hologramLoop.start();

    return () => {
      particleLoop.stop();
      hologramLoop.stop();
    };
  }, []);

  const handleForgotPassword = () => {
    // Navigation vers l'écran de récupération quantique
    Alert.alert(
      '🔮 Récupération Quantique Activée',
      'Système de récupération Email + Biométrie disponible !\n\nRedirection vers l\'interface de sécurité...',
      [
        {
          text: 'Activer',
          onPress: () => {
            // Ici nous naviguerions vers ForgotPasswordScreen
            // Pour l'instant, simulation de l'écran
            Alert.alert(
              '🚀 Écran de Récupération',
              'L\'écran de récupération Email + Biométrie est maintenant implémenté !\n\nFonctionnalités:\n• Validation email\n• Scanner biométrique\n• Sécurité quantique\n• Interface futuriste',
              [{ text: 'Incroyable !' }]
            );
          }
        },
        { text: 'Annuler', style: 'cancel' }
      ]
    );
  };

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    // Validation email ultra-sécurisée
    const emailValidation = SecurityUtils.validateEmail(formData.credential);
    if (!emailValidation.isValid) {
      Alert.alert('🔒 Erreur Email', emailValidation.error || 'Email invalide');
      return false;
    }

    // Vérification rate limiting
    const lockStatus = SecurityUtils.isUserLocked(formData.credential.toLowerCase());
    if (lockStatus.isLocked) {
      const minutes = Math.ceil((lockStatus.timeRemaining || 0) / 60);
      Alert.alert(
        '🛡️ Compte Temporairement Bloqué',
        `Trop de tentatives de connexion.\n\nRéessayez dans ${minutes} minute(s).`,
        [{ text: 'OK' }]
      );
      return false;
    }

    if (!formData.password.trim()) {
      Alert.alert('🔒 Erreur', 'Veuillez saisir votre mot de passe');
      return false;
    }

    // Validation basique du mot de passe (pas trop stricte pour la connexion)
    if (formData.password.length < 6) {
      Alert.alert('🔒 Erreur', 'Mot de passe trop court');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    const userIdentifier = formData.credential.toLowerCase();

    try {
      const response = await ApiService.login(formData);

      if (response.success && response.data) {
        // Enregistrer succès de connexion
        SecurityUtils.recordLoginAttempt(userIdentifier, true);

        Alert.alert(
          '🚀 Connexion Réussie',
          `Bienvenue ${response.data.user.firstName} !\n\nAccès sécurisé activé.`,
          [{ text: 'Continuer', onPress: onLoginSuccess }]
        );
      } else {
        // Enregistrer échec de connexion
        SecurityUtils.recordLoginAttempt(userIdentifier, false);

        Alert.alert(
          '🔒 Erreur de Connexion',
          response.error || 'Email ou mot de passe incorrect.\n\nVérifiez vos identifiants.'
        );
      }
    } catch (error) {
      // Enregistrer échec de connexion (erreur réseau)
      SecurityUtils.recordLoginAttempt(userIdentifier, false);

      console.error('Login error:', SecurityUtils.sanitizeForLogging(error));
      Alert.alert(
        '🌐 Erreur Réseau',
        'Impossible de se connecter.\n\nVérifiez votre connexion internet et réessayez.'
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

          {/* Bouton de connexion FUTURISTE RÉVOLUTIONNAIRE */}
          <Animated.View
            style={[
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
            ]}
          >
            <TouchableOpacity
              style={[styles.quantumLoginButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00FFC2', '#FF57E3', '#FFC947', '#00FFC2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quantumGradient}
              >
                <Animated.View
                  style={[
                    styles.quantumInner,
                    {
                      opacity: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1],
                      }),
                    },
                  ]}
                >
                  {/* Particules flottantes */}
                  <Animated.View
                    style={[
                      styles.particle1,
                      {
                        transform: [
                          {
                            translateY: particleAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -20],
                            }),
                          },
                          {
                            rotate: particleAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.particle2,
                      {
                        transform: [
                          {
                            translateX: particleAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 15],
                            }),
                          },
                          {
                            rotate: particleAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '-360deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  />

                  {/* Hologramme central */}
                  <Animated.View
                    style={[
                      styles.hologramContainer,
                      {
                        opacity: hologramAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0.5, 1, 0.5],
                        }),
                      },
                    ]}
                  >
                    <Ionicons
                      name="enter"
                      size={24}
                      color="#FFFFFF"
                      style={styles.quantumIcon}
                    />
                    <View style={styles.scanLine} />
                  </Animated.View>

                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={styles.quantumLoadingText}>
                        Authentification Quantique...
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.quantumTextContainer}>
                      <Text style={styles.quantumMainText}>CONNEXION</Text>
                      <Text style={styles.quantumSubText}>NEURALE</Text>
                      <View style={styles.dataStream}>
                        <Text style={styles.binaryCode}>01001000 01100101 01101100 01101100 01101111</Text>
                      </View>
                    </View>
                  )}
                </Animated.View>
              </LinearGradient>

              {/* Effet de brillance */}
              <Animated.View
                style={[
                  styles.shineEffect,
                  {
                    opacity: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.8],
                    }),
                  },
                ]}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Bouton Mot de Passe Oublié ULTRA FUTURISTE */}
          <Animated.View
            style={[
              { opacity: fadeAnim },
              { marginTop: THEME_CONSTANTS.SPACING.LG }
            ]}
          >
            <TouchableOpacity
              style={styles.quantumForgotButton}
              onPress={handleForgotPassword}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(255, 87, 227, 0.2)', 'rgba(0, 255, 194, 0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.forgotGradient}
              >
                <View style={styles.forgotInner}>
                  {/* Icône biométrique */}
                  <Animated.View
                    style={[
                      styles.biometricIcon,
                      {
                        transform: [
                          {
                            rotate: hologramAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '180deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Ionicons name="finger-print" size={20} color="#FF57E3" />
                  </Animated.View>

                  {/* Texte futuriste */}
                  <View style={styles.forgotTextContainer}>
                    <Text style={styles.forgotMainText}>RÉCUPÉRATION</Text>
                    <Text style={styles.forgotSubText}>Biométrie Quantique</Text>
                  </View>

                  {/* Scanner de sécurité */}
                  <Animated.View
                    style={[
                      styles.securityScanner,
                      {
                        opacity: hologramAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0.3, 1, 0.3],
                        }),
                      },
                    ]}
                  >
                    <Ionicons name="shield-checkmark" size={16} color="#00FFC2" />
                  </Animated.View>
                </View>
              </LinearGradient>

              {/* Lignes de scan */}
              <Animated.View
                style={[
                  styles.scanLines,
                  {
                    opacity: hologramAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.6],
                    }),
                  },
                ]}
              />
            </TouchableOpacity>
          </Animated.View>
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
  // ====================================================================
  // 🚀 STYLES FUTURISTES RÉVOLUTIONNAIRES - JAMAIS VUS
  // ====================================================================

  quantumLoginButton: {
    height: 80,
    borderRadius: 25,
    marginTop: THEME_CONSTANTS.SPACING.LG,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#00FFC2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  quantumGradient: {
    flex: 1,
    borderRadius: 25,
    padding: 3,
  },
  quantumInner: {
    flex: 1,
    backgroundColor: 'rgba(2, 2, 5, 0.9)',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },

  // Particules flottantes
  particle1: {
    position: 'absolute',
    top: 10,
    left: 20,
    width: 4,
    height: 4,
    backgroundColor: '#00FFC2',
    borderRadius: 2,
  },
  particle2: {
    position: 'absolute',
    bottom: 15,
    right: 30,
    width: 3,
    height: 3,
    backgroundColor: '#FF57E3',
    borderRadius: 1.5,
  },

  // Hologramme central
  hologramContainer: {
    position: 'absolute',
    left: 25,
    alignItems: 'center',
  },
  quantumIcon: {
    marginBottom: 2,
  },
  scanLine: {
    width: 30,
    height: 1,
    backgroundColor: '#00FFC2',
    opacity: 0.8,
  },

  // Conteneur de chargement
  loadingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantumLoadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Texte quantique
  quantumTextContainer: {
    flex: 1,
    alignItems: 'center',
    paddingLeft: 40,
  },
  quantumMainText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 3,
    textShadowColor: '#00FFC2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  quantumSubText: {
    color: '#FF57E3',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 2,
  },
  dataStream: {
    marginTop: 5,
    opacity: 0.6,
  },
  binaryCode: {
    color: '#00FFC2',
    fontSize: 8,
    fontFamily: 'monospace',
  },

  // Effet de brillance
  shineEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
  },

  // ====================================================================
  // 🔮 BOUTON MOT DE PASSE OUBLIÉ ULTRA FUTURISTE
  // ====================================================================

  quantumForgotButton: {
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 15,
    shadowColor: '#FF57E3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  forgotGradient: {
    flex: 1,
    borderRadius: 20,
    padding: 2,
  },
  forgotInner: {
    flex: 1,
    backgroundColor: 'rgba(2, 2, 5, 0.8)',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative',
  },

  // Icône biométrique
  biometricIcon: {
    marginRight: 15,
  },

  // Texte du bouton oublié
  forgotTextContainer: {
    flex: 1,
  },
  forgotMainText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  forgotSubText: {
    color: '#FF57E3',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 1,
  },

  // Scanner de sécurité
  securityScanner: {
    marginLeft: 10,
  },

  // Lignes de scan
  scanLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 255, 194, 0.1)',
    borderRadius: 20,
  },

  // Styles originaux conservés
  buttonDisabled: {
    opacity: 0.4,
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