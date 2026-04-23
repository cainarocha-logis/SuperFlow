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
      branches: {
        Row: {
          cnpj: string | null
          created_at: string
          id: string
          name: string
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: []
      }
      competency_periods: {
        Row: {
          created_at: string
          end_date: string
          id: string
          name: string
          start_date: string
          status: Database["public"]["Enums"]["period_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          name: string
          start_date: string
          status?: Database["public"]["Enums"]["period_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["period_status"]
          updated_at?: string
        }
        Relationships: []
      }
      cost_centers: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          name: string
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_attachments: {
        Row: {
          created_at: string
          expense_id: string
          file_type: string
          id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          expense_id: string
          file_type: string
          id?: string
          storage_path: string
        }
        Update: {
          created_at?: string
          expense_id?: string
          file_type?: string
          id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_attachments_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_audit_logs: {
        Row: {
          actor_user_id: string
          changed_fields: Json | null
          created_at: string
          expense_id: string
          id: string
          new_status: Database["public"]["Enums"]["expense_status"]
          old_status: Database["public"]["Enums"]["expense_status"] | null
          rejection_reason: string | null
        }
        Insert: {
          actor_user_id: string
          changed_fields?: Json | null
          created_at?: string
          expense_id: string
          id?: string
          new_status: Database["public"]["Enums"]["expense_status"]
          old_status?: Database["public"]["Enums"]["expense_status"] | null
          rejection_reason?: string | null
        }
        Update: {
          actor_user_id?: string
          changed_fields?: Json | null
          created_at?: string
          expense_id?: string
          id?: string
          new_status?: Database["public"]["Enums"]["expense_status"]
          old_status?: Database["public"]["Enums"]["expense_status"] | null
          rejection_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_audit_logs_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_types: {
        Row: {
          created_at: string
          id: string
          name: string
          requires_client: boolean
          requires_license_plate: boolean
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          requires_client?: boolean
          requires_license_plate?: boolean
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          requires_client?: boolean
          requires_license_plate?: boolean
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number | null
          approved_at: string | null
          branch_id: string | null
          cost_center_id: string | null
          created_at: string
          customer_chargeback: boolean
          customer_name: string | null
          expense_type_id: string | null
          id: string
          license_plate: string | null
          observations: string | null
          period_id: string | null
          receipt_date: string | null
          reimbursement_amount: number | null
          status: Database["public"]["Enums"]["expense_status"]
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          branch_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          customer_chargeback?: boolean
          customer_name?: string | null
          expense_type_id?: string | null
          id?: string
          license_plate?: string | null
          observations?: string | null
          period_id?: string | null
          receipt_date?: string | null
          reimbursement_amount?: number | null
          status?: Database["public"]["Enums"]["expense_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          branch_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          customer_chargeback?: boolean
          customer_name?: string | null
          expense_type_id?: string | null
          id?: string
          license_plate?: string | null
          observations?: string | null
          period_id?: string | null
          receipt_date?: string | null
          reimbursement_amount?: number | null
          status?: Database["public"]["Enums"]["expense_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_expense_type_id_fkey"
            columns: ["expense_type_id"]
            isOneToOne: false
            referencedRelation: "expense_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "competency_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_branches: {
        Row: {
          branch_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_branches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_branches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          registration_code: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone?: string | null
          registration_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          registration_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          expense_id: string | null
          title: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          expense_id?: string | null
          title: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          expense_id?: string | null
          title?: string
          message?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          }
        ]
      }
      settings: {
        Row: {
          key: string
          value: string
          created_at: string
          updated_at: string
        }
        Insert: {
          key: string
          value: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_expense: { Args: { p_expense_id: string }; Returns: undefined }
      get_user_branches: { Args: never; Returns: string[] }
      is_admin: { Args: never; Returns: boolean }
      reject_expense: {
        Args: { p_expense_id: string; p_reason: string }
        Returns: undefined
      }
      submit_expense: { Args: { p_expense_id: string }; Returns: undefined }
    }
    Enums: {
      entity_status: "ATIVO" | "INATIVO"
      expense_status:
        | "RASCUNHO"
        | "ENVIADO"
        | "EM_ANALISE"
        | "APROVADO"
        | "REJEITADO"
      period_status: "ABERTO" | "FECHADO" | "EM_CONFERENCIA" | "CONCLUIDO"
      user_role: "ADMIN" | "LANCADOR"
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
      entity_status: ["ATIVO", "INATIVO"],
      expense_status: [
        "RASCUNHO",
        "ENVIADO",
        "EM_ANALISE",
        "APROVADO",
        "REJEITADO",
      ],
      period_status: ["ABERTO", "FECHADO", "EM_CONFERENCIA", "CONCLUIDO"],
      user_role: ["ADMIN", "LANCADOR"],
    },
  },
} as const

