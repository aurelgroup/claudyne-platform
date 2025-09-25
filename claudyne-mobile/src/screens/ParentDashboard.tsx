/**
 * ParentDashboard.tsx - Interface Parent Claudyne
 * Tableau de bord spécialisé pour les parents
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function ParentDashboard() {
  const [selectedChild, setSelectedChild] = useState(null);

  // Données mock pour demo
  const children = [
    { id: 1, name: 'Marie', age: 12, grade: '6ème', progress: 85 },
    { id: 2, name: 'Jean', age: 15, grade: '3ème', progress: 92 }
  ];

  const parentFeatures = [
    {
      title: '👥 Suivi Enfants',
      description: 'Progression et activités',
      color: '#00FFC2'
    },
    {
      title: '🔔 Notifications',
      description: 'Alertes temps réel',
      color: '#FF57E3'
    },
    {
      title: '🛡️ Contrôle Parental',
      description: 'Paramètres et restrictions',
      color: '#FFC947'
    },
    {
      title: '📊 Rapports',
      description: 'Analytics de progrès',
      color: '#00FFC2'
    }
  ];

  const handleFeaturePress = (feature) => {
    Alert.alert(
      feature.title,
      `Interface ${feature.description} sera disponible dans la version complète de Claudyne Parent.`,
      [{ text: 'Compris' }]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>👨‍👩‍👧‍👦</Text>
        <Text style={styles.title}>PARENT DASHBOARD</Text>
        <Text style={styles.subtitle}>Claudyne Family</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Enfants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes Enfants</Text>
          {children.map(child => (
            <TouchableOpacity
              key={child.id}
              style={styles.childCard}
              onPress={() => setSelectedChild(child)}
            >
              <Text style={styles.childName}>{child.name}</Text>
              <Text style={styles.childInfo}>{child.age} ans - {child.grade}</Text>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${child.progress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>{child.progress}% réussite</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fonctionnalités Parent */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outils Parent</Text>
          <View style={styles.featuresGrid}>
            {parentFeatures.map((feature, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.featureCard, { borderLeftColor: feature.color }]}
                onPress={() => handleFeaturePress(feature)}
              >
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Statistiques Rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aperçu Rapide</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>2</Text>
              <Text style={styles.statLabel}>Enfants</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>89%</Text>
              <Text style={styles.statLabel}>Moyenne</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Cours cette semaine</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020205',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#00FFC2',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  childCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00FFC2',
  },
  childName: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  childInfo: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00FFC2',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#00FFC2',
    textAlign: 'right',
  },
  featuresGrid: {
    gap: 12,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  featureTitle: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    color: '#FF57E3',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});