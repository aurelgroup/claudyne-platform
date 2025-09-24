/**
 * Configuration et constantes pour Claudyne
 * Plateforme éducative camerounaise
 */

// Déclaration de la variable globale __DEV__ pour TypeScript
declare const __DEV__: boolean;

export const API_CONFIG = {
  BASE_URL: __DEV__
    ? 'http://localhost:3001'           // API unifiée locale
    : 'https://api.claudyne.com',       // API unifiée production
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  MOBILE_CLIENT_TYPE: 'mobile',
};

export const THEME_CONSTANTS = {
  COLORS: {
    // Glassmorphism Dark Theme - Claudyne Web
    PRIMARY: '#020205',                 // Dark background
    SECONDARY: '#00FFC2',               // Accent 1 - Cyan
    ACCENT: '#FF57E3',                  // Accent 2 - Magenta
    BACKGROUND: '#020205',              // Dark background
    SURFACE: 'rgba(255, 255, 255, 0.02)', // Glass surface
    ERROR: '#FF4444',                   // Rouge
    WARNING: '#FFC947',                 // Accent 3 - Yellow
    INFO: '#00FFC2',                    // Cyan
    SUCCESS: '#00FFC2',                 // Cyan
    TEXT_PRIMARY: '#f0f0f0',            // Light text
    TEXT_SECONDARY: 'rgba(255, 255, 255, 0.7)', // Semi-transparent
    TEXT_DISABLED: 'rgba(255, 255, 255, 0.4)',  // More transparent
    DIVIDER: 'rgba(255, 255, 255, 0.05)', // Glass border
    CAMEROON_GREEN: '#007A3D',          // Vert camerounais adapté
    CAMEROON_RED: '#CE1126',            // Rouge camerounais
    CAMEROON_YELLOW: '#FFC947',         // Jaune camerounais glassmorphism

    // Glassmorphism specific
    GLASS_BG: 'rgba(255, 255, 255, 0.02)',
    GLASS_BORDER: 'rgba(255, 255, 255, 0.05)',
    ACCENT_1: '#00FFC2',                // Cyan
    ACCENT_2: '#FF57E3',                // Magenta
    ACCENT_3: '#FFC947',                // Yellow
  },
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
    XXL: 48,
  },
  TYPOGRAPHY: {
    H1: { fontSize: 32, fontWeight: 'bold' as const },
    H2: { fontSize: 28, fontWeight: 'bold' as const },
    H3: { fontSize: 24, fontWeight: '600' as const },
    H4: { fontSize: 20, fontWeight: '600' as const },
    BODY: { fontSize: 16, fontWeight: 'normal' as const },
    CAPTION: { fontSize: 14, fontWeight: 'normal' as const },
    SMALL: { fontSize: 12, fontWeight: 'normal' as const },
  },
  RADIUS: {
    SM: 8,
    MD: 12,
    LG: 16,
    XL: 24,
  },
};

export const STORAGE_KEYS = {
  USER_TOKEN: '@claudyne_user_token',
  USER_DATA: '@claudyne_user_data',
  SETTINGS: '@claudyne_settings',
  OFFLINE_DATA: '@claudyne_offline_data',
};

export const SCREEN_NAMES = {
  // Auth Stack
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',

  // Main Tab
  DASHBOARD: 'Dashboard',
  LESSONS: 'Lessons',
  BATTLES: 'Battles',
  MENTOR: 'Mentor',
  PROFILE: 'Profile',

  // Stack Screens
  LESSON_DETAIL: 'LessonDetail',
  BATTLE_DETAIL: 'BattleDetail',
  NOTIFICATIONS: 'Notifications',
  SETTINGS: 'Settings',
} as const;

export const APP_CONFIG = {
  NAME: 'Claudyne',
  VERSION: '1.0.0',
  DESCRIPTION: 'Plateforme éducative camerounaise révolutionnaire',
  COUNTRY: 'Cameroun',
  LANGUAGE: 'fr',
  CURRENCY: 'XAF',
  FEATURES: {
    BATTLE_ROYALE: true,
    AI_MENTOR: true,
    FAMILY_MANAGEMENT: true,
    PRIX_CLAUDINE: true,
    OFFLINE_MODE: true,
    PUSH_NOTIFICATIONS: true,
  },
};