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
      attendance: {
        Row: {
          created_at: string
          id: string
          marked_by: string
          notes: string | null
          session_date: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          marked_by: string
          notes?: string | null
          session_date: string
          status: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          marked_by?: string
          notes?: string | null
          session_date?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          country: string | null
          created_at: string
          email: string
          full_name: string | null
          grade: number
          id: string
          invited_by: string
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          parent_relationship: string | null
          status: Database["public"]["Enums"]["invite_status"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          country?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          grade: number
          id?: string
          invited_by: string
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_relationship?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          grade?: number
          id?: string
          invited_by?: string
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_relationship?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
        }
        Relationships: []
      }
      parent_notifications: {
        Row: {
          id: string
          notification_type: string
          sent_at: string
          sent_by: string
          student_id: string
        }
        Insert: {
          id?: string
          notification_type: string
          sent_at?: string
          sent_by: string
          student_id: string
        }
        Update: {
          id?: string
          notification_type?: string
          sent_at?: string
          sent_by?: string
          student_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          billing_cycle_end: string | null
          country: string | null
          created_at: string
          email: string
          full_name: string | null
          grade: number | null
          id: string
          low_performance_count: number
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          parent_relationship: string | null
          performance_flag: boolean
          plan: string
          plan_status: string
          subscription_id: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle_end?: string | null
          country?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          grade?: number | null
          id: string
          low_performance_count?: number
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_relationship?: string | null
          performance_flag?: boolean
          plan?: string
          plan_status?: string
          subscription_id?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle_end?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          grade?: number | null
          id?: string
          low_performance_count?: number
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_relationship?: string | null
          performance_flag?: boolean
          plan?: string
          plan_status?: string
          subscription_id?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          ends_at: string
          grade: number | null
          id: string
          meeting_url: string | null
          starts_at: string
          student_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          ends_at: string
          grade?: number | null
          id?: string
          meeting_url?: string | null
          starts_at: string
          student_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string
          grade?: number | null
          id?: string
          meeting_url?: string | null
          starts_at?: string
          student_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      worksheet_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          grade: number | null
          id: string
          student_id: string | null
          worksheet_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          grade?: number | null
          id?: string
          student_id?: string | null
          worksheet_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          grade?: number | null
          id?: string
          student_id?: string | null
          worksheet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worksheet_assignments_worksheet_id_fkey"
            columns: ["worksheet_id"]
            isOneToOne: false
            referencedRelation: "worksheets"
            referencedColumns: ["id"]
          },
        ]
      }
      worksheet_results: {
        Row: {
          completed_at: string
          id: string
          percentage: number
          score: number
          student_email: string
          student_name: string
          total_questions: number
          worksheet_class: string
          worksheet_title: string
        }
        Insert: {
          completed_at?: string
          id?: string
          percentage: number
          score: number
          student_email: string
          student_name: string
          total_questions: number
          worksheet_class: string
          worksheet_title: string
        }
        Update: {
          completed_at?: string
          id?: string
          percentage?: number
          score?: number
          student_email?: string
          student_name?: string
          total_questions?: number
          worksheet_class?: string
          worksheet_title?: string
        }
        Relationships: []
      }
      worksheets: {
        Row: {
          assigned_grades: number[]
          created_at: string
          description: string | null
          file_name: string | null
          grade: number | null
          id: string
          is_free_tier: boolean
          notion_url: string | null
          storage_path: string | null
          title: string
          topic: string | null
          uploaded_by: string
        }
        Insert: {
          assigned_grades?: number[]
          created_at?: string
          description?: string | null
          file_name?: string | null
          grade?: number | null
          id?: string
          is_free_tier?: boolean
          notion_url?: string | null
          storage_path?: string | null
          title: string
          topic?: string | null
          uploaded_by: string
        }
        Update: {
          assigned_grades?: number[]
          created_at?: string
          description?: string | null
          file_name?: string | null
          grade?: number | null
          id?: string
          is_free_tier?: boolean
          notion_url?: string | null
          storage_path?: string | null
          title?: string
          topic?: string | null
          uploaded_by?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "teacher" | "student"
      invite_status: "pending" | "accepted" | "revoked"
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
    Enums: {
      app_role: ["teacher", "student"],
      invite_status: ["pending", "accepted", "revoked"],
    },
  },
} as const
