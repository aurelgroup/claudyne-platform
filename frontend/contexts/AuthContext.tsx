/**
 * Contexte d'authentification Claudyne
 * Gère l'état utilisateur et les opérations d'auth
 */

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

// Services
import { authService } from '../services/auth';

// Types
export interface User {
  id: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'PARENT' | 'STUDENT' | 'ADMIN' | 'MODERATOR';
  userType: 'MANAGER' | 'LEARNER' | 'STUDENT';
  familyId?: string;
  isVerified: boolean;
  language: string;
  timezone: string;
  lastLoginAt?: string;
}

export interface Family {
  id: string;
  name: string;
  displayName: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED';
  subscriptionType: 'TRIAL' | 'BASIC' | 'PREMIUM' | 'FAMILY_PLUS';
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
  walletBalance: number;
  totalClaudinePoints: number;
  claudineRank?: number;
  studentsCount: number;
}

export interface AuthState {
  user: User | null;
  family: Family | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface LoginCredentials {
  credential: string; // email ou téléphone
  password: string;
}

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

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
}

// Actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; family?: Family } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'UPDATE_FAMILY'; payload: Partial<Family> }
  | { type: 'CLEAR_ERROR' };

// État initial
const initialState: AuthState = {
  user: null,
  family: null,
  isLoading: true,
  isAuthenticated: false,
  error: null
};

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
      
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        family: action.payload.family || null,
        isLoading: false,
        isAuthenticated: true,
        error: null
      };
      
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        family: null,
        isLoading: false,
        isAuthenticated: false,
        error: action.payload
      };
      
    case 'AUTH_LOGOUT':
      return {
        ...initialState,
        isLoading: false
      };
      
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null
      };
      
    case 'UPDATE_FAMILY':
      return {
        ...state,
        family: state.family ? { ...state.family, ...action.payload } : null
      };
      
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
      
    default:
      return state;
  }
}

