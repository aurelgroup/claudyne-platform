/**
 * Écran des leçons - Matières disponibles
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { THEME_CONSTANTS } from '../constants/config';

const subjects = [
  { id: 1, name: 'Mathématiques', emoji: '🧮', lessons: 24, progress: 75 },
  { id: 2, name: 'Français', emoji: '🇫🇷', lessons: 18, progress: 60 },
  { id: 3, name: 'Sciences', emoji: '🔬', lessons: 15, progress: 40 },
  { id: 4, name: 'Histoire-Géo', emoji: '🗺️', lessons: 12, progress: 85 },
  { id: 5, name: 'Anglais', emoji: '🇬🇧', lessons: 20, progress: 30 },
  { id: 6, name: 'Philosophie', emoji: '🤔', lessons: 10, progress: 50 },
  { id: 7, name: 'Économie', emoji: '💰', lessons: 14, progress: 20 },
  { id: 8, name: 'Arts Plastiques', emoji: '🎨', lessons: 8, progress: 90 },
];

export default function LessonsScreen() {
  const renderSubjectCard = (subject: any) => (
    <TouchableOpacity key={subject.id} style={styles.subjectCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.subjectEmoji}>{subject.emoji}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.subjectName}>{subject.name}</Text>
          <Text style={styles.lessonCount}>{subject.lessons} leçons disponibles</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${subject.progress}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>{subject.progress}%</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.flag}>🇨🇲</Text>
        <Text style={styles.title}>Mes Leçons</Text>
        <Text style={styles.subtitle}>Choisissez votre matière préférée</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>156</Text>
            <Text style={styles.statLabel}>Leçons totales</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>87</Text>
            <Text style={styles.statLabel}>Terminées</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>69</Text>
            <Text style={styles.statLabel}>Restantes</Text>
          </View>
        </View>

        <View style={styles.subjectsSection}>
          <Text style={styles.sectionTitle}>📚 Matières disponibles</Text>
          {subjects.map(renderSubjectCard)}
        </View>

        <View style={styles.quickStart}>
          <Text style={styles.sectionTitle}>⚡ Démarrage rapide</Text>
          <TouchableOpacity style={styles.quickStartCard}>
            <Text style={styles.quickStartEmoji}>🎯</Text>
            <View>
              <Text style={styles.quickStartTitle}>Continuer où j'ai arrêté</Text>
              <Text style={styles.quickStartSubtitle}>Mathématiques - Équations du 2nd degré</Text>
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
  statNumber: {
    ...THEME_CONSTANTS.TYPOGRAPHY.H3,
    color: THEME_CONSTANTS.COLORS.PRIMARY,
  },
  statLabel: {
    ...THEME_CONSTANTS.TYPOGRAPHY.CAPTION,
    color: THEME_CONSTANTS.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  subjectsSection: {
    marginBottom: THEME_CONSTANTS.SPACING.LG,
  },
  sectionTitle: {
    ...THEME_CONSTANTS.TYPOGRAPHY.H4,
    color: THEME_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginBottom: THEME_CONSTANTS.SPACING.MD,
  },
  subjectCard: {
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
  subjectEmoji: {
    fontSize: 32,
    marginRight: THEME_CONSTANTS.SPACING.MD,
  },
  cardInfo: {
    flex: 1,
  },
  subjectName: {
    ...THEME_CONSTANTS.TYPOGRAPHY.H4,
    color: THEME_CONSTANTS.COLORS.TEXT_PRIMARY,
  },
  lessonCount: {
    ...THEME_CONSTANTS.TYPOGRAPHY.CAPTION,
    color: THEME_CONSTANTS.COLORS.TEXT_SECONDARY,
    marginTop: THEME_CONSTANTS.SPACING.XS,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: THEME_CONSTANTS.COLORS.DIVIDER,
    borderRadius: THEME_CONSTANTS.RADIUS.SM,
    overflow: 'hidden',
    marginRight: THEME_CONSTANTS.SPACING.SM,
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME_CONSTANTS.COLORS.SUCCESS,
    borderRadius: THEME_CONSTANTS.RADIUS.SM,
  },
  progressText: {
    ...THEME_CONSTANTS.TYPOGRAPHY.CAPTION,
    color: THEME_CONSTANTS.COLORS.PRIMARY,
    fontWeight: '600',
  },
  quickStart: {
    marginBottom: THEME_CONSTANTS.SPACING.XL,
  },
  quickStartCard: {
    backgroundColor: THEME_CONSTANTS.COLORS.ACCENT,
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
  quickStartEmoji: {
    fontSize: 32,
    marginRight: THEME_CONSTANTS.SPACING.MD,
  },
  quickStartTitle: {
    ...THEME_CONSTANTS.TYPOGRAPHY.BODY,
    color: 'white',
    fontWeight: '600',
  },
  quickStartSubtitle: {
    ...THEME_CONSTANTS.TYPOGRAPHY.CAPTION,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: THEME_CONSTANTS.SPACING.XS,
  },
});