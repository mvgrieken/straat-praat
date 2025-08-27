export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      community_contributions: {
        Row: {
          context_example: string | null
          created_at: string | null
          id: string
          moderator_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          submitted_meaning: string
          submitted_word: string
          user_id: string
        }
        Insert: {
          context_example?: string | null
          created_at?: string | null
          id?: string
          moderator_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_meaning: string
          submitted_word: string
          user_id: string
        }
        Update: {
          context_example?: string | null
          created_at?: string | null
          id?: string
          moderator_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_meaning?: string
          submitted_word?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_words: {
        Row: {
          created_at: string | null
          id: string
          scheduled_date: string
          word_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          scheduled_date: string
          word_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          scheduled_date?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_words_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          current_streak: number | null
          display_name: string | null
          full_name: string | null
          id: string
          level: number | null
          longest_streak: number | null
          total_points: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          current_streak?: number | null
          display_name?: string | null
          full_name?: string | null
          id: string
          level?: number | null
          longest_streak?: number | null
          total_points?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          current_streak?: number | null
          display_name?: string | null
          full_name?: string | null
          id?: string
          level?: number | null
          longest_streak?: number | null
          total_points?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          confidence_score: number | null
          correct_answer: string
          created_at: string | null
          id: string
          is_correct: boolean
          question_text: string
          response_time_ms: number | null
          session_id: string
          user_answer: string
          word_id: string
        }
        Insert: {
          confidence_score?: number | null
          correct_answer: string
          created_at?: string | null
          id?: string
          is_correct: boolean
          question_text: string
          response_time_ms?: number | null
          session_id: string
          user_answer: string
          word_id: string
        }
        Update: {
          confidence_score?: number | null
          correct_answer?: string
          created_at?: string | null
          id?: string
          is_correct?: boolean
          question_text?: string
          response_time_ms?: number | null
          session_id?: string
          user_answer?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_sessions: {
        Row: {
          completed_at: string | null
          correct_answers: number | null
          created_at: string | null
          id: string
          session_type: string | null
          total_questions: number | null
          total_score: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          id?: string
          session_type?: string | null
          total_questions?: number | null
          total_score?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          id?: string
          session_type?: string | null
          total_questions?: number | null
          total_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      translation_feedback: {
        Row: {
          created_at: string | null
          feedback_type: string
          id: string
          notes: string | null
          original_text: string
          target_language: string
          translation: string
          user_correction: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback_type: string
          id?: string
          notes?: string | null
          original_text: string
          target_language: string
          translation: string
          user_correction?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback_type?: string
          id?: string
          notes?: string | null
          original_text?: string
          target_language?: string
          translation?: string
          user_correction?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          word_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          word_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      user_security: {
        Row: {
          created_at: string | null
          last_pin_check: string | null
          locked_until: string | null
          pin_hash: string | null
          pin_set_at: string | null
          pin_try_count: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          last_pin_check?: string | null
          locked_until?: string | null
          pin_hash?: string | null
          pin_set_at?: string | null
          pin_try_count?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          last_pin_check?: string | null
          locked_until?: string | null
          pin_hash?: string | null
          pin_set_at?: string | null
          pin_try_count?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_word_progress: {
        Row: {
          created_at: string | null
          id: string
          last_seen_at: string | null
          mastery_level: number | null
          times_correct: number | null
          times_seen: number | null
          updated_at: string | null
          user_id: string
          word_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_seen_at?: string | null
          mastery_level?: number | null
          times_correct?: number | null
          times_seen?: number | null
          updated_at?: string | null
          user_id: string
          word_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_seen_at?: string | null
          mastery_level?: number | null
          times_correct?: number | null
          times_seen?: number | null
          updated_at?: string | null
          user_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_word_progress_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      word_variants: {
        Row: {
          created_at: string | null
          id: string
          phonetic_primary: string | null
          phonetic_secondary: string | null
          variant: string
          variant_normalized: string | null
          word_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          phonetic_primary?: string | null
          phonetic_secondary?: string | null
          variant: string
          variant_normalized?: string | null
          word_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          phonetic_primary?: string | null
          phonetic_secondary?: string | null
          variant?: string
          variant_normalized?: string | null
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "word_variants_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      words: {
        Row: {
          audio_url: string | null
          category: string | null
          created_at: string | null
          difficulty_level: number | null
          dutch_meaning: string
          example_sentence: string | null
          id: string
          is_active: boolean | null
          normalized_word: string | null
          phonetic_primary: string | null
          phonetic_secondary: string | null
          region_tag: string | null
          slang_word: string
          updated_at: string | null
          usage_frequency: number | null
        }
        Insert: {
          audio_url?: string | null
          category?: string | null
          created_at?: string | null
          difficulty_level?: number | null
          dutch_meaning: string
          example_sentence?: string | null
          id?: string
          is_active?: boolean | null
          normalized_word?: string | null
          phonetic_primary?: string | null
          phonetic_secondary?: string | null
          region_tag?: string | null
          slang_word: string
          updated_at?: string | null
          usage_frequency?: number | null
        }
        Update: {
          audio_url?: string | null
          category?: string | null
          created_at?: string | null
          difficulty_level?: number | null
          dutch_meaning?: string
          example_sentence?: string | null
          id?: string
          is_active?: boolean | null
          normalized_word?: string | null
          phonetic_primary?: string | null
          phonetic_secondary?: string | null
          region_tag?: string | null
          slang_word?: string
          updated_at?: string | null
          usage_frequency?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_sample_words: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      daitch_mokotoff: {
        Args: { "": string }
        Returns: string[]
      }
      dmetaphone: {
        Args: { "": string }
        Returns: string
      }
      dmetaphone_alt: {
        Args: { "": string }
        Returns: string
      }
      get_word_of_day: {
        Args: { target_date?: string }
        Returns: {
          audio_url: string
          difficulty_level: number
          dutch_meaning: string
          example_sentence: string
          slang_word: string
          word_id: string
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      normalize_slang_word: {
        Args: { input_word: string }
        Returns: string
      }
      search_words: {
        Args: { query_text: string; result_limit?: number }
        Returns: {
          audio_url: string
          dutch_meaning: string
          example_sentence: string
          match_type: string
          relevance_score: number
          slang_word: string
          word_id: string
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      soundex: {
        Args: { "": string }
        Returns: string
      }
      text_soundex: {
        Args: { "": string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
