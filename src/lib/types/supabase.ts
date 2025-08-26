export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      slang_words: {
        Row: {
          id: string
          word: string
          meaning: string
          example: string | null
          audio_url: string | null
          difficulty: 'easy' | 'medium' | 'hard'
          category: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          word: string
          meaning: string
          example?: string | null
          audio_url?: string | null
          difficulty: 'easy' | 'medium' | 'hard'
          category?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          word?: string
          meaning?: string
          example?: string | null
          audio_url?: string | null
          difficulty?: 'easy' | 'medium' | 'hard'
          category?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          avatar_url: string | null
          level: number
          total_points: number
          current_streak: number
          longest_streak: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          level?: number
          total_points?: number
          current_streak?: number
          longest_streak?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          level?: number
          total_points?: number
          current_streak?: number
          longest_streak?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_progress: {
        Row: {
          user_id: string
          word_id: string
          mastery_level: number
          times_reviewed: number
          correct_answers: number
          incorrect_answers: number
          last_reviewed_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          word_id: string
          mastery_level?: number
          times_reviewed?: number
          correct_answers?: number
          incorrect_answers?: number
          last_reviewed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          word_id?: string
          mastery_level?: number
          times_reviewed?: number
          correct_answers?: number
          incorrect_answers?: number
          last_reviewed_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "slang_words"
            referencedColumns: ["id"]
          }
        ]
      }
      quiz_sessions: {
        Row: {
          id: string
          user_id: string
          quiz_id: string | null
          score: number
          total_questions: number
          correct_answers: number
          time_spent: number
          completed_at: string | null
          started_at: string
        }
        Insert: {
          id?: string
          user_id: string
          quiz_id?: string | null
          score?: number
          total_questions?: number
          correct_answers?: number
          time_spent?: number
          completed_at?: string | null
          started_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          quiz_id?: string | null
          score?: number
          total_questions?: number
          correct_answers?: number
          time_spent?: number
          completed_at?: string | null
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      achievements: {
        Row: {
          id: string
          name: string
          description: string
          icon_url: string | null
          category: 'learning' | 'streak' | 'quiz' | 'social'
          requirement_type: 'points' | 'streak' | 'words_learned' | 'quizzes_completed'
          requirement_value: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon_url?: string | null
          category: 'learning' | 'streak' | 'quiz' | 'social'
          requirement_type: 'points' | 'streak' | 'words_learned' | 'quizzes_completed'
          requirement_value: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon_url?: string | null
          category?: 'learning' | 'streak' | 'quiz' | 'social'
          requirement_type?: 'points' | 'streak' | 'words_learned' | 'quizzes_completed'
          requirement_value?: number
          created_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          user_id: string
          achievement_id: string
          unlocked_at: string
        }
        Insert: {
          user_id: string
          achievement_id: string
          unlocked_at?: string
        }
        Update: {
          user_id?: string
          achievement_id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          }
        ]
      }
      word_of_the_day: {
        Row: {
          id: string
          word_id: string
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          word_id: string
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          word_id?: string
          date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "word_of_the_day_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "slang_words"
            referencedColumns: ["id"]
          }
        ]
      }
      favorite_words: {
        Row: {
          user_id: string
          word_id: string
          added_at: string
        }
        Insert: {
          user_id: string
          word_id: string
          added_at?: string
        }
        Update: {
          user_id?: string
          word_id?: string
          added_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_words_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_words_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "slang_words"
            referencedColumns: ["id"]
          }
        ]
      }
      search_history: {
        Row: {
          user_id: string
          query: string
          searched_at: string
        }
        Insert: {
          user_id: string
          query: string
          searched_at?: string
        }
        Update: {
          user_id?: string
          query?: string
          searched_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      word_submissions: {
        Row: {
          id: string
          user_id: string
          word: string
          meaning: string
          example: string | null
          status: 'pending' | 'approved' | 'rejected'
          submitted_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          rejection_reason: string | null
        }
        Insert: {
          id?: string
          user_id: string
          word: string
          meaning: string
          example?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          rejection_reason?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          word?: string
          meaning?: string
          example?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          rejection_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "word_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      difficulty_level: 'easy' | 'medium' | 'hard'
      achievement_category: 'learning' | 'streak' | 'quiz' | 'social'
      requirement_type: 'points' | 'streak' | 'words_learned' | 'quizzes_completed'
      submission_status: 'pending' | 'approved' | 'rejected'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}