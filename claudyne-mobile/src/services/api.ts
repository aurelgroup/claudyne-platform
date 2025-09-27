/**
 * Service API Claudyne Mobile
 * Intégration avec système synchronisation JSON ↔ PostgreSQL
 * Compatible avec nouveau backend unifié
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS } from '../constants/config';
import Constants from 'expo-constants';

interface LoginCredentials {
  email: string;
  password: string;
  clientType?: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
  userType?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  token?: string;
  user?: any;
  error?: string;
}

class ClaudyneApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    // Priorité: Variable d'environnement > Configuration par défaut
    this.baseUrl = Constants.expoConfig?.extra?.apiUrl || API_CONFIG.BASE_URL;
    this.loadStoredToken();

    console.log(`🌐 Claudyne API Service initialized: ${this.baseUrl}`);
  }

  private async loadStoredToken() {
    try {
      this.token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    } catch (error) {
      console.error('Erreur chargement token:', error);
    }
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'X-Client-Type': API_CONFIG.MOBILE_CLIENT_TYPE,
        ...options.headers,
      };

      // Ajouter token si disponible
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const config: RequestInit = {
        timeout: API_CONFIG.TIMEOUT,
        ...options,
        headers,
      };

      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      console.log(`✅ API Response: ${endpoint}`, data.success ? 'Success' : 'Failed');
      return data;

    } catch (error) {
      console.error(`❌ API Error: ${endpoint}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur réseau'
      };
    }
  }

  // ========================================
  // AUTHENTIFICATION
  // ========================================

  async login(credentials: LoginCredentials): Promise<ApiResponse> {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        ...credentials,
        clientType: API_CONFIG.MOBILE_CLIENT_TYPE
      })
    });

    if (response.success && response.token) {
      this.token = response.token;
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, response.token);

      if (response.user) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
      }
    }

    return response;
  }

  async register(userData: RegisterData): Promise<ApiResponse> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...userData,
        clientType: API_CONFIG.MOBILE_CLIENT_TYPE
      })
    });
  }

  async logout(): Promise<void> {
    this.token = null;
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_TOKEN,
      STORAGE_KEYS.USER_DATA
    ]);
  }

  async refreshToken(): Promise<ApiResponse> {
    return this.request('/api/auth/refresh', {
      method: 'POST'
    });
  }

  // ========================================
  // UTILISATEURS ET PROFILS
  // ========================================

  async getProfile(): Promise<ApiResponse> {
    return this.request('/api/users/profile');
  }

  async updateProfile(profileData: Partial<RegisterData>): Promise<ApiResponse> {
    return this.request('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  async getFamilyMembers(): Promise<ApiResponse> {
    return this.request('/api/users/family');
  }

  // ========================================
  // CONTENU ÉDUCATIF
  // ========================================

  async getLessons(subjectId?: string): Promise<ApiResponse> {
    const endpoint = subjectId
      ? `/api/lessons?subject=${subjectId}`
      : '/api/lessons';
    return this.request(endpoint);
  }

  async getLessonDetail(lessonId: string): Promise<ApiResponse> {
    return this.request(`/api/lessons/${lessonId}`);
  }

  async getSubjects(): Promise<ApiResponse> {
    return this.request('/api/subjects');
  }

  async getUserProgress(): Promise<ApiResponse> {
    return this.request('/api/progress');
  }

  async updateProgress(lessonId: string, progressData: any): Promise<ApiResponse> {
    return this.request(`/api/progress/${lessonId}`, {
      method: 'POST',
      body: JSON.stringify(progressData)
    });
  }

  // ========================================
  // BATTLE ROYALE
  // ========================================

  async getBattles(): Promise<ApiResponse> {
    return this.request('/api/battles');
  }

  async joinBattle(battleId: string): Promise<ApiResponse> {
    return this.request(`/api/battles/${battleId}/join`, {
      method: 'POST'
    });
  }

  async getBattleResults(battleId: string): Promise<ApiResponse> {
    return this.request(`/api/battles/${battleId}/results`);
  }

  // ========================================
  // PRIX CLAUDINE
  // ========================================

  async getPrixClaudine(): Promise<ApiResponse> {
    return this.request('/api/prix-claudine');
  }

  async getFamilyRanking(): Promise<ApiResponse> {
    return this.request('/api/prix-claudine/ranking');
  }

  // ========================================
  // NOTIFICATIONS
  // ========================================

  async getNotifications(): Promise<ApiResponse> {
    return this.request('/api/notifications');
  }

  async markNotificationRead(notificationId: string): Promise<ApiResponse> {
    return this.request(`/api/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  }

  // ========================================
  // SYNC ET STATUS
  // ========================================

  async getSyncStatus(): Promise<ApiResponse> {
    return this.request('/api/sync/status');
  }

  async forceDatabaseSync(): Promise<ApiResponse> {
    return this.request('/api/sync/force', {
      method: 'POST'
    });
  }

  // ========================================
  // UTILITAIRES
  // ========================================

  async ping(): Promise<ApiResponse> {
    return this.request('/api/ping');
  }

  async getAppConfig(): Promise<ApiResponse> {
    return this.request('/api/config');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  // ========================================
  // GESTION CACHE OFFLINE
  // ========================================

  async getCachedData(key: string): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(`cache_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erreur cache lecture:', error);
      return null;
    }
  }

  async setCachedData(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Erreur cache écriture:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Erreur nettoyage cache:', error);
    }
  }
}

// Instance singleton
export const apiService = new ClaudyneApiService();
export default apiService;