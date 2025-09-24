/**
 * Dashboard principal pour Claudyne
 * Adapté de l'interface étudiant web Claudyne
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { THEME_CONSTANTS } from '../constants/config';
import DataService from '../services/dataService';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import type { User, Battle } from '../types';

interface DashboardStats {
  user: User | null;
  family: any;
  activeLesson: any;
  activeBattles: Battle[];
  recentProgress: any[];
  claudinePoints: number;
  streak: number;
}

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [stats, setStats] = useState<DashboardStats>({
    user: null,
    family: null,
    activeLesson: null,
    activeBattles: [],
    recentProgress: [],
    claudinePoints: 0, // Sera chargé depuis l'API
    streak: 0, // Sera chargé depuis l'API
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setIsLoading(!refreshing); // Ne pas montrer loading si c'est un refresh

      // Utiliser le DataService optimisé pour charger toutes les données
      const dashboardData = await DataService.loadDashboardData(refreshing);

      setStats(prev => ({
        ...prev,
        user: dashboardData.user,
        family: null, // Sera ajouté plus tard
        claudinePoints: dashboardData.stats.points || 0,
        streak: dashboardData.stats.currentStreak || 0,
        recentProgress: dashboardData.courses.slice(0, 3),
        activeLesson: dashboardData.courses[0] || null,
        activeBattles: [], // Sera implémenté plus tard
      }));

      // Vérifier les mises à jour d'application
      if (!dashboardData.isFromCache) {
        const versionCheck = await DataService.checkAppVersion();
        if (versionCheck.needsUpdate && versionCheck.updateMessage) {
          Alert.alert(
            'Mise à jour disponible',
            versionCheck.updateMessage,
            [
              { text: 'Plus tard', style: 'cancel' },
              {
                text: 'Télécharger',
                onPress: () => {
                  if (versionCheck.downloadUrl) {
                    console.log('🔗 Ouverture lien téléchargement:', versionCheck.downloadUrl);
                    // Linking.openURL(versionCheck.downloadUrl);
                  }
                }
              }
            ]
          );
        }
      }

      console.log('✅ Dashboard chargé avec succès');

    } catch (error) {
      console.error('❌ Erreur lors du chargement du dashboard:', error);
      Alert.alert(
        'Erreur de connexion',
        'Impossible de charger les données. Les données en cache seront utilisées si disponibles.',
        [
          { text: 'Réessayer', onPress: loadDashboardData },
          { text: 'OK', style: 'cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={THEME_CONSTANTS.COLORS.PRIMARY} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec salutation */}
        <View style={styles.header}>
          <View style={styles.greetingSection}>
            <Text style={styles.flag}>🇨🇲</Text>
            <Text style={styles.greeting}>
              {getGreeting()}, {stats.user?.firstName || 'Champion'} !
            </Text>
            <Text style={styles.subtitle}>
              Prêt pour une nouvelle journée d'excellence ?
            </Text>
          </View>
        </View>

        {/* Stats principales */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statNumber}>{stats.claudinePoints}</Text>
            <Text style={styles.statLabel}>Points Claudine</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statNumber}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Jours consécutifs</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⚔️</Text>
            <Text style={styles.statNumber}>{stats.activeBattles.length || 3}</Text>
            <Text style={styles.statLabel}>Battles actives</Text>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>

          <View style={styles.actionGrid}>
            <TouchableOpacity style={[styles.actionCard, styles.lessonAction]}>
              <Text style={styles.actionEmoji}>📚</Text>
              <Text style={styles.actionText}>Nouvelle Leçon</Text>
              <Text style={styles.actionSubtitle}>Continuer l'apprentissage</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, styles.battleAction]}>
              <Text style={styles.actionEmoji}>⚔️</Text>
              <Text style={styles.actionText}>Battle Royale</Text>
              <Text style={styles.actionSubtitle}>Défier vos camarades</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, styles.mentorAction]}>
              <Text style={styles.actionEmoji}>🤖</Text>
              <Text style={styles.actionText}>Mentor IA</Text>
              <Text style={styles.actionSubtitle}>Poser une question</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, styles.progressAction]}>
              <Text style={styles.actionEmoji}>📊</Text>
              <Text style={styles.actionText}>Mes Progrès</Text>
              <Text style={styles.actionSubtitle}>Voir l'évolution</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Citation motivationnelle */}
        <View style={styles.quoteSection}>
          <Text style={styles.quote}>
            "L'excellence n'est pas un acte, mais une habitude"
          </Text>
          <Text style={styles.quoteAuthor}>- Aristote</Text>
          <Text style={styles.quoteDedication}>
            Hommage à Ma'a Meffo TCHANDJIO Claudine{'\n'}
            La force du savoir en héritage
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_CONSTANTS.COLORS.BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: THEME_CONSTANTS.SPACING.XXL,
  },
  header: {
    backgroundColor: THEME_CONSTANTS.COLORS.PRIMARY,
    padding: THEME_CONSTANTS.SPACING.LG,
    paddingTop: 40,
    alignItems: 'center',
    borderBottomLeftRadius: THEME_CONSTANTS.RADIUS.LG,
    borderBottomRightRadius: THEME_CONSTANTS.RADIUS.LG,
  },
  greetingSection: {
    alignItems: 'center',
  },
  flag: {
    fontSize: 32,
    marginBottom: THEME_CONSTANTS.SPACING.SM,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME_CONSTANTS.COLORS.SURFACE,
    textAlign: 'center',
    marginBottom: THEME_CONSTANTS.SPACING.SM,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: THEME_CONSTANTS.SPACING.LG,
    paddingVertical: THEME_CONSTANTS.SPACING.LG,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: THEME_CONSTANTS.COLORS.SURFACE,
    borderRadius: THEME_CONSTANTS.RADIUS.MD,
    padding: THEME_CONSTANTS.SPACING.MD,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: THEME_CONSTANTS.SPACING.XS,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: THEME_CONSTANTS.SPACING.SM,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME_CONSTANTS.COLORS.PRIMARY,
  },
  statLabel: {
    fontSize: 12,
    color: THEME_CONSTANTS.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: THEME_CONSTANTS.SPACING.XS,
  },
  quickActions: {
    padding: THEME_CONSTANTS.SPACING.LG,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginBottom: THEME_CONSTANTS.SPACING.MD,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 48) / 2 - 8,
    backgroundColor: THEME_CONSTANTS.COLORS.SURFACE,
    borderRadius: THEME_CONSTANTS.RADIUS.MD,
    padding: THEME_CONSTANTS.SPACING.MD,
    marginBottom: THEME_CONSTANTS.SPACING.MD,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lessonAction: {
    borderLeftWidth: 4,
    borderLeftColor: THEME_CONSTANTS.COLORS.ACCENT,
  },
  battleAction: {
    borderLeftWidth: 4,
    borderLeftColor: THEME_CONSTANTS.COLORS.SECONDARY,
  },
  mentorAction: {
    borderLeftWidth: 4,
    borderLeftColor: THEME_CONSTANTS.COLORS.INFO,
  },
  progressAction: {
    borderLeftWidth: 4,
    borderLeftColor: THEME_CONSTANTS.COLORS.SUCCESS,
  },
  actionEmoji: {
    fontSize: 32,
    marginBottom: THEME_CONSTANTS.SPACING.SM,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_CONSTANTS.COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: THEME_CONSTANTS.SPACING.XS,
  },
  actionSubtitle: {
    fontSize: 12,
    color: THEME_CONSTANTS.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  quoteSection: {
    backgroundColor: THEME_CONSTANTS.COLORS.PRIMARY,
    margin: THEME_CONSTANTS.SPACING.LG,
    borderRadius: THEME_CONSTANTS.RADIUS.MD,
    padding: THEME_CONSTANTS.SPACING.LG,
    alignItems: 'center',
  },
  quote: {
    fontSize: 18,
    fontStyle: 'italic',
    color: THEME_CONSTANTS.COLORS.SURFACE,
    textAlign: 'center',
    marginBottom: THEME_CONSTANTS.SPACING.SM,
  },
  quoteAuthor: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginBottom: THEME_CONSTANTS.SPACING.MD,
  },
  quoteDedication: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
  },
});