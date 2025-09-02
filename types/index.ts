// Core Types
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  success: boolean;
}

// Word Types
export interface Word {
  id: string;
  word: string;
  meaning: string;
  example_sentence?: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  created_at: string;
  updated_at: string;
}

export interface WordOfTheDay {
  id: string;
  word_id: string;
  word: string;
  definition: string;
  example: string;
  scheduled_date: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  id: string;
  word: string;
  meaning: string;
  relevance: number;
  category?: string;
}

export interface WordSearchResult {
  id: string;
  word: string;
  meaning: string;
  relevance: number;
  category?: string;
}

// User Progress Types
export interface UserProgress {
  id: string;
  user_id: string;
  word_id: string;
  mastery_level: number;
  review_count: number;
  last_reviewed: string;
  next_review: string;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  experience_points: number;
  level: number;
  total_words_learned: number;
  current_streak: number;
  longest_streak: number;
  quiz_score: number;
  created_at: string;
  updated_at: string;
}

// Achievement Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  requirement: string;
  experience_reward: number;
  icon?: string;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement: Achievement;
}

export interface LevelInfo {
  level: number;
  experience_required: number;
  title: string;
  rewards: string[];
}

// Community Types
export interface CommunityContribution {
  id: string;
  user_id: string;
  word: string;
  meaning: string;
  context?: string;
  content_type: 'word' | 'translation' | 'example';
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  moderator_notes?: string;
  moderator_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ModerationResult {
  id: string;
  contribution_id: string;
  moderator_id: string;
  action: 'approve' | 'reject' | 'request_changes';
  notes?: string;
  created_at: string;
}

export interface ModerationStats {
  total_pending: number;
  total_approved: number;
  total_rejected: number;
  average_processing_time: number;
  moderator_performance?: {
    moderator_id: string;
    moderator_name: string;
    contributions_processed: number;
    average_processing_time: number;
  }[];
}

// Security Types
export interface SecurityEvent {
  id: string;
  user_id?: string;
  event_type: string;
  event_data: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface EventType {
  LOGIN_SUCCESS: 'login_success';
  LOGIN_FAILURE: 'login_failure';
  LOGOUT: 'logout';
  PASSWORD_CHANGE: 'password_change';
  MFA_ENABLED: 'mfa_enabled';
  MFA_DISABLED: 'mfa_disabled';
  SUSPICIOUS_ACTIVITY: 'suspicious_activity';
}

export interface EventSeverity {
  LOW: 'low';
  MEDIUM: 'medium';
  HIGH: 'high';
  CRITICAL: 'critical';
}

export interface ThreatLevel {
  LOW: 'low';
  MEDIUM: 'medium';
  HIGH: 'high';
  CRITICAL: 'critical';
}

export interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: string;
  threat_level: string;
  created_at: string;
  resolved_at?: string;
}

export interface SecurityReport {
  id: string;
  user_id: string;
  report_type: string;
  description: string;
  status: string;
  priority: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportType {
  SECURITY_BREACH: 'security_breach';
  SUSPICIOUS_ACTIVITY: 'suspicious_activity';
  DATA_LEAK: 'data_leak';
  MALWARE: 'malware';
  PHISHING: 'phishing';
}

export interface ReportStatus {
  OPEN: 'open';
  IN_PROGRESS: 'in_progress';
  RESOLVED: 'resolved';
  CLOSED: 'closed';
}

// MFA Types
export interface MFASetupResult {
  secret: string;
  qr_code: string;
  backup_codes: string[];
}

export interface MFAVerificationResult {
  success: boolean;
  backup_codes_remaining: number;
}

export interface BackupCode {
  code: string;
  used: boolean;
  used_at?: string;
}

// Notification Types
export interface NotificationSettings {
  push_enabled: boolean;
  email_enabled: boolean;
  daily_reminders: boolean;
  weekly_summary: boolean;
  security_alerts: boolean;
  word_of_day: boolean;
  quiz_reminders: boolean;
}

export interface PushNotification {
  title: string;
  body: string;
  data?: any;
}

// Translation Types
export interface TranslationResult<T = any> {
  data: T;
  success: boolean;
  error?: string;
}

export interface TranslationSource {
  id: string;
  name: string;
  url: string;
  reliability: number;
}

export interface Language {
  code: string;
  name: string;
  native_name: string;
}

// Scraping Types
export interface ScrapedContent {
  id: string;
  source: string;
  content: string;
  metadata: any;
  created_at: string;
}

export interface ScrapingSource {
  id: string;
  name: string;
  url: string;
  type: 'website' | 'api' | 'database';
  config: any;
}

export interface ScrapingConfig {
  enabled: boolean;
  interval: number;
  max_items: number;
  filters: any;
}

// Login Attempt Types
export interface LoginAttempt {
  id: string;
  user_id?: string;
  email: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  created_at: string;
}

export interface LoginAttemptConfig {
  maxAttempts: number;
  lockoutDuration: number;
  resetAfterSuccess: boolean;
  trackIPAddress: boolean;
}

// Session Types
export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface SessionConfig {
  maxSessions: number;
  sessionTimeout: number;
  extendOnActivity: boolean;
}

// Alert Types
export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  severity: string;
  channels: string[];
  enabled: boolean;
}

export interface Alert {
  id: string;
  rule_id: string;
  title: string;
  message: string;
  severity: string;
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
}

export interface AlertSeverity {
  INFO: 'info';
  WARNING: 'warning';
  ERROR: 'error';
  CRITICAL: 'critical';
}

export interface AlertChannel {
  EMAIL: 'email';
  PUSH: 'push';
  SLACK: 'slack';
  WEBHOOK: 'webhook';
}

// User Behavior Types
export interface UserBehavior {
  id: string;
  user_id: string;
  action: string;
  context: any;
  timestamp: string;
}

export interface LoginPattern {
  id: string;
  user_id: string;
  time_of_day: string;
  day_of_week: string;
  ip_address: string;
  device_type: string;
  frequency: number;
}

// Quiz Types
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizSession {
  id: string;
  user_id: string;
  level: string;
  score: number;
  total_questions: number;
  completed_at: string;
  created_at: string;
}