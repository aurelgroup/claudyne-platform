/**
 * Service API pour Claudyne
 * Interface avec le backend Claudyne existant
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS } from '../constants/config';
import type {
  ApiResponse,
  LoginCredentials,
  RegisterData,
  User,
  Battle,
  Lesson,
  MentorMessage,
  PaginatedResponse
} from '../types';

class ApiService {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  /**
   * Effectue une requête HTTP avec gestion des erreurs
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);

      const config: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Type': API_CONFIG.MOBILE_CLIENT_TYPE,
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      };

      // Utilisation d'AbortController pour le timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...config,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur réseau inconnue'
      };
    }
  }

  // ========================================================================
  // AUTHENTIFICATION
  // ========================================================================

  /**
   * Connexion utilisateur
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    console.log('🔍 Login attempt with credentials:', credentials);
    const response = await this.request<{ user: User; token: string; expiresIn: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        ...credentials,
        clientType: API_CONFIG.MOBILE_CLIENT_TYPE
      }),
    });
    console.log('📡 API Response:', response);

    if (response.success && response.data) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, response.data.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
    }

    return response;
  }

  /**
   * Inscription utilisateur
   */
  async register(userData: RegisterData): Promise<ApiResponse<{ user: User; tokens: any }>> {
    const response = await this.request<{ user: User; tokens: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, response.data.tokens.accessToken);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
    }

    return response;
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_TOKEN,
      STORAGE_KEYS.USER_DATA,
    ]);
  }

  /**
   * Récupération du profil utilisateur
   */
  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>('/api/user/profile');
  }

  // ========================================================================
  // COURS & LEÇONS
  // ========================================================================

  /**
   * Récupération des cours disponibles
   */
  async getCourses(): Promise<ApiResponse<{ courses: any[]; total: number }>> {
    return this.request<{ courses: any[]; total: number }>('/api/courses');
  }

  /**
   * Récupération des statistiques utilisateur
   */
  async getUserStats(): Promise<ApiResponse<{ stats: any }>> {
    return this.request<{ stats: any }>('/api/user/stats');
  }

  /**
   * Récupération des leçons (compatibilité)
   */
  async getLessons(subjectId: string, page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<Lesson>>> {
    return this.getCourses() as any;
  }

  /**
   * Récupération d'une leçon spécifique (compatibilité)
   */
  async getLesson(lessonId: string): Promise<ApiResponse<Lesson>> {
    return this.request<Lesson>(`/api/courses/${lessonId}`);
  }

  /**
   * Marquer un cours comme terminé
   */
  async completeLesson(lessonId: string, score: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/courses/${lessonId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ score }),
    });
  }

  // ========================================================================
  // BATTLE ROYALE
  // ========================================================================

  /**
   * Récupération des battles disponibles
   */
  async getBattles(status?: string): Promise<ApiResponse<Battle[]>> {
    const query = status ? `?status=${status}` : '';
    return this.request<Battle[]>(`/api/battles${query}`);
  }

  /**
   * Rejoindre une battle
   */
  async joinBattle(battleId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/battles/${battleId}/join`, {
      method: 'POST',
    });
  }

  /**
   * Quitter une battle
   */
  async leaveBattle(battleId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/battles/${battleId}/leave`, {
      method: 'POST',
    });
  }

  /**
   * Soumettre une réponse dans une battle
   */
  async submitBattleAnswer(battleId: string, questionId: string, answer: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/battles/${battleId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ questionId, answer }),
    });
  }

  // ========================================================================
  // MENTOR IA
  // ========================================================================

  /**
   * Envoyer un message au mentor IA
   */
  async sendMentorMessage(message: string, sessionId?: string): Promise<ApiResponse<{ response: string; sessionId: string }>> {
    return this.request<{ response: string; sessionId: string }>('/api/mentor/chat', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    });
  }

  /**
   * Récupération de l'historique des conversations
   */
  async getMentorSessions(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/api/mentor/sessions');
  }

  // ========================================================================
  // PROGRÈS & STATISTIQUES
  // ========================================================================

  /**
   * Récupération des statistiques de progrès
   */
  async getProgress(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/progress');
  }

  /**
   * Récupération des statistiques générales
   */
  async getStats(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/stats');
  }

  // ========================================================================
  // NOTIFICATIONS
  // ========================================================================

  /**
   * Récupération des notifications
   */
  async getNotifications(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/api/notifications');
  }

  /**
   * Marquer une notification comme lue
   */
  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }

  // ========================================================================
  // PRIX CLAUDINE
  // ========================================================================

  /**
   * Récupération des informations Prix Claudine
   */
  async getPrixClaudineInfo(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/prix-claudine');
  }

  /**
   * Soumettre une candidature Prix Claudine
   */
  async submitPrixClaudineApplication(data: any): Promise<ApiResponse<any>> {
    return this.request<any>('/api/prix-claudine/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ========================================================================
  // GESTION FAMILLE
  // ========================================================================

  /**
   * Récupération des informations familiales
   */
  async getFamilyInfo(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/families/me');
  }

  /**
   * Récupération des étudiants de la famille
   */
  async getFamilyStudents(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/api/families/students');
  }

  // ========================================================================
  // UTILITAIRES
  // ========================================================================

  /**
   * Test de connectivité API
   */
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request<any>('/api');
  }

  /**
   * Récupération de la configuration mobile
   */
  async getMobileConfig(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/mobile/config');
  }

  /**
   * Vérification de version de l'app
   */
  async checkAppVersion(currentVersion: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/mobile/version-check?version=${currentVersion}`);
  }

  /**
   * Vérification du token stocké
   */
  async checkStoredToken(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      if (!token) return false;

      const response = await this.getProfile();
      return response.success;
    } catch {
      return false;
    }
  }
}

export default new ApiService();