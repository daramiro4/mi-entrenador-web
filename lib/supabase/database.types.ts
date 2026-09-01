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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          avg_power: number | null
          created_at: string
          date: string
          duration_minutes: number | null
          external_id: string | null
          id: number
          normalized_power: number | null
          raw_data: Json | null
          source: string | null
          training_load: number | null
          tss: number | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          avg_power?: number | null
          created_at?: string
          date: string
          duration_minutes?: number | null
          external_id?: string | null
          id?: never
          normalized_power?: number | null
          raw_data?: Json | null
          source?: string | null
          training_load?: number | null
          tss?: number | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          avg_power?: number | null
          created_at?: string
          date?: string
          duration_minutes?: number | null
          external_id?: string | null
          id?: never
          normalized_power?: number | null
          raw_data?: Json | null
          source?: string | null
          training_load?: number | null
          tss?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_metrics: {
        Row: {
          body_battery_max: number | null
          body_battery_min: number | null
          body_fat_pct: number | null
          created_at: string
          date: string
          hrv_ms: number | null
          id: number
          resting_hr: number | null
          sleep_duration_minutes: number | null
          sleep_score: number | null
          source: string | null
          stress_avg: number | null
          user_id: string | null
          weight_kg: number | null
        }
        Insert: {
          body_battery_max?: number | null
          body_battery_min?: number | null
          body_fat_pct?: number | null
          created_at?: string
          date: string
          hrv_ms?: number | null
          id?: never
          resting_hr?: number | null
          sleep_duration_minutes?: number | null
          sleep_score?: number | null
          source?: string | null
          stress_avg?: number | null
          user_id?: string | null
          weight_kg?: number | null
        }
        Update: {
          body_battery_max?: number | null
          body_battery_min?: number | null
          body_fat_pct?: number | null
          created_at?: string
          date?: string
          hrv_ms?: number | null
          id?: never
          resting_hr?: number | null
          sleep_duration_minutes?: number | null
          sleep_score?: number | null
          source?: string | null
          stress_avg?: number | null
          user_id?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fatigue_index: {
        Row: {
          acute_load: number | null
          acwr_ratio: number | null
          chronic_load: number | null
          created_at: string
          date: string
          id: number
          notes: string | null
          recommendation: string | null
          user_id: string | null
        }
        Insert: {
          acute_load?: number | null
          acwr_ratio?: number | null
          chronic_load?: number | null
          created_at?: string
          date: string
          id?: never
          notes?: string | null
          recommendation?: string | null
          user_id?: string | null
        }
        Update: {
          acute_load?: number | null
          acwr_ratio?: number | null
          chronic_load?: number | null
          created_at?: string
          date?: string
          id?: never
          notes?: string | null
          recommendation?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fatigue_index_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ftp_history: {
        Row: {
          created_at: string
          date: string
          ftp_watts: number
          id: number
          method: string | null
          notes: string | null
          source: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date: string
          ftp_watts: number
          id?: never
          method?: string | null
          notes?: string | null
          source?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          ftp_watts?: number
          id?: never
          method?: string | null
          notes?: string | null
          source?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ftp_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      planned_sessions: {
        Row: {
          actual_activity_id: number | null
          created_at: string
          date: string
          id: string
          notes: Json | null
          planned_tss: number | null
          season_id: number
          session_type: string
          status: string
          updated_at: string
          user_id: string
          workout_template_id: string | null
        }
        Insert: {
          actual_activity_id?: number | null
          created_at?: string
          date: string
          id?: string
          notes?: Json | null
          planned_tss?: number | null
          season_id: number
          session_type: string
          status?: string
          updated_at?: string
          user_id: string
          workout_template_id?: string | null
        }
        Update: {
          actual_activity_id?: number | null
          created_at?: string
          date?: string
          id?: string
          notes?: Json | null
          planned_tss?: number | null
          season_id?: number
          session_type?: string
          status?: string
          updated_at?: string
          user_id?: string
          workout_template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planned_sessions_actual_activity_id_fkey"
            columns: ["actual_activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planned_sessions_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planned_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planned_sessions_workout_template_id_fkey"
            columns: ["workout_template_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          api_key: string
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          telegram_chat_id: string | null
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          api_key?: string
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          telegram_chat_id?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          api_key?: string
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          telegram_chat_id?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      seasons: {
        Row: {
          created_at: string
          focus_areas: string[] | null
          goal_type: string
          hours_per_week: number | null
          id: number
          name: string
          notes: Json | null
          started_at: string
          status: string
          strength_days_per_week: number | null
          target_date: string | null
          target_ftp: number | null
          target_weight_kg: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          focus_areas?: string[] | null
          goal_type: string
          hours_per_week?: number | null
          id?: never
          name: string
          notes?: Json | null
          started_at?: string
          status?: string
          strength_days_per_week?: number | null
          target_date?: string | null
          target_ftp?: number | null
          target_weight_kg?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          focus_areas?: string[] | null
          goal_type?: string
          hours_per_week?: number | null
          id?: never
          name?: string
          notes?: Json | null
          started_at?: string
          status?: string
          strength_days_per_week?: number | null
          target_date?: string | null
          target_ftp?: number | null
          target_weight_kg?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      strength_sessions: {
        Row: {
          activity_id: number | null
          created_at: string
          date: string
          exercise: string
          id: number
          notes: string | null
          reps: number | null
          sets: number | null
          user_id: string | null
          volume_kg: number | null
          weight_kg: number | null
        }
        Insert: {
          activity_id?: number | null
          created_at?: string
          date: string
          exercise: string
          id?: never
          notes?: string | null
          reps?: number | null
          sets?: number | null
          user_id?: string | null
          volume_kg?: number | null
          weight_kg?: number | null
        }
        Update: {
          activity_id?: number | null
          created_at?: string
          date?: string
          exercise?: string
          id?: never
          notes?: string | null
          reps?: number | null
          sets?: number | null
          user_id?: string | null
          volume_kg?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "strength_sessions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strength_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_link_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          used: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          used?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          used?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_link_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_narratives: {
        Row: {
          created_at: string
          id: number
          narrative: string
          season_id: number
          user_id: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          id?: never
          narrative: string
          season_id: number
          user_id: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          id?: never
          narrative?: string
          season_id?: number
          user_id?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_narratives_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_narratives_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string | null
          ftp_ref: number | null
          id: string
          intervals: Json | null
          name: string
          notes: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          ftp_ref?: number | null
          id?: string
          intervals?: Json | null
          name: string
          notes?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          ftp_ref?: number | null
          id?: string
          intervals?: Json | null
          name?: string
          notes?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
