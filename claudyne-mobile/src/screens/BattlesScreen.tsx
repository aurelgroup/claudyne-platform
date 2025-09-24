/**
 * Écran Battle Royale - Tournois et compétitions
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { THEME_CONSTANTS } from '../constants/config';

const tournaments = [
  {
    id: 1,
    name: 'Tournoi des Champions',
    emoji: '👑',
    participants: 128,
    prize: '50,000 XAF',
    status: 'active',
    timeLeft: '2h 45m',
    difficulty: 'Expert'
  },
  {
    id: 2,
    name: 'Battle Mathématiques',
    emoji: '🧮',
    participants: 64,
    prize: '25,000 XAF',
    status: 'starting',
    timeLeft: '15m',
    difficulty: 'Intermédiaire'
  },
  {
    id: 3,
    name: 'Défi Sciences',
    emoji: '🔬',
    participants: 32,
    prize: '15,000 XAF',
    status: 'waiting',
    timeLeft: '1h 30m',
    difficulty: 'Débutant'
  },
  {
    id: 4,
    name: 'Liga Camerounaise',
    emoji: '🇨🇲',
    participants: 256,
    prize: '100,000 XAF',
    status: 'upcoming',
    timeLeft: '2 jours',
    difficulty: 'Master'
  },
];

const myBattles = [
  { id: 1, opponent: 'Marie K.', subject: 'Histoire', result: 'win', points: '+150' },
  { id: 2, opponent: 'Jean P.', subject: 'Maths', result: 'lose', points: '-50' },
  { id: 3, opponent: 'Alex M.', subject: 'Sciences', result: 'win', points: '+200' },
];

export default function BattlesScreen() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return THEME_CONSTANTS.COLORS.SUCCESS;
      case 'starting': return THEME_CONSTANTS.COLORS.WARNING;
      case 'waiting': return THEME_CONSTANTS.COLORS.INFO;
      case 'upcoming': return THEME_CONSTANTS.COLORS.TEXT_SECONDARY;
      default: return THEME_CONSTANTS.COLORS.TEXT_SECONDARY;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'En cours';
      case 'starting': return 'Démarrage';
      case 'waiting': return 'En attente';
      case 'upcoming': return 'À venir';
      default: return status;
    }
  };

  const renderTournamentCard = (tournament: any) => (
    <TouchableOpacity key={tournament.id} style={styles.tournamentCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.tournamentEmoji}>{tournament.emoji}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.tournamentName}>{tournament.name}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tournament.status) }]}>
              <Text style={styles.statusText}>{getStatusText(tournament.status)}</Text>
            </View>
            <Text style={styles.timeLeft}>{tournament.timeLeft}</Text>
          </View>
        </View>
      </View>

      <View style={styles.tournamentDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Participants</Text>
          <Text style={styles.detailValue}>{tournament.participants}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Prix</Text>
          <Text style={styles.detailValue}>{tournament.prize}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Niveau</Text>
          <Text style={styles.detailValue}>{tournament.difficulty}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderBattleHistory = (battle: any) => (
    <View key={battle.id} style={styles.battleItem}>
      <View style={styles.battleInfo}>
        <Text style={styles.opponentName}>{battle.opponent}</Text>
        <Text style={styles.battleSubject}>{battle.subject}</Text>
      </View>
      <View style={styles.battleResult}>
        <Text style={[
          styles.battlePoints,
          { color: battle.result === 'win' ? THEME_CONSTANTS.COLORS.SUCCESS : THEME_CONSTANTS.COLORS.ERROR }
        ]}>
          {battle.points}
        </Text>
        <Text style={styles.battleEmoji}>{battle.result === 'win' ? '🏆' : '😔'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.flag}>🇨🇲</Text>
        <Text style={styles.title}>Battle Royale</Text>
        <Text style={styles.subtitle}>Affrontez les meilleurs étudiants</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>⚔️</Text>
            <Text style={styles.statNumber}>47</Text>
            <Text style={styles.statLabel}>Battles</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statNumber}>32</Text>
            <Text style={styles.statLabel}>Victoires</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🥇</Text>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Tournois</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Tournois disponibles</Text>
          {tournaments.map(renderTournamentCard)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Mes dernières battles</Text>
          <View style={styles.historyCard}>
            {myBattles.map(renderBattleHistory)}
          </View>
        </View>

        <View style={styles.quickBattle}>
          <TouchableOpacity style={styles.quickBattleButton}>
            <Text style={styles.quickBattleEmoji}>⚡</Text>
            <View>
              <Text style={styles.quickBattleTitle}>Battle Rapide</Text>
              <Text style={styles.quickBattleSubtitle}>Trouvez un adversaire maintenant</Text>
            </View>
          </TouchableOpacity>
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
    padding: THEME_CONSTANTS.SPACING.LG,
    alignItems: 'center',
    borderBottomLeftRadius: THEME_CONSTANTS.RADIUS.LG,
    borderBottomRightRadius: THEME_CONSTANTS.RADIUS.LG,
  },
  flag: {
    fontSize: 32,
    marginBottom: THEME_CONSTANTS.SPACING.SM,
  },
  title: {
    ...THEME_CONSTANTS.TYPOGRAPHY.H2,
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    ...THEME_CONSTANTS.TYPOGRAPHY.BODY,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: THEME_CONSTANTS.SPACING.SM,
  },
  content: {
    flex: 1,
    padding: THEME_CONSTANTS.SPACING.LG,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: THEME_CONSTANTS.COLORS.SURFACE,
    borderRadius: THEME_CONSTANTS.RADIUS.MD,
    padding: THEME_CONSTANTS.SPACING.MD,
    marginBottom: THEME_CONSTANTS.SPACING.LG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: THEME_CONSTANTS.SPACING.XS,
  },
  statNumber: {
    ...THEME_CONSTANTS.TYPOGRAPHY.H3,
    color: THEME_CONSTANTS.COLORS.PRIMARY,
  },
  statLabel: {
    ...THEME_CONSTANTS.TYPOGRAPHY.CAPTION,
    color: THEME_CONSTANTS.COLORS.TEXT_SECONDARY,
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
  tournamentCard: {
    backgroundColor: THEME_CONSTANTS.COLORS.SURFACE,
    borderRadius: THEME_CONSTANTS.RADIUS.MD,
    padding: THEME_CONSTANTS.SPACING.LG,
    marginBottom: THEME_CONSTANTS.SPACING.MD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME_CONSTANTS.SPACING.MD,
  },
  tournamentEmoji: {
    fontSize: 32,
    marginRight: THEME_CONSTANTS.SPACING.MD,
  },
  cardInfo: {
    flex: 1,
  },
  tournamentName: {
    ...THEME_CONSTANTS.TYPOGRAPHY.H4,
    color: THEME_CONSTANTS.COLORS.TEXT_PRIMARY,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: THEME_CONSTANTS.SPACING.XS,
  },
  statusBadge: {
    paddingHorizontal: THEME_CONSTANTS.SPACING.SM,
    paddingVertical: THEME_CONSTANTS.SPACING.XS,
    borderRadius: THEME_CONSTANTS.RADIUS.SM,
    marginRight: THEME_CONSTANTS.SPACING.SM,
  },
  statusText: {
    ...THEME_CONSTANTS.TYPOGRAPHY.SMALL,
    color: 'white',
    fontWeight: '600',
  },
  timeLeft: {
    ...THEME_CONSTANTS.TYPOGRAPHY.CAPTION,
    color: THEME_CONSTANTS.COLORS.TEXT_SECONDARY,
    fontWeight: '600',
  },
  tournamentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    ...THEME_CONSTANTS.TYPOGRAPHY.CAPTION,
    color: THEME_CONSTANTS.COLORS.TEXT_SECONDARY,
  },
  detailValue: {
    ...THEME_CONSTANTS.TYPOGRAPHY.BODY,
    color: THEME_CONSTANTS.COLORS.PRIMARY,
    fontWeight: '600',
    marginTop: THEME_CONSTANTS.SPACING.XS,
  },
  historyCard: {
    backgroundColor: THEME_CONSTANTS.COLORS.SURFACE,
    borderRadius: THEME_CONSTANTS.RADIUS.MD,
    padding: THEME_CONSTANTS.SPACING.LG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  battleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: THEME_CONSTANTS.SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: THEME_CONSTANTS.COLORS.DIVIDER,
  },
  battleInfo: {
    flex: 1,
  },
  opponentName: {
    ...THEME_CONSTANTS.TYPOGRAPHY.BODY,
    color: THEME_CONSTANTS.COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  battleSubject: {
    ...THEME_CONSTANTS.TYPOGRAPHY.CAPTION,
    color: THEME_CONSTANTS.COLORS.TEXT_SECONDARY,
    marginTop: THEME_CONSTANTS.SPACING.XS,
  },
  battleResult: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  battlePoints: {
    ...THEME_CONSTANTS.TYPOGRAPHY.BODY,
    fontWeight: '600',
    marginRight: THEME_CONSTANTS.SPACING.SM,
  },
  battleEmoji: {
    fontSize: 20,
  },
  quickBattle: {
    marginBottom: THEME_CONSTANTS.SPACING.XL,
  },
  quickBattleButton: {
    backgroundColor: THEME_CONSTANTS.COLORS.SECONDARY,
    borderRadius: THEME_CONSTANTS.RADIUS.MD,
    padding: THEME_CONSTANTS.SPACING.LG,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickBattleEmoji: {
    fontSize: 32,
    marginRight: THEME_CONSTANTS.SPACING.MD,
  },
  quickBattleTitle: {
    ...THEME_CONSTANTS.TYPOGRAPHY.BODY,
    color: 'white',
    fontWeight: '600',
  },
  quickBattleSubtitle: {
    ...THEME_CONSTANTS.TYPOGRAPHY.CAPTION,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: THEME_CONSTANTS.SPACING.XS,
  },
});