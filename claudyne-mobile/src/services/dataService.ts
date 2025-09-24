/**
 * Service de données intégré pour Claudyne Mobile
 * Gère la synchronisation avec l'API unifiée et le cache local
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, APP_CONFIG } from '../constants/config';
import ApiService from './apiService';
import type { User, ApiResponse } from '../types';

class DataService {
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private lastSyncTimes: { [key: string]: number } = {};

  // ====================================================================
  // GESTION DU CACHE
  // ====================================================================

  /**
   * Vérifier si les données en cache sont encore valides
   */
  private isCacheValid(cacheKey: string): boolean {
    const lastSync = this.lastSyncTimes[cacheKey];
    if (!lastSync) return false;

    return Date.now() - lastSync < this.cacheTimeout;
  }

  /**
   * Sauvegarder des données en cache
   */
  private async saveToCache(cacheKey: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      this.lastSyncTimes[cacheKey] = Date.now();
      console.log(`💾 Données mises en cache: ${cacheKey}`);
    } catch (error) {
      console.error(`❌ Erreur cache ${cacheKey}:`, error);
    }
  }

  /**
   * Récupérer des données du cache
   */
  private async getFromCache(cacheKey: string): Promise<any | null> {
    try {
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (!cachedData) return null;

      const { data, timestamp } = JSON.parse(cachedData);

      // Vérifier si les données ne sont pas trop anciennes
      if (Date.now() - timestamp > this.cacheTimeout) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      console.log(`📦 Données récupérées du cache: ${cacheKey}`);
      return data;
    } catch (error) {
      console.error(`❌ Erreur lecture cache ${cacheKey}:`, error);
      return null;
    }
  }

  // ====================================================================
  // DONNÉES UTILISATEUR
  // ====================================================================

  /**
   * Récupérer le profil utilisateur (avec cache)
   */
  async getUserProfile(forceRefresh = false): Promise<ApiResponse<{ user: User }>> {
    const cacheKey = 'user_profile';

    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      const cachedData = await this.getFromCache(cacheKey);
      if (cachedData) {
        return { success: true, data: cachedData };
      }
    }

    console.log('🔄 Récupération du profil depuis l\'API...');
    const response = await ApiService.getProfile();

    if (response.success && response.data) {
      await this.saveToCache(cacheKey, response.data);
    }

    return response;
  }

  /**
   * Récupérer les statistiques utilisateur (avec cache)
   */
  async getUserStats(forceRefresh = false): Promise<ApiResponse<{ stats: any }>> {
    const cacheKey = 'user_stats';

    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      const cachedData = await this.getFromCache(cacheKey);
      if (cachedData) {
        return { success: true, data: cachedData };
      }
    }

    console.log('📈 Récupération des stats depuis l\'API...');
    const response = await ApiService.getUserStats();

    if (response.success && response.data) {
      await this.saveToCache(cacheKey, response.data);
    }

    return response;
  }

  /**
   * Récupérer les cours disponibles (avec cache)
   */
  async getCourses(forceRefresh = false): Promise<ApiResponse<{ courses: any[]; total: number }>> {
    const cacheKey = 'available_courses';

    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      const cachedData = await this.getFromCache(cacheKey);
      if (cachedData) {
        return { success: true, data: cachedData };
      }
    }

    console.log('📚 Récupération des cours depuis l\'API...');
    const response = await ApiService.getCourses();

    if (response.success && response.data) {
      await this.saveToCache(cacheKey, response.data);
    }

    return response;
  }

  // ====================================================================
  // DONNÉES DASHBOARD
  // ====================================================================

  /**
   * Charger toutes les données du dashboard de façon optimisée
   */
  async loadDashboardData(forceRefresh = false): Promise<{
    user: User | null;
    stats: any;
    courses: any[];
    isFromCache: boolean;
  }> {
    console.log('📊 Chargement des données dashboard...');

    try {
      // Charger en parallèle pour optimiser les performances
      const [profileResponse, statsResponse, coursesResponse] = await Promise.all([
        this.getUserProfile(forceRefresh),
        this.getUserStats(forceRefresh),
        this.getCourses(forceRefresh)
      ]);

      const result = {
        user: profileResponse.success ? profileResponse.data?.user || null : null,
        stats: statsResponse.success ? statsResponse.data?.stats || {} : {},
        courses: coursesResponse.success ? coursesResponse.data?.courses || [] : [],
        isFromCache: !forceRefresh && this.isCacheValid('user_profile')
      };

      console.log('✅ Données dashboard chargées:', {
        hasUser: !!result.user,
        statsPoints: result.stats.points || 0,
        coursesCount: result.courses.length,
        isFromCache: result.isFromCache
      });

      return result;
    } catch (error) {
      console.error('❌ Erreur chargement dashboard:', error);

      // Essayer de récupérer les données du cache en cas d'erreur réseau
      const cachedProfile = await this.getFromCache('user_profile');
      const cachedStats = await this.getFromCache('user_stats');
      const cachedCourses = await this.getFromCache('available_courses');

      return {
        user: cachedProfile?.user || null,
        stats: cachedStats?.stats || {},
        courses: cachedCourses?.courses || [],
        isFromCache: true
      };
    }
  }

  // ====================================================================
  // CONFIGURATION MOBILE
  // ====================================================================

  /**
   * Récupérer la configuration mobile
   */
  async getMobileConfig(): Promise<ApiResponse<any>> {
    const cacheKey = 'mobile_config';

    // La config est mise en cache plus longtemps (30 minutes)
    const configCacheTimeout = 30 * 60 * 1000;
    const lastSync = this.lastSyncTimes[cacheKey];

    if (lastSync && Date.now() - lastSync < configCacheTimeout) {
      const cachedData = await this.getFromCache(cacheKey);
      if (cachedData) {
        return { success: true, data: cachedData };
      }
    }

    console.log('⚙️ Récupération config mobile...');
    const response = await ApiService.getMobileConfig();

    if (response.success && response.data) {
      await this.saveToCache(cacheKey, response.data);
    }

    return response;
  }

  /**
   * Vérifier la version de l'application
   */
  async checkAppVersion(): Promise<{
    needsUpdate: boolean;
    latestVersion: string;
    downloadUrl?: string;
    updateMessage?: string;
  }> {
    try {
      const response = await ApiService.checkAppVersion(APP_CONFIG.VERSION);

      if (response.success && response.data) {
        return {
          needsUpdate: response.data.needsUpdate || false,
          latestVersion: response.data.latestVersion || APP_CONFIG.VERSION,
          downloadUrl: response.data.downloadUrl,
          updateMessage: response.data.updateMessage
        };
      }
    } catch (error) {
      console.error('❌ Erreur vérification version:', error);
    }

    return {
      needsUpdate: false,
      latestVersion: APP_CONFIG.VERSION
    };
  }

  // ====================================================================
  // NETTOYAGE ET MAINTENANCE
  // ====================================================================

  /**
   * Nettoyer le cache expiré
   */
  async cleanExpiredCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key =>
        !key.startsWith('@claudyne_user_') &&
        !key.startsWith('@claudyne_settings')
      );

      for (const key of cacheKeys) {
        const cachedData = await AsyncStorage.getItem(key);
        if (cachedData) {
          const { timestamp } = JSON.parse(cachedData);
          if (Date.now() - timestamp > this.cacheTimeout) {
            await AsyncStorage.removeItem(key);
            console.log(`🗑️ Cache expiré supprimé: ${key}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur nettoyage cache:', error);
    }
  }

  /**
   * Vider tout le cache
   */
  async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key =>
        !key.startsWith('@claudyne_user_token') &&
        !key.startsWith('@claudyne_settings')
      );

      await AsyncStorage.multiRemove(cacheKeys);
      this.lastSyncTimes = {};
      console.log('🗑️ Cache vidé complètement');
    } catch (error) {
      console.error('❌ Erreur vidage cache:', error);
    }
  }

  /**
   * Forcer le rechargement de toutes les données
   */
  async refreshAllData(): Promise<void> {
    console.log('🔄 Rechargement forcé de toutes les données...');
    this.lastSyncTimes = {};
    await this.loadDashboardData(true);
  }
}

export default new DataService();