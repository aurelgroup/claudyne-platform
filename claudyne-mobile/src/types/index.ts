/**
 * Types TypeScript pour Claudyne
 * Plateforme éducative camerounaise
 */

// ============================================================================
// USER & AUTH TYPES
// ============================================================================
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  grade?: Grade;
  school?: string;
  region?: CameroonRegion;
  createdAt: string;
  lastLoginAt?: string;
}

export type UserRole = 'student' | 'teacher' | 'parent' | 'admin';

export type Grade =
  | 'SIL' | 'CP' | 'CE1' | 'CE2' | 'CM1' | 'CM2'
  | '6ème' | '5ème' | '4ème' | '3ème'
  | '2nde' | '1ère' | 'Tle';

export type CameroonRegion =
  | 'Adamawa' | 'Centre' | 'East' | 'Far North' | 'Littoral'
  | 'North' | 'Northwest' | 'South' | 'Southwest' | 'West';

export interface LoginCredentials {
  credential: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  grade?: Grade;
  phoneNumber?: string;
}

// ============================================================================
// LESSON TYPES
// ============================================================================
export interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  grade: Grade;
  isActive: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  grade: Grade;
  duration: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  content: LessonContent;
  exercises: Exercise[];
  isCompleted?: boolean;
  progress?: number; // 0-100
  createdAt: string;
}

export interface LessonContent {
  type: 'text' | 'video' | 'audio' | 'interactive';
  data: string;
  resources?: string[];
}

export interface Exercise {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'essay';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

// ============================================================================
// BATTLE ROYALE TYPES
// ============================================================================
export interface Battle {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  grade: Grade;
  maxParticipants: number;
  currentParticipants: number;
  status: BattleStatus;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  prize: BattlePrize;
  questions: BattleQuestion[];
  participants: BattleParticipant[];
  createdAt: string;
}

export type BattleStatus = 'waiting' | 'active' | 'completed' | 'cancelled';

export interface BattlePrize {
  type: 'points' | 'badge' | 'certificate' | 'physical';
  value: number;
  description: string;
}

export interface BattleQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number; // seconds
  points: number;
}

export interface BattleParticipant {
  userId: string;
  userName: string;
  avatar?: string;
  score: number;
  rank: number;
  answeredCount: number;
  isActive: boolean;
}

// ============================================================================
// MENTOR IA TYPES
// ============================================================================
export interface MentorMessage {
  id: string;
  type: 'user' | 'mentor';
  content: string;
  timestamp: string;
  isTyping?: boolean;
}

export interface MentorSession {
  id: string;
  userId: string;
  subject?: string;
  startTime: string;
  endTime?: string;
  messages: MentorMessage[];
  summary?: string;
}

export type MentorPersonality = 'encouraging' | 'strict' | 'friendly' | 'professional';

// ============================================================================
// NAVIGATION TYPES
// ============================================================================
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  LessonDetail: { lessonId: string };
  BattleDetail: { battleId: string };
  Notifications: undefined;
  Settings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Lessons: undefined;
  Battles: undefined;
  Mentor: undefined;
  Profile: undefined;
};

// ============================================================================
// API TYPES
// ============================================================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============================================================================
// APP STATE TYPES
// ============================================================================
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  settings: AppSettings;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'fr' | 'en';
  notifications: {
    battles: boolean;
    lessons: boolean;
    mentor: boolean;
    general: boolean;
  };
  privacy: {
    shareProgress: boolean;
    showOnline: boolean;
  };
}