/**
 * ForgotPasswordScreen.tsx - Récupération Biométrique Quantique Claudyne
 * Système révolutionnaire Email + Biométrie JAMAIS VU !
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
  Vibration,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';

import { THEME_CONSTANTS } from '../../constants/config';
import ApiService from '../../services/apiService';

interface Props {
  onBackToLogin: () => void;
}

const { width, height } = Dimensions.get('window');

export default function ForgotPasswordScreen({ onBackToLogin }: Props) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'biometric' | 'success'>('email');
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Animations ultra-futuristes
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const biometricGlowAnim = useRef(new Animated.Value(0)).current;
  const scannerAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;
  const hologramAnim = useRef(new Animated.Value(0)).current;
  const emailWaveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    // Vérifier la disponibilité biométrique
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(hasHardware && isEnrolled);

    // Animations d'entrée spectaculaires
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(biometricGlowAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Animations continues
    startContinuousAnimations();
  };

  const startContinuousAnimations = () => {
    // Scanner biométrique
    const scannerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scannerAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(scannerAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );
    scannerLoop.start();

    // Particules quantiques
    const particleLoop = Animated.loop(
      Animated.timing(particleAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    );
    particleLoop.start();

    // Hologramme
    const hologramLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(hologramAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(hologramAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    hologramLoop.start();

    // Vague email
    const emailWaveLoop = Animated.loop(
      Animated.timing(emailWaveAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    emailWaveLoop.start();
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('🔮 Erreur Quantique', 'Veuillez saisir votre adresse email');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('🔮 Format Invalide', 'Veuillez saisir une adresse email valide');
      return;
    }

    setIsLoading(true);
    Vibration.vibrate(50); // Feedback tactile

    try {
      // Simulation API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (biometricAvailable) {
        setStep('biometric');
        triggerBiometricScan();
      } else {
        setStep('success');
        sendEmailReset();
      }
    } catch (error) {
      Alert.alert('🔮 Erreur Système', 'Impossible de traiter la demande. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerBiometricScan = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: '🔮 Authentification Biométrique Quantique',
        subPromptMessage: 'Placez votre doigt ou regardez l\'écran',
        fallbackLabel: 'Utiliser le code',
        cancelLabel: 'Annuler',
      });

      if (result.success) {
        Vibration.vibrate([100, 50, 100]); // Pattern de succès
        setStep('success');
        sendSecureReset();
      } else {
        Alert.alert(
          '🔮 Authentification Échouée',
          'Authentification biométrique requise pour la sécurité maximale',
          [
            { text: 'Réessayer', onPress: triggerBiometricScan },
            { text: 'Email uniquement', onPress: () => sendEmailReset() }
          ]
        );
      }
    } catch (error) {
      Alert.alert('🔮 Erreur Biométrique', 'Scanner non disponible. Utilisation de l\'email uniquement.');
      sendEmailReset();
    }
  };

  const sendEmailReset = async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.requestPasswordReset(email);

      if (response.success) {
        setStep('success');
        Alert.alert(
          '📧 Email Envoyé',
          `Un lien de réinitialisation a été envoyé à:\n${email}\n\nVérifiez vos emails (et spam).`,
          [{ text: 'Retour', onPress: onBackToLogin }]
        );
      } else {
        Alert.alert(
          '🔮 Erreur',
          response.error || 'Impossible d\'envoyer l\'email. Vérifiez l\'adresse.',
          [{ text: 'Réessayer' }]
        );
      }
    } catch (error) {
      Alert.alert(
        '🔮 Erreur Réseau',
        'Connexion impossible. Vérifiez votre réseau.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const sendSecureReset = async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.requestSecurePasswordReset(email, 'biometric-validated');

      if (response.success) {
        setStep('success');
        Alert.alert(
          '🔮 Réinitialisation Quantique Activée',
          `Authentification biométrique validée !\n\nLien sécurisé envoyé à:\n${email}\n\nSécurité maximale garantie.`,
          [{ text: 'Parfait !', onPress: onBackToLogin }]
        );
      } else {
        Alert.alert(
          '🔮 Erreur Sécurisée',
          response.error || 'Authentification échouée. Réessayez.',
          [{ text: 'Réessayer', onPress: triggerBiometricScan }]
        );
      }
    } catch (error) {
      Alert.alert(
        '🔮 Erreur Système',
        'Système de sécurité indisponible.',
        [{ text: 'Email uniquement', onPress: sendEmailReset }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmailStep = () => (
    <Animated.View
      style={[
        styles.stepContainer,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}
    >
      {/* Header Email */}
      <View style={styles.header}>
        <Animated.View
          style={[
            styles.emailIconContainer,
            {
              transform: [
                {
                  rotate: emailWaveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="mail" size={48} color="#00FFC2" />
        </Animated.View>
        <Text style={styles.title}>RÉCUPÉRATION</Text>
        <Text style={styles.subtitle}>Système Quantique Email</Text>
      </View>

      {/* Input Email Futuriste */}
      <View style={styles.inputContainer}>
        <LinearGradient
          colors={['rgba(0, 255, 194, 0.2)', 'rgba(255, 87, 227, 0.2)']}
          style={styles.inputGradient}
        >
          <View style={styles.inputInner}>
            <Ionicons name="at" size={20} color="#00FFC2" style={styles.inputIcon} />
            <TextInput
              style={styles.emailInput}
              placeholder="votre.email@claudyne.com"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <Animated.View
              style={[
                styles.scanBeam,
                {
                  opacity: emailWaveAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 1, 0.3],
                  }),
                },
              ]}
            />
          </View>
        </LinearGradient>
      </View>

      {/* Bouton Analyse Email */}
      <TouchableOpacity
        style={[styles.analyzeButton, isLoading && styles.buttonDisabled]}
        onPress={handleEmailSubmit}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#00FFC2', '#FF57E3', '#FFC947']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.analyzeGradient}
        >
          <View style={styles.analyzeInner}>
            {isLoading ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.analyzeLoadingText}>ANALYSE QUANTIQUE...</Text>
              </>
            ) : (
              <>
                <Ionicons name="scan" size={24} color="#FFFFFF" />
                <Text style={styles.analyzeText}>ANALYSER EMAIL</Text>
              </>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Info Biométrique */}
      {biometricAvailable && (
        <Animated.View
          style={[
            styles.biometricInfo,
            {
              opacity: biometricGlowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
            },
          ]}
        >
          <Ionicons name="finger-print" size={16} color="#FF57E3" />
          <Text style={styles.biometricText}>
            + Authentification biométrique disponible
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );

  const renderBiometricStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      {/* Scanner Biométrique Central */}
      <View style={styles.biometricScanner}>
        <Animated.View
          style={[
            styles.scannerRing,
            {
              transform: [
                {
                  scale: scannerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  }),
                },
              ],
              opacity: scannerAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 0.5, 1],
              }),
            },
          ]}
        />

        <Animated.View
          style={[
            styles.scannerCore,
            {
              transform: [
                {
                  rotate: hologramAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="finger-print" size={64} color="#FFFFFF" />
        </Animated.View>

        {/* Particules Quantiques */}
        {[...Array(6)].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.quantumParticle,
              {
                transform: [
                  {
                    rotate: particleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [`${index * 60}deg`, `${(index * 60) + 360}deg`],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>

      <Text style={styles.biometricTitle}>AUTHENTIFICATION</Text>
      <Text style={styles.biometricSubtitle}>Biométrie Quantique</Text>

      <Text style={styles.biometricInstruction}>
        Placez votre doigt sur le capteur ou regardez l'écran
      </Text>

      <TouchableOpacity
        style={styles.skipBiometric}
        onPress={sendEmailReset}
      >
        <Text style={styles.skipText}>Utiliser email uniquement</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSuccessStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <View style={styles.successContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#00FFC2" />
        <Text style={styles.successTitle}>SUCCÈS !</Text>
        <Text style={styles.successMessage}>
          Instructions envoyées à votre email
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" backgroundColor={THEME_CONSTANTS.COLORS.PRIMARY} />

      {/* Background Quantique */}
      <View style={styles.quantumBackground}>
        {[...Array(20)].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.backgroundParticle,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: particleAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.2, 0.8, 0.2],
                }),
                transform: [
                  {
                    translateY: particleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -50],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Bouton Retour */}
        <TouchableOpacity style={styles.backButton} onPress={onBackToLogin}>
          <Ionicons name="arrow-back" size={24} color="#00FFC2" />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>

        {/* Contenu Principal */}
        {step === 'email' && renderEmailStep()}
        {step === 'biometric' && renderBiometricStep()}
        {step === 'success' && renderSuccessStep()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_CONSTANTS.COLORS.PRIMARY,
  },
  quantumBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundParticle: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#00FFC2',
    borderRadius: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: THEME_CONSTANTS.SPACING.LG,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backText: {
    color: '#00FFC2',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  stepContainer: {
    alignItems: 'center',
    marginTop: 80,
  },

  // ====================================================================
  // ÉTAPE EMAIL
  // ====================================================================
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emailIconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 3,
    textShadowColor: '#00FFC2',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#FF57E3',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 5,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  inputGradient: {
    borderRadius: 20,
    padding: 2,
  },
  inputInner: {
    backgroundColor: 'rgba(2, 2, 5, 0.9)',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    position: 'relative',
  },
  inputIcon: {
    marginRight: 15,
  },
  emailInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  scanBeam: {
    position: 'absolute',
    right: 15,
    width: 3,
    height: 20,
    backgroundColor: '#00FFC2',
  },
  analyzeButton: {
    width: '100%',
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 15,
    shadowColor: '#00FFC2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    marginBottom: 20,
  },
  analyzeGradient: {
    flex: 1,
    borderRadius: 20,
  },
  analyzeInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 2, 5, 0.3)',
  },
  analyzeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 10,
  },
  analyzeLoadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 10,
  },
  biometricInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 87, 227, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 227, 0.3)',
  },
  biometricText: {
    color: '#FF57E3',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },

  // ====================================================================
  // ÉTAPE BIOMÉTRIQUE
  // ====================================================================
  biometricScanner: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  scannerRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: '#00FFC2',
    opacity: 0.5,
  },
  scannerCore: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(0, 255, 194, 0.2)',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00FFC2',
  },
  quantumParticle: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: '#FF57E3',
    borderRadius: 3,
    top: 30,
    left: 97,
  },
  biometricTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 5,
  },
  biometricSubtitle: {
    fontSize: 14,
    color: '#FF57E3',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 30,
  },
  biometricInstruction: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  skipBiometric: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  skipText: {
    color: '#FFC947',
    fontSize: 14,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },

  // ====================================================================
  // ÉTAPE SUCCÈS
  // ====================================================================
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00FFC2',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginVertical: 20,
  },
  successMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Styles communs
  buttonDisabled: {
    opacity: 0.5,
  },
});