export interface SlangWord {
  id: string;
  word: string;
  meaning: string;
  example?: string;
  audioUrl?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  level: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProgress {
  userId: string;
  wordId: string;
  masteryLevel: number; // 0-100
  timesReviewed: number;
  correctAnswers: number;
  incorrectAnswers: number;
  lastReviewedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number; // in seconds
  pointsPerQuestion: number;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'fill_in_blank' | 'audio_recognition';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  wordId?: string;
  audioUrl?: string | null;
}

export interface QuizSession {
  id: string;
  userId: string;
  quizId: string;
  answers: QuizAnswer[];
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // in seconds
  completedAt?: string;
  startedAt: string;
}

export interface QuizAnswer {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number; // in seconds
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  category: 'learning' | 'streak' | 'quiz' | 'social';
  requirement: {
    type: 'points' | 'streak' | 'words_learned' | 'quizzes_completed';
    value: number;
  };
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: string;
}

export interface WordOfTheDay {
  id: string;
  wordId: string;
  date: string;
  word: SlangWord;
}

export interface FavoriteWord {
  userId: string;
  wordId: string;
  addedAt: string;
}

export interface SearchHistory {
  userId: string;
  query: string;
  searchedAt: string;
}

export interface NotificationSettings {
  userId: string;
  dailyWordEnabled: boolean;
  dailyWordTime: string; // HH:MM format
  streakReminderEnabled: boolean;
  quizReminderEnabled: boolean;
  achievementNotificationsEnabled: boolean;
  updatesEnabled: boolean;
  doNotDisturbStart: string; // HH:MM format
  doNotDisturbEnd: string; // HH:MM format
}

export interface AppSettings {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'normal' | 'large' | 'extra_large';
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  adaptiveLearning: boolean;
  difficultyLevel: 'easy' | 'medium' | 'hard' | 'adaptive';
  language: 'nl' | 'en';
}

export interface WordSubmission {
  id: string;
  userId: string;
  word: string;
  meaning: string;
  example?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface TranslationForm {
  query: string;
  direction: 'slang_to_dutch' | 'dutch_to_slang';
}

export interface QuizForm {
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  timeLimit?: number;
}

export interface ProfileForm {
  displayName: string;
  email?: string;
}

// UI State types
export interface UIState {
  loading: boolean;
  error?: string;
  theme: 'light' | 'dark';
  fontSize: 'small' | 'normal' | 'large' | 'extra_large';
}

export interface NavigationState {
  currentTab: 'home' | 'translate' | 'quiz' | 'profile';
  previousScreen?: string;
}