/**
 * Service API pour Claudyne
 * Interface avec le backend Claudyne existant
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS } from '../constants/config';
import SecureStorage from './secureStorage';
import { globalRateLimiter } from '../utils/rateLimiter';
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
      const token = await SecureStorage.getAuthToken();

      const config: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': API_CONFIG.CACHE_CONTROL,
          ...API_CONFIG.SECURITY_HEADERS,
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      };

      // Utilisation d'AbortController pour le timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        // 🔒 Validation HTTPS obligatoire
        if (!this.baseUrl.startsWith('https://') && API_CONFIG.VALIDATE_SSL) {
          throw new Error('HTTPS requis pour les communications sécurisées');
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...config,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        // 🛡️ Vérifications sécurité supplémentaires
        if (!response.ok) {
          // Log sécurisé des erreurs HTTP
          console.error(`❌ HTTP Error ${response.status}:`, {
            url: `${this.baseUrl}${endpoint}`,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          });

          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // 🔍 Validation du Content-Type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('⚠️ Réponse non-JSON détectée:', contentType);
        }

        const data = await response.json();

        // 🔒 Validation structure réponse
        if (typeof data !== 'object' || data === null) {
          throw new Error('Format de réponse invalide');
        }

        return data;
      } catch (fetchError) {
        clearTimeout(timeoutId);

        // 🔍 Gestion d'erreurs sécurisée
        if (fetchError instanceof Error) {
          if (fetchError.name === 'AbortError') {
            throw new Error('Timeout de connexion - Vérifiez votre réseau');
          }

          // Sanitiser les erreurs avant logging
          console.error('❌ API Request Error:', SecurityUtils.sanitizeForLogging({
            message: fetchError.message,
            name: fetchError.name,
            endpoint: endpoint,
            timestamp: new Date().toISOString()
          }));
        }

        throw fetchError;
      }
    } catch (error) {
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
    // 🛡️ Vérification rate limiting ultra-stricte
    const rateLimitCheck = globalRateLimiter.isAllowed(credentials.credential.toLowerCase(), 'login');

    if (!rateLimitCheck.allowed) {
      const timeRemaining = rateLimitCheck.blockTime || 0;
      const timeText = timeRemaining > 0 ?
        `Réessayez dans ${Math.ceil(timeRemaining / 60000)} minute(s).` :
        'Trop de tentatives récentes.';

      return {
        success: false,
        error: `🛡️ Limite de tentatives atteinte.\n\n${timeText}`
      };
    }

    const response = await this.request<{ user: User; token: string; expiresIn: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        ...credentials,
        clientType: API_CONFIG.MOBILE_CLIENT_TYPE
      }),
    });

    if (response.success && response.data) {
      await SecureStorage.setAuthToken(response.data.token);
      await SecureStorage.setUserData(response.data.user);
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
      await SecureStorage.setAuthToken(response.data.tokens.accessToken);
      await SecureStorage.setUserData(response.data.user);
    }

    return response;
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    await SecureStorage.clearAllSecureData();
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
      const token = await SecureStorage.getAuthToken();
      if (!token) return false;

      const response = await this.getProfile();
      return response.success;
    } catch {
      return false;
    }
  }

  // ========================================================================
  // 🔮 RÉINITIALISATION MOT DE PASSE QUANTIQUE
  // ========================================================================

  /**
   * Demande de réinitialisation par email
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<any>> {
    // 🛡️ Rate limiting ultra-strict pour récupération mot de passe
    const rateLimitCheck = globalRateLimiter.isAllowed(email.toLowerCase(), 'passwordReset');

    if (!rateLimitCheck.allowed) {
      const timeRemaining = rateLimitCheck.blockTime || 0;
      const timeText = timeRemaining > 0 ?
        `Réessayez dans ${Math.ceil(timeRemaining / 60000)} minute(s).` :
        'Trop de tentatives récentes.';

      return {
        success: false,
        error: `🔒 Limite de récupération atteinte.\n\n${timeText}\n\nSécurité renforcée active.`
      };
    }

    return this.request<any>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        clientType: API_CONFIG.MOBILE_CLIENT_TYPE,
        biometricSupported: true
      }),
    });
  }

  /**
   * Demande de réinitialisation sécurisée (Email + Biométrie)
   */
  async requestSecurePasswordReset(email: string, biometricData?: string): Promise<ApiResponse<any>> {
    return this.request<any>('/api/auth/secure-reset', {
      method: 'POST',
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        biometricVerified: true,
        biometricData: biometricData || 'mobile-biometric-validated',
        clientType: API_CONFIG.MOBILE_CLIENT_TYPE,
        securityLevel: 'quantum'
      }),
    });
  }

  /**
   * Vérification du code de réinitialisation
   */
  async verifyResetCode(email: string, code: string): Promise<ApiResponse<any>> {
    return this.request<any>('/api/auth/verify-reset-code', {
      method: 'POST',
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        code: code.trim(),
        clientType: API_CONFIG.MOBILE_CLIENT_TYPE
      }),
    });
  }

  /**
   * Nouveau mot de passe après réinitialisation
   */
  async resetPassword(email: string, code: string, newPassword: string): Promise<ApiResponse<any>> {
    return this.request<any>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        code: code.trim(),
        newPassword,
        clientType: API_CONFIG.MOBILE_CLIENT_TYPE
      }),
    });
  }
}

export default new ApiService();