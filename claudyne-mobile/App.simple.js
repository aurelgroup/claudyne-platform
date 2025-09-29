import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020205" />
      <Text style={styles.title}>🇨🇲 CLAUDYNE</Text>
      <Text style={styles.subtitle}>Mobile App - Expo Go Ready</Text>
      <Text style={styles.status}>✅ Expo Go Compatible</Text>
      <Text style={styles.status}>✅ No Platform Dependencies</Text>
      <Text style={styles.status}>✅ Pure React Native</Text>
      <Text style={styles.version}>Version 1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020205',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#00FFC2',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 40,
  },
  status: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    textAlign: 'center',
  },
  version: {
    fontSize: 14,
    color: '#00FFC2',
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
});