// Context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Provider Component
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  // Fonction de connexion
  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authService.login(credentials);
      
      // Stockage du token
      localStorage.setItem('claudyne_token', response.data.tokens.accessToken);
      localStorage.setItem('claudyne_refresh_token', response.data.tokens.refreshToken);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.data.user as User,
          family: response.data.family as Family
        }
      });
      
      // Affichage des avertissements si présents
      if (response.data.warnings && response.data.warnings.length > 0) {
        response.data.warnings.forEach((warning: string) => {
          toast(warning, {
            icon: '⚠️',
            duration: 6000
          });
        });
      }
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur de connexion';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Fonction d'inscription
  const register = async (userData: RegisterData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authService.register(userData);
      
      // Stockage du token
      localStorage.setItem('claudyne_token', response.data.tokens.accessToken);
      localStorage.setItem('claudyne_refresh_token', response.data.tokens.refreshToken);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.data.user as User,
          family: response.data.family as Family
        }
      });
      
      // Message de bienvenue spécial pour les nouveaux utilisateurs
      toast.success(`🎉 Bienvenue dans la famille Claudyne, ${response.data.user.firstName} !`, {
        duration: 5000
      });
      
      // Information sur la période d'essai
      if (response.data.trial) {
        toast(`🎁 ${response.data.trial.daysLeft} jours d'essai gratuit activés !`, {
          icon: '✨',
          duration: 4000
        });
      }
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création du compte';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      // Appel API de déconnexion (optionnel)
      await authService.logout();
      
    } catch (error) {
      console.warn('Erreur lors de la déconnexion API:', error);
    } finally {
      // Nettoyage local (toujours effectué)
      localStorage.removeItem('claudyne_token');
      localStorage.removeItem('claudyne_refresh_token');
      
      dispatch({ type: 'AUTH_LOGOUT' });
      
      // Redirection vers la page de connexion
      router.push('/');
      
      toast('👋 À bientôt sur Claudyne !', {
        icon: '🌟',
        duration: 3000
      });
    }
  };

  // Fonction de rafraîchissement de l'authentification
  const refreshAuth = async () => {
    try {
      const token = localStorage.getItem('claudyne_token');
      
      if (!token) {
        dispatch({ type: 'AUTH_LOGOUT' });
        return;
      }
      
      dispatch({ type: 'AUTH_START' });
      
      const response = await authService.getProfile();
      
      dispatch({ 
        type: 'AUTH_SUCCESS', 
        payload: {
          user: response.user,
          family: response.family
        }
      });
      
    } catch (error: any) {
      console.warn('Erreur rafraîchissement auth:', error);
      
      // Tentative de refresh token
      try {
        const refreshToken = localStorage.getItem('claudyne_refresh_token');
        
        if (refreshToken) {
          const refreshResponse = await authService.refreshToken(refreshToken);
          localStorage.setItem('claudyne_token', refreshResponse.data.accessToken);
          
          // Nouvelle tentative de récupération du profil
          const profileResponse = await authService.getProfile();
          dispatch({ 
            type: 'AUTH_SUCCESS', 
            payload: {
              user: profileResponse.user,
              family: profileResponse.family
            }
          });
          
          return;
        }
      } catch (refreshError) {
        console.warn('Erreur refresh token:', refreshError);
      }
      
      // Si tout échoue, déconnexion
      localStorage.removeItem('claudyne_token');
      localStorage.removeItem('claudyne_refresh_token');
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Fonction de mise à jour utilisateur
  const updateUser = (userData: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  // Fonction pour effacer les erreurs
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Initialisation lors du montage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('claudyne_token');
      
      if (token) {
        await refreshAuth();
      } else {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };
    
    initializeAuth();
  }, []);

  // Intercepteur pour gérer l'expiration du token automatiquement
  useEffect(() => {
    const interceptor = authService.setupInterceptors(
      () => {
        const token = localStorage.getItem('claudyne_token');
        return token;
      },
      async () => {
        try {
          const refreshToken = localStorage.getItem('claudyne_refresh_token');
          if (refreshToken) {
            const response = await authService.refreshToken(refreshToken);
            localStorage.setItem('claudyne_token', response.data.accessToken);
            return response.data.accessToken;
          }
        } catch (error) {
          logout();
        }
        return null;
      }
    );
    
    return () => {
      // Nettoyage de l'intercepteur si nécessaire
      authService.cleanupInterceptors(interceptor);
    };
  }, []);

  // Gestion des erreurs réseau
  useEffect(() => {
    if (state.error) {
      // Auto-clear des erreurs après 5 secondes
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [state.error]);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshAuth,
    updateUser,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personnalisé
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  
  return context;
}

// Hook pour vérifier les permissions
export function usePermissions() {
  const { user, family } = useAuth();
  
  return {
    canManageFamily: user?.userType === 'MANAGER',
    canAccessAdmin: user?.role && ['ADMIN', 'MODERATOR'].includes(user.role),
    canParticipateInBattles: user?.role !== 'ADMIN',
    hasActiveSubscription: family?.status === 'ACTIVE' || family?.status === 'TRIAL',
    isOnTrial: family?.status === 'TRIAL',
    isPremium: family?.subscriptionType && ['PREMIUM', 'FAMILY_PLUS'].includes(family.subscriptionType)
  };
}

// Hook pour les informations sur l'abonnement
export function useSubscription() {
  const { family } = useAuth();
  
  if (!family) return null;
  
  const now = new Date();
  const expiryDate = family.subscriptionEndsAt ? new Date(family.subscriptionEndsAt) :
                     family.trialEndsAt ? new Date(family.trialEndsAt) : null;
  
  const daysUntilExpiry = expiryDate ? 
    Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  
  return {
    family,
    isActive: family.status === 'ACTIVE' || family.status === 'TRIAL',
    isExpired: family.status === 'EXPIRED',
    isOnTrial: family.status === 'TRIAL',
    subscriptionType: family.subscriptionType,
    daysUntilExpiry,
    needsRenewal: daysUntilExpiry !== null && daysUntilExpiry <= 3,
    expiryDate,
    walletBalance: family.walletBalance,
    claudinePoints: family.totalClaudinePoints,
    claudineRank: family.claudineRank
  };
}