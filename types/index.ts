// Database Types - Unified Schema
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      slang_words: {
        Row: SlangWord;
        Insert: Omit<SlangWord, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SlangWord, 'id' | 'created_at' | 'updated_at'>>;
      };
      word_of_the_day: {
        Row: WordOfTheDay;
        Insert: Omit<WordOfTheDay, 'id' | 'created_at'>;
        Update: Partial<Omit<WordOfTheDay, 'id' | 'created_at'>>;
      };
      user_progress: {
        Row: UserProgress;
        Insert: Omit<UserProgress, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProgress, 'id' | 'created_at' | 'updated_at'>>;
      };
      quiz_sessions: {
        Row: QuizSession;
        Insert: Omit<QuizSession, 'id' | 'created_at'>;
        Update: Partial<Omit<QuizSession, 'id' | 'created_at'>>;
      };
      quiz_answers: {
        Row: QuizAnswer;
        Insert: Omit<QuizAnswer, 'id' | 'created_at'>;
        Update: Partial<Omit<QuizAnswer, 'id' | 'created_at'>>;
      };
      favorite_words: {
        Row: FavoriteWord;
        Insert: Omit<FavoriteWord, 'id' | 'added_at'>;
        Update: Partial<Omit<FavoriteWord, 'id' | 'added_at'>>;
      };
      daily_words: {
        Row: DailyWord;
        Insert: Omit<DailyWord, 'id' | 'created_at'>;
        Update: Partial<Omit<DailyWord, 'id' | 'created_at'>>;
      };
      community_contributions: {
        Row: CommunityContribution;
        Insert: Omit<CommunityContribution, 'id' | 'created_at'>;
        Update: Partial<Omit<CommunityContribution, 'id' | 'created_at'>>;
      };
      translation_feedback: {
        Row: TranslationFeedback;
        Insert: Omit<TranslationFeedback, 'id' | 'created_at'>;
        Update: Partial<Omit<TranslationFeedback, 'id' | 'created_at'>>;
      };
      user_security: {
        Row: UserSecurity;
        Insert: Omit<UserSecurity, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserSecurity, 'user_id' | 'created_at' | 'updated_at'>>;
      };
      auth_audit_log: {
        Row: AuthAuditLog;
        Insert: Omit<AuthAuditLog, 'id' | 'created_at'>;
        Update: Partial<Omit<AuthAuditLog, 'id' | 'created_at'>>;
      };
      security_reports: {
        Row: SecurityReport;
        Insert: Omit<SecurityReport, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SecurityReport, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}

// Core Types - Updated to match database schema
export interface SlangWord {
  id: string;
  word: string;
  meaning: string | null;
  example?: string | null;
  audio_url?: string | null;
  difficulty: string | null;
  category?: string | null;
  word_of_the_day_id?: string | null;
  definition?: string; // Legacy column
  created_at: string | null;
  updated_at: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  email_verified: boolean;
  last_activity_at: string;
  login_count: number;
  last_login_ip: string | null;
  account_status: 'active' | 'suspended' | 'deleted';
  role: 'user' | 'admin' | 'moderator';
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  level: number | null;
  totalPoints: number | null;
  currentStreak: number | null;
  longestStreak: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UserProgress {
  id?: string;
  user_id: string;
  word_id: string;
  mastery_level: number | null; // 0-100
  times_reviewed: number | null;
  correct_answers: number | null;
  incorrect_answers: number | null;
  last_reviewed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
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
  user_id: string;
  session_type: string;
  total_questions: number;
  correct_answers: number;
  total_score: number;
  completed_at: string | null;
  created_at: string;
}

export interface QuizAnswer {
  id: string;
  session_id: string;
  word_id: string;
  question_text: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  confidence_score: number | null;
  response_time_ms: number | null;
  created_at: string;
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
  word_id: string | null;
  word: string;
  definition: string;
  example: string | null;
  scheduled_date: string;
  date: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface FavoriteWord {
  id: string;
  user_id: string;
  word_id: string;
  added_at: string;
}

export interface DailyWord {
  id: string;
  word_id: string;
  scheduled_date: string;
  created_at: string;
}

export interface CommunityContribution {
  id: string;
  user_id: string;
  submitted_word: string;
  submitted_meaning: string;
  context_example: string | null;
  status: 'pending' | 'approved' | 'rejected';
  moderator_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface TranslationFeedback {
  id: string;
  user_id: string;
  original_text: string;
  translation: string;
  target_language: 'formal' | 'slang';
  feedback_type: 'correct' | 'incorrect' | 'partially_correct';
  user_correction: string | null;
  notes: string | null;
  created_at: string;
}

export interface UserSecurity {
  user_id: string;
  pin_hash: string | null;
  pin_set_at: string | null;
  pin_try_count: number;
  locked_until: string | null;
  last_pin_check: string | null;
  password_changed_at: string;
  failed_login_attempts: number;
  mfa_enabled: boolean;
  mfa_secret: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthAuditLog {
  id: string;
  user_id: string | null;
  event_type: string;
  event_data: any | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface SecurityReport {
  id: string;
  report_id: string;
  report_type: string;
  title: string;
  description: string | null;
  data: any;
  generated_at: string;
  period_start: string;
  period_end: string;
  summary: any;
  created_at: string;
  updated_at: string;
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

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  success: boolean;
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

// Search types
export interface SearchResult {
  word: SlangWord;
  relevance: number;
  matchType: 'exact' | 'partial' | 'fuzzy';
}