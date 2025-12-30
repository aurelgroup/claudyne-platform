/**
 * Service API général Claudyne
 * Gestion de tous les appels API de l'application
 */

import axios, { AxiosInstance } from 'axios';

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

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
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

    // Intercepteur de réponse pour gérer les erreurs
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('claudyne_token');
          localStorage.removeItem('claudyne_refresh_token');
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );
  }

  // Gestion des erreurs
  private handleError(error: any): Error {
    if (error.response) {
      const { data, status } = error.response;
      switch (status) {
        case 400:
          return new Error(data.message || 'Données invalides');
        case 401:
          return new Error('Session expirée. Veuillez vous reconnecter.');
        case 403:
          return new Error('Accès refusé');
        case 404:
          return new Error(data.message || 'Ressource non trouvée');
        case 409:
          return new Error(data.message || 'Conflit de données');
        case 500:
          return new Error('Erreur serveur. Veuillez réessayer.');
        default:
          return new Error(data.message || `Erreur ${status}`);
      }
    } else if (error.request) {
      return new Error('Problème de connexion. Vérifiez votre connexion internet.');
    } else {
      return new Error(error.message || 'Erreur inattendue');
    }
  }

  // ========== SUBJECTS / MATIÈRES ==========
  async getSubjects(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/subjects');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getSubject(subjectId: string): Promise<ApiResponse> {
    try {
      const response = await this.api.get(`/subjects/${subjectId}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getSubjectLessons(subjectId: string): Promise<ApiResponse> {
    try {
      const response = await this.api.get(`/subjects/${subjectId}/lessons`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ========== LESSONS / LEÇONS ==========
  async getLesson(subjectId: string | number, lessonId: string | number): Promise<ApiResponse> {
    try {
      const response = await this.api.get(`/subjects/${subjectId}/lessons/${lessonId}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async markLessonComplete(subjectId: string | number, lessonId: string | number, data?: any): Promise<ApiResponse> {
    try {
      const response = await this.api.post(`/lessons/${lessonId}/complete`, data || {});
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ========== QUIZ ==========
  async getQuiz(subjectId: string | number, lessonId: string | number): Promise<ApiResponse> {
    try {
      const response = await this.api.get(`/subjects/${subjectId}/lessons/${lessonId}/quiz`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async submitQuiz(subjectId: string | number, lessonId: string | number, answers: any, timeSpent?: number): Promise<ApiResponse> {
    try {
      const response = await this.api.post(`/subjects/${subjectId}/lessons/${lessonId}/quiz`, { answers, timeSpent });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getQuizById(quizId: string | number): Promise<ApiResponse> {
    try {
      const response = await this.api.get(`/lessons/${quizId}/quiz`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getAvailableQuizzes(params?: { subjectId?: string; difficulty?: string; limit?: number }): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/quiz/available', { params });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getQuizStats(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/quiz/stats');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ========== PROGRESS / PROGRESSION ==========
  async getProgress(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/progress');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getStudentProgress(studentId: string): Promise<ApiResponse> {
    try {
      const response = await this.api.get(`/students/${studentId}/progress`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getStudentAnalytics(studentId: string): Promise<ApiResponse> {
    try {
      const response = await this.api.get(`/students/${studentId}/analytics`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ========== ACHIEVEMENTS / RÉCOMPENSES ==========
  async getAchievements(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/students/achievements');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getStudentStatistics(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/students/profile');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ========== STUDENTS / ÉTUDIANTS ==========
  async getStudents(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/students');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getStudent(studentId: string): Promise<ApiResponse> {
    try {
      const response = await this.api.get(`/students/${studentId}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async createStudent(studentData: any): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/students', studentData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async updateStudent(studentId: string, studentData: any): Promise<ApiResponse> {
    try {
      const response = await this.api.put(`/students/${studentId}`, studentData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getStudentDashboard(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/students/dashboard');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getStudentSubjects(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/students/subjects');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getStudentSettings(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/students/settings');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async updateStudentSettings(settings: any): Promise<ApiResponse> {
    try {
      const response = await this.api.put('/students/settings', settings);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async changeStudentPassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/students/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getStudentProfile(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/students/profile');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ========== SUBSCRIPTIONS / ABONNEMENTS ==========
  async getSubscriptionPlans(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/payments/subscriptions/plans');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getPaymentMethods(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/payments/methods');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async initializePayment(paymentData: any): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/payments/initialize', paymentData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getPaymentStatus(transactionId: string): Promise<ApiResponse> {
    try {
      const response = await this.api.get(`/payments/${transactionId}/status`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async topUpWallet(amount: number, paymentMethod: string, phone?: string): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/payments/wallet/topup', { amount, paymentMethod, phone });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getPaymentHistory(params?: { page?: number; limit?: number; status?: string; type?: string }): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/payments/history', { params });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ========== REVISIONS ==========
  async getRevisions(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/revisions');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async generateRevisionPlan(data: { subjectId?: string; examDate?: string; topics?: string[] }): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/revisions/generate', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getRevisionSheet(sheetId: string): Promise<ApiResponse> {
    try {
      const response = await this.api.get(`/revisions/sheets/${sheetId}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ========== ORIENTATION ==========
  async getOrientationRecommendations(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/orientation/recommendations');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getCareerPaths(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/orientation/careers');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getInstitutions(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/orientation/institutions');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ========== WELLNESS / BIEN-ÊTRE ==========
  async getWellnessStats(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/wellness/stats');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async logStudySession(sessionData: any): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/wellness/study-session', sessionData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getSmartBreakSuggestion(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/wellness/smart-break');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ========== COMMUNITY / COMMUNAUTÉ ==========
  async getCommunityStudyGroups(params?: { level?: string; subject?: string }): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/community/study-groups', { params });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async joinStudyGroup(groupId: string): Promise<ApiResponse> {
    try {
      const response = await this.api.post(`/community/study-groups/${groupId}/join`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async leaveStudyGroup(groupId: string): Promise<ApiResponse> {
    try {
      const response = await this.api.post(`/community/study-groups/${groupId}/leave`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getLeaderboard(params?: { region?: string; level?: string; period?: string }): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/community/leaderboard', { params });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getForumPosts(params?: { category?: string; page?: number; limit?: number }): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/community/forum', { params });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async createForumPost(postData: { title: string; content: string; category?: string }): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/community/forum', postData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ========== CHALLENGES / DÉFIS ==========
  async getChallenges(type?: 'daily' | 'weekly' | 'all'): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/quiz/challenges', { params: { type } });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async joinChallenge(challengeId: string): Promise<ApiResponse> {
    try {
      const response = await this.api.post(`/quiz/challenges/${challengeId}/join`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ========== BATTLES ==========
  async getBattles(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/battles');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async joinBattle(battleId: string): Promise<ApiResponse> {
    try {
      const response = await this.api.post(`/battles/${battleId}/join`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ========== NOTIFICATIONS ==========
  async getNotifications(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/notifications');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async markNotificationRead(notificationId: string): Promise<ApiResponse> {
    try {
      const response = await this.api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async markAllNotificationsRead(): Promise<ApiResponse> {
    try {
      const response = await this.api.put('/notifications/read-all');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ========== MENTOR IA ==========
  async sendMentorMessage(message: string, context?: any): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/mentor/chat', { message, context });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getMentorHistory(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/mentor/history');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ========== PRIX CLAUDINE ==========
  async getPrixClaudineInfo(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/prix-claudine');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getPrixClaudineRanking(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/prix-claudine/ranking');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async registerForPrixClaudine(): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/prix-claudine/register');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ========== FAMILY / FAMILLE ==========
  async getFamily(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/families/me');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async updateFamily(familyData: any): Promise<ApiResponse> {
    try {
      const response = await this.api.put('/families/me', familyData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ========== STATS / STATISTIQUES ==========
  async getStats(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/stats');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }
}

// Instance singleton
export const apiService = new ApiService();

// Export par défaut
export default apiService;
