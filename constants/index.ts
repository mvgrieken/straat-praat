export const COLORS = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  secondary: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  white: '#ffffff',
  black: '#000000',
} as const;

export const FONT_SIZES = {
  '2xs': 10,
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
} as const;

export const SPACING = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
  40: 160,
  48: 192,
  56: 224,
  64: 256,
} as const;

export const BORDER_RADIUS = {
  none: 0,
  sm: 2,
  default: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
} as const;

export const LEVELS = {
  BRONZE: { min: 0, max: 99, name: 'Brons', icon: 'BRONZE' },
  SILVER: { min: 100, max: 299, name: 'Zilver', icon: 'SILVER' },
  GOLD: { min: 300, max: 599, name: 'Goud', icon: 'GOLD' },
  PLATINUM: { min: 600, max: 999, name: 'Platinum', icon: 'PLATINUM' },
  DIAMOND: { min: 1000, max: 1999, name: 'Diamant', icon: 'DIAMOND' },
  MASTER: { min: 2000, max: 9999, name: 'Meester', icon: 'MASTER' },
} as const;

export const QUIZ_SETTINGS = {
  DEFAULT_QUESTIONS: 10,
  DEFAULT_TIME_LIMIT: 300, // 5 minutes in seconds
  MIN_QUESTIONS: 5,
  MAX_QUESTIONS: 20,
  POINTS_PER_CORRECT_ANSWER: 10,
  STREAK_BONUS_MULTIPLIER: 1.5,
  PERFECT_QUIZ_BONUS: 50,
} as const;

export const STREAK_SETTINGS = {
  MIN_DAILY_ACTIVITY: 1, // minimum actions per day to maintain streak
  STREAK_RESET_HOURS: 24, // hours of inactivity before streak resets
  STREAK_BONUS_POINTS: 5, // extra points per day of streak
} as const;

export const DIFFICULTY_LABELS = {
  easy: 'Makkelijk',
  medium: 'Gemiddeld',
  hard: 'Moeilijk',
  adaptive: 'Adaptief',
} as const;

export const CATEGORY_LABELS = {
  general: 'Algemeen',
  gaming: 'Gaming',
  social: 'Sociaal',
  fashion: 'Mode',
  music: 'Muziek',
  sports: 'Sport',
  school: 'School',
  technology: 'Technologie',
} as const;

export const ACHIEVEMENT_CATEGORIES = {
  learning: 'Leren',
  streak: 'Reeks',
  quiz: 'Quiz',
  social: 'Sociaal',
} as const;

export const API_ENDPOINTS = {
  WORDS: '/api/words',
  USERS: '/api/users',
  QUIZ: '/api/quiz',
  PROGRESS: '/api/progress',
  ACHIEVEMENTS: '/api/achievements',
  WORD_OF_DAY: '/api/word-of-day',
  SEARCH: '/api/search',
  FAVORITES: '/api/favorites',
  SUBMISSIONS: '/api/submissions',
} as const;

export const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  SETTINGS: 'app_settings',
  NOTIFICATION_SETTINGS: 'notification_settings',
  SEARCH_HISTORY: 'search_history',
  OFFLINE_DATA: 'offline_data',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  LAST_WORD_OF_DAY: 'last_word_of_day',
} as const;

export const NOTIFICATION_TYPES = {
  WORD_OF_DAY: 'word_of_day',
  STREAK_REMINDER: 'streak_reminder',
  QUIZ_REMINDER: 'quiz_reminder',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  COMMUNITY_UPDATE: 'community_update',
} as const;

export const DEFAULT_NOTIFICATION_SETTINGS = {
  dailyWordEnabled: true,
  dailyWordTime: '10:00',
  streakReminderEnabled: true,
  quizReminderEnabled: true,
  achievementNotificationsEnabled: true,
  updatesEnabled: true,
  doNotDisturbStart: '22:00',
  doNotDisturbEnd: '07:00',
} as const;

export const DEFAULT_APP_SETTINGS = {
  theme: 'system' as const,
  fontSize: 'normal' as const,
  soundEnabled: true,
  vibrationEnabled: true,
  adaptiveLearning: true,
  difficultyLevel: 'adaptive' as const,
  language: 'nl' as const,
} as const;

export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

export const SCREEN_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const AUDIO_SETTINGS = {
  DEFAULT_VOLUME: 1.0,
  FADE_DURATION: 200,
  MAX_RECORDING_DURATION: 30000, // 30 seconds
} as const;

export const SEARCH_SETTINGS = {
  MIN_QUERY_LENGTH: 2,
  MAX_SUGGESTIONS: 5,
  FUZZY_THRESHOLD: 0.6,
  DEBOUNCE_DELAY: 300,
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
