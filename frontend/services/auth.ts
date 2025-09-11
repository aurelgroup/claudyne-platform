/**
 * Service d'authentification Claudyne
 * Gestion des appels API d'auth
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Configuration de base
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Interface pour les réponses API
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

// Interface pour les credentials de connexion
interface LoginCredentials {
  credential: string; // email ou téléphone
  password: string;
}

// Interface pour les données d'inscription
interface RegisterData {
  email?: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName: string;
  familyName: string;
  city?: string;
  region?: string;
  acceptTerms: boolean;
}

// Interface pour la réponse de connexion/inscription
interface AuthResponse {
  user: {
    id: string;
    email?: string;
    phone?: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: string;
    userType: string;
    familyId?: string;
    isVerified: boolean;
    language: string;
    timezone: string;
    lastLoginAt?: string;
  };
  family?: {
    id: string;
    name: string;
    displayName: string;
    status: string;
    subscriptionType: string;
    trialEndsAt?: string;
    subscriptionEndsAt?: string;
    walletBalance: number;
    totalClaudinePoints: number;
    claudineRank?: number;
    studentsCount: number;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
  warnings?: string[];
  trial?: {
    daysLeft: number;
    features: string[];
  };
}

class AuthService {
  private api: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 secondes (adapté aux connexions lentes)
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Intercepteur de requête pour ajouter le token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('claudyne_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Intercepteur de réponse pour gérer les erreurs d'auth
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Si erreur 401 et pas déjà en cours de retry
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.handleTokenRefresh();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.api.request(originalRequest);
            }
          } catch (refreshError) {
            // Redirection vers la page de connexion
            if (typeof window !== 'undefined') {
              localStorage.removeItem('claudyne_token');
              localStorage.removeItem('claudyne_refresh_token');
              window.location.href = '/';
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Gestion du refresh token
  private async handleTokenRefresh(): Promise<string | null> {
    // Éviter les requêtes multiples de refresh
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    const refreshToken = localStorage.getItem('claudyne_refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken
      });

      const newToken = response.data.data.accessToken;
      localStorage.setItem('claudyne_token', newToken);
      
      return newToken;
    } catch (error) {
      localStorage.removeItem('claudyne_token');
      localStorage.removeItem('claudyne_refresh_token');
      throw error;
    }
  }

  // Connexion
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await this.api.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Inscription
  async register(userData: RegisterData): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await this.api.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Déconnexion
  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      // Même si l'API échoue, on procède à la déconnexion locale
      console.warn('Erreur lors de la déconnexion API:', error);
    }
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Récupération du profil utilisateur
  async getProfile(): Promise<{ user: any; family: any }> {
    try {
      const response = await this.api.get('/me');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Demande de réinitialisation de mot de passe
  async forgotPassword(credential: string): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/auth/forgot-password', {
        credential
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Réinitialisation de mot de passe
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/auth/reset-password', {
        token,
        password: newPassword
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Vérification d'email
  async verifyEmail(token: string): Promise<ApiResponse> {
    try {
      const response = await this.api.get(`/auth/verify-email/${token}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Demande de renvoi d'email de vérification
  async resendVerificationEmail(): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/auth/resend-verification');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Changement de mot de passe
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Configuration 2FA
  async enable2FA(): Promise<ApiResponse<{ qrCode: string; secret: string }>> {
    try {
      const response = await this.api.post('/auth/2fa/enable');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Vérification 2FA
  async verify2FA(code: string): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/auth/2fa/verify', { code });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Désactivation 2FA
  async disable2FA(code: string): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/auth/2fa/disable', { code });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Gestion des erreurs
  private handleError(error: any): Error {
    if (error.response) {
      // Erreur de réponse du serveur
      const { data, status } = error.response;
      
      // Gestion des erreurs spécifiques
      switch (status) {
        case 400:
          return new Error(data.message || 'Données invalides');
        case 401:
          return new Error('Identifiants invalides ou session expirée');
        case 403:
          return new Error('Accès refusé');
        case 409:
          return new Error(data.message || 'Conflit de données');
        case 422:
          return new Error(data.message || 'Données invalides');
        case 423:
          return new Error('Compte temporairement verrouillé');
        case 429:
          return new Error('Trop de tentatives. Réessayez plus tard.');
        case 500:
          return new Error('Erreur serveur. Veuillez réessayer.');
        default:
          return new Error(data.message || `Erreur ${status}`);
      }
    } else if (error.request) {
      // Erreur réseau
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return new Error('Connexion lente détectée. Veuillez patienter...');
      }
      return new Error('Problème de connexion. Vérifiez votre connexion internet.');
    } else {
      // Autre erreur
      return new Error(error.message || 'Erreur inattendue');
    }
  }

  // Méthode pour configurer les intercepteurs depuis le contexte
  setupInterceptors(
    getToken: () => string | null,
    refreshTokenHandler: () => Promise<string | null>
  ): number {
    return this.api.interceptors.request.use(
      (config) => {
        const token = getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  // Nettoyage des intercepteurs
  cleanupInterceptors(interceptorId: number): void {
    this.api.interceptors.request.eject(interceptorId);
  }

  // Vérification de l'état de la connexion
  async checkConnection(): Promise<boolean> {
    try {
      await this.api.get('/health', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Récupération des statistiques d'utilisation
  async getUsageStats(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/stats');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Mise à jour du profil utilisateur
  async updateProfile(profileData: Partial<{
    firstName: string;
    lastName: string;
    avatar: string;
    language: string;
    timezone: string;
    notificationPreferences: any;
  }>): Promise<ApiResponse> {
    try {
      const response = await this.api.patch('/me', profileData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Upload d'avatar
  async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await this.api.post('/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }
}

// Instance singleton
export const authService = new AuthService();

// Export par défaut
export default authService;