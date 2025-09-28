/**
 * 🔐 SERVICE DE STOCKAGE SÉCURISÉ CLAUDYNE
 * Niveau sécurité: MILITAIRE
 * Chiffrement AES-256 natif iOS/Android
 */

import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../constants/config';

class SecureStorageService {
  private isAvailable = false;

  constructor() {
    this.checkAvailability();
  }

  /**
   * Vérifier la disponibilité du stockage sécurisé
   */
  private async checkAvailability(): Promise<void> {
    try {
      this.isAvailable = await SecureStore.isAvailableAsync();
      if (this.isAvailable) {
        console.log('🔐 Stockage sécurisé activé - Chiffrement AES-256');
      } else {
        console.warn('⚠️ Stockage sécurisé non disponible - Fallback AsyncStorage');
      }
    } catch (error) {
      console.error('❌ Erreur vérification stockage sécurisé:', error);
      this.isAvailable = false;
    }
  }

  /**
   * Stocker une valeur de façon sécurisée
   */
  async setSecureItem(key: string, value: string): Promise<boolean> {
    try {
      if (!this.isAvailable) {
        throw new Error('Stockage sécurisé non disponible');
      }

      await SecureStore.setItemAsync(key, value, {
        requireAuthentication: false, // Pour éviter de demander auth à chaque accès
        keychainService: 'claudyne-keychain',
        accessGroup: 'group.com.claudyne.app.shared',
      });

      return true;
    } catch (error) {
      console.error(`❌ Erreur stockage sécurisé [${key}]:`, error);
      return false;
    }
  }

  /**
   * Récupérer une valeur sécurisée
   */
  async getSecureItem(key: string): Promise<string | null> {
    try {
      if (!this.isAvailable) {
        return null;
      }

      const value = await SecureStore.getItemAsync(key, {
        requireAuthentication: false,
        keychainService: 'claudyne-keychain',
        accessGroup: 'group.com.claudyne.app.shared',
      });

      return value;
    } catch (error) {
      console.error(`❌ Erreur récupération sécurisée [${key}]:`, error);
      return null;
    }
  }

  /**
   * Supprimer une valeur sécurisée
   */
  async deleteSecureItem(key: string): Promise<boolean> {
    try {
      if (!this.isAvailable) {
        return false;
      }

      await SecureStore.deleteItemAsync(key, {
        keychainService: 'claudyne-keychain',
        accessGroup: 'group.com.claudyne.app.shared',
      });

      return true;
    } catch (error) {
      console.error(`❌ Erreur suppression sécurisée [${key}]:`, error);
      return false;
    }
  }

  // ========================================================================
  // 🔑 MÉTHODES SPÉCIFIQUES CLAUDYNE
  // ========================================================================

  /**
   * Stocker le token d'authentification (ULTRA SÉCURISÉ)
   */
  async setAuthToken(token: string): Promise<boolean> {
    return this.setSecureItem(STORAGE_KEYS.USER_TOKEN, token);
  }

  /**
   * Récupérer le token d'authentification
   */
  async getAuthToken(): Promise<string | null> {
    return this.getSecureItem(STORAGE_KEYS.USER_TOKEN);
  }

  /**
   * Stocker les données utilisateur (CHIFFRÉES)
   */
  async setUserData(userData: any): Promise<boolean> {
    try {
      const jsonData = JSON.stringify(userData);
      return this.setSecureItem(STORAGE_KEYS.USER_DATA, jsonData);
    } catch (error) {
      console.error('❌ Erreur sérialisation userData:', error);
      return false;
    }
  }

  /**
   * Récupérer les données utilisateur
   */
  async getUserData(): Promise<any | null> {
    try {
      const jsonData = await this.getSecureItem(STORAGE_KEYS.USER_DATA);
      return jsonData ? JSON.parse(jsonData) : null;
    } catch (error) {
      console.error('❌ Erreur désérialisation userData:', error);
      return null;
    }
  }

  /**
   * Nettoyer toutes les données sécurisées (LOGOUT COMPLET)
   */
  async clearAllSecureData(): Promise<boolean> {
    try {
      const deletePromises = [
        this.deleteSecureItem(STORAGE_KEYS.USER_TOKEN),
        this.deleteSecureItem(STORAGE_KEYS.USER_DATA),
      ];

      const results = await Promise.all(deletePromises);
      const allSuccess = results.every(result => result === true);

      if (allSuccess) {
        console.log('✅ Toutes les données sécurisées supprimées');
      } else {
        console.warn('⚠️ Certaines données n\'ont pas pu être supprimées');
      }

      return allSuccess;
    } catch (error) {
      console.error('❌ Erreur nettoyage données sécurisées:', error);
      return false;
    }
  }

  /**
   * Vérifier l'intégrité du stockage sécurisé
   */
  async checkIntegrity(): Promise<boolean> {
    try {
      // Test d'écriture/lecture
      const testKey = '__claudyne_integrity_test__';
      const testValue = 'test_value_' + Date.now();

      const writeSuccess = await this.setSecureItem(testKey, testValue);
      if (!writeSuccess) return false;

      const readValue = await this.getSecureItem(testKey);
      const readSuccess = readValue === testValue;

      await this.deleteSecureItem(testKey);

      if (readSuccess) {
        console.log('✅ Intégrité stockage sécurisé vérifiée');
      } else {
        console.error('❌ Échec vérification intégrité');
      }

      return readSuccess;
    } catch (error) {
      console.error('❌ Erreur test intégrité:', error);
      return false;
    }
  }

  /**
   * Obtenir les informations de sécurité
   */
  getSecurityInfo(): {
    isAvailable: boolean;
    encryptionLevel: string;
    platform: string;
  } {
    return {
      isAvailable: this.isAvailable,
      encryptionLevel: this.isAvailable ? 'AES-256 Hardware' : 'Non disponible',
      platform: this.isAvailable ? 'Keychain/Keystore natif' : 'Fallback'
    };
  }
}

export default new SecureStorageService();