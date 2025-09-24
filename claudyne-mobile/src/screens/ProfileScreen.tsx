/**
 * Écran Profil - Gestion du profil utilisateur
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { THEME_CONSTANTS } from '../constants/config';

const achievements = [
  { id: 1, title: 'Premier Battle', description: 'Gagner votre première battle', emoji: '⚔️', earned: true },
  { id: 2, title: 'Étudiant Assidu', description: '7 jours consécutifs d\'étude', emoji: '📚', earned: true },
  { id: 3, title: 'Maître des Maths', description: 'Terminer tous les modules de maths', emoji: '🧮', earned: false },
  { id: 4, title: 'Champion Camerounais', description: 'Gagner un tournoi national', emoji: '🇨🇲', earned: false },
];

const stats = [
  { label: 'Niveau actuel', value: '🥈 Argent', color: THEME_CONSTANTS.COLORS.INFO },
  { label: 'Points totaux', value: '2,540 pts', color: THEME_CONSTANTS.COLORS.PRIMARY },
  { label: 'Classement', value: '#47 / 1,250', color: THEME_CONSTANTS.COLORS.SUCCESS },
  { label: 'Série actuelle', value: '12 jours', color: THEME_CONSTANTS.COLORS.WARNING },
];

const menuItems = [
  { id: 1, title: 'Mes paramètres', icon: '⚙️', subtitle: 'Notifications et préférences' },
  { id: 2, title: 'Mon abonnement', icon: '👑', subtitle: 'Premium Claudyne' },
  { id: 3, title: 'Famille', icon: '👨‍👩‍👧‍👦', subtitle: 'Gérer les comptes famille' },
  { id: 4, title: 'Support', icon: '💬', subtitle: 'Aide et contact' },
  { id: 5, title: 'À propos', icon: 'ℹ️', subtitle: 'Version et informations' },
];

interface ProfileScreenProps {
  onLogout?: () => void;
}

export default function ProfileScreen({ onLogout }: ProfileScreenProps = {}) {
  const renderAchievement = (achievement: any) => (
    <View
      key={achievement.id}
      style={[
        styles.achievementCard,
        { opacity: achievement.earned ? 1 : 0.5 }
      ]}
    >
      <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
      <View style={styles.achievementInfo}>
        <Text style={styles.achievementTitle}>{achievement.title}</Text>
        <Text style={styles.achievementDescription}>{achievement.description}</Text>
      </View>
      {achievement.earned && (
        <Text style={styles.achievementBadge}>✅</Text>
      )}
    </View>
  );

  const renderStat = (stat: any, index: number) => (
    <View key={index} style={styles.statItem}>
      <Text style={styles.statLabel}>{stat.label}</Text>
      <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
    </View>
  );

  const renderMenuItem = (item: any) => (
    <TouchableOpacity key={item.id} style={styles.menuItem}>
      <Text style={styles.menuIcon}>{item.icon}</Text>
      <View style={styles.menuInfo}>
        <Text style={styles.menuTitle}>{item.title}</Text>
        <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
      </View>
      <Text style={styles.menuArrow}>▶️</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: 'https://via.placeholder.com/80x80.png?text=👤' }}
                style={styles.avatar}
              />
              <View style={styles.flagBadge}>
                <Text style={styles.flag}>🇨🇲</Text>
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>Richy NONO</Text>
              <Text style={styles.userEmail}>richy.nono@student.cm</Text>
              <Text style={styles.userLocation}>📍 Douala, Cameroun</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.statsGrid}>
            {stats.map(renderStat)}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Mes succès</Text>
            <View style={styles.achievementsContainer}>
              {achievements.map(renderAchievement)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Statistiques détaillées</Text>
            <View style={styles.detailStatsCard}>
              <View style={styles.detailStatRow}>
                <Text style={styles.detailStatLabel}>Temps d'étude total</Text>
                <Text style={styles.detailStatValue}>127h 45m</Text>
              </View>
              <View style={styles.detailStatRow}>
                <Text style={styles.detailStatLabel}>Leçons terminées</Text>
                <Text style={styles.detailStatValue}>89 / 156</Text>
              </View>
              <View style={styles.detailStatRow}>
                <Text style={styles.detailStatLabel}>Battles gagnées</Text>
                <Text style={styles.detailStatValue}>32 / 47</Text>
              </View>
              <View style={styles.detailStatRow}>
                <Text style={styles.detailStatLabel}>Taux de réussite</Text>
                <Text style={styles.detailStatValue}>68%</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Paramètres</Text>
            <View style={styles.menuContainer}>
              {menuItems.map(renderMenuItem)}
            </View>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              if (onLogout) {
                onLogout();
              } else {
                alert('Fonction de déconnexion à implémenter');
              }
            }}
          >
            <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Claudyne v1.0.0{'\n'}
              Plateforme éducative camerounaise 🇨🇲
            </Text>
          </View>
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
  header: {
    backgroundColor: THEME_CONSTANTS.COLORS.PRIMARY,
    borderBottomLeftRadius: THEME_CONSTANTS.RADIUS.LG,
    borderBottomRightRadius: THEME_CONSTANTS.RADIUS.LG,
  },
  profileSection: {
    flexDirection: 'row',
    padding: THEME_CONSTANTS.SPACING.LG,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: THEME_CONSTANTS.SPACING.LG,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME_CONSTANTS.COLORS.SURFACE,
  },
  flagBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: THEME_CONSTANTS.COLORS.SURFACE,
    borderRadius: 12,
    padding: 2,
  },
  flag: {
    fontSize: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    ...THEME_CONSTANTS.TYPOGRAPHY.H3,
    color: 'white',
    fontWeight: 'bold',
  },
  userEmail: {
    ...THEME_CONSTANTS.TYPOGRAPHY.BODY,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: THEME_CONSTANTS.SPACING.XS,
  },
  userLocation: {
    ...THEME_CONSTANTS.TYPOGRAPHY.CAPTION,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: THEME_CONSTANTS.SPACING.XS,
  },
  content: {
    padding: THEME_CONSTANTS.SPACING.LG,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: THEME_CONSTANTS.SPACING.LG,
  },
  statItem: {
    backgroundColor: THEME_CONSTANTS.COLORS.SURFACE,
    width: '48%',
    padding: THEME_CONSTANTS.SPACING.MD,
    borderRadius: THEME_CONSTANTS.RADIUS.MD,
    alignItems: 'center',
    marginBottom: THEME_CONSTANTS.SPACING.SM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    ...THEME_CONSTANTS.TYPOGRAPHY.CAPTION,
    color: THEME_CONSTANTS.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  statValue: {
    ...THEME_CONSTANTS.TYPOGRAPHY.BODY,
    fontWeight: 'bold',
    marginTop: THEME_CONSTANTS.SPACING.XS,
    textAlign: 'center',
  },
  section: {
    marginBottom: THEME_CONSTANTS.SPACING.LG,
  },
  sectionTitle: {
    ...THEME_CONSTANTS.TYPOGRAPHY.H4,
    color: THEME_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginBottom: THEME_CONSTANTS.SPACING.MD,
  },
  achievementsContainer: {
    backgroundColor: THEME_CONSTANTS.COLORS.SURFACE,
    borderRadius: THEME_CONSTANTS.RADIUS.MD,
    padding: THEME_CONSTANTS.SPACING.MD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME_CONSTANTS.SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: THEME_CONSTANTS.COLORS.DIVIDER,
  },
  achievementEmoji: {
    fontSize: 24,
    marginRight: THEME_CONSTANTS.SPACING.MD,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    ...THEME_CONSTANTS.TYPOGRAPHY.BODY,
    color: THEME_CONSTANTS.COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  achievementDescription: {
    ...THEME_CONSTANTS.TYPOGRAPHY.CAPTION,
    color: THEME_CONSTANTS.COLORS.TEXT_SECONDARY,
    marginTop: THEME_CONSTANTS.SPACING.XS,
  },
  achievementBadge: {
    fontSize: 16,
  },
  detailStatsCard: {
    backgroundColor: THEME_CONSTANTS.COLORS.SURFACE,
    borderRadius: THEME_CONSTANTS.RADIUS.MD,
    padding: THEME_CONSTANTS.SPACING.LG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: THEME_CONSTANTS.SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: THEME_CONSTANTS.COLORS.DIVIDER,
  },
  detailStatLabel: {
    ...THEME_CONSTANTS.TYPOGRAPHY.BODY,
    color: THEME_CONSTANTS.COLORS.TEXT_SECONDARY,
  },
  detailStatValue: {
    ...THEME_CONSTANTS.TYPOGRAPHY.BODY,
    color: THEME_CONSTANTS.COLORS.PRIMARY,
    fontWeight: '600',
  },
  menuContainer: {
    backgroundColor: THEME_CONSTANTS.COLORS.SURFACE,
    borderRadius: THEME_CONSTANTS.RADIUS.MD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME_CONSTANTS.SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: THEME_CONSTANTS.COLORS.DIVIDER,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: THEME_CONSTANTS.SPACING.MD,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    ...THEME_CONSTANTS.TYPOGRAPHY.BODY,
    color: THEME_CONSTANTS.COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  menuSubtitle: {
    ...THEME_CONSTANTS.TYPOGRAPHY.CAPTION,
    color: THEME_CONSTANTS.COLORS.TEXT_SECONDARY,
    marginTop: THEME_CONSTANTS.SPACING.XS,
  },
  menuArrow: {
    fontSize: 12,
    color: THEME_CONSTANTS.COLORS.TEXT_SECONDARY,
  },
  logoutButton: {
    backgroundColor: THEME_CONSTANTS.COLORS.ERROR,
    borderRadius: THEME_CONSTANTS.RADIUS.MD,
    padding: THEME_CONSTANTS.SPACING.LG,
    alignItems: 'center',
    marginBottom: THEME_CONSTANTS.SPACING.LG,
  },
  logoutText: {
    ...THEME_CONSTANTS.TYPOGRAPHY.BODY,
    color: 'white',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: THEME_CONSTANTS.SPACING.LG,
  },
  footerText: {
    ...THEME_CONSTANTS.TYPOGRAPHY.CAPTION,
    color: THEME_CONSTANTS.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 18,
  },
});