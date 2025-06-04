export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_pricing_settings: {
        Row: {
          description: string | null
          last_updated_by: string | null
          setting_id: string
          setting_name: string
          setting_value: number
          updated_at: string
        }
        Insert: {
          description?: string | null
          last_updated_by?: string | null
          setting_id?: string
          setting_name: string
          setting_value: number
          updated_at?: string
        }
        Update: {
          description?: string | null
          last_updated_by?: string | null
          setting_id?: string
          setting_name?: string
          setting_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          app_notifications: boolean | null
          client_id: string
          contact_name: string
          created_at: string
          current_package_id: string | null
          email: string
          email_notifications: boolean | null
          phone: string | null
          remaining_servings: number | null
          restaurant_name: string
          updated_at: string
          user_auth_id: string
        }
        Insert: {
          app_notifications?: boolean | null
          client_id?: string
          contact_name: string
          created_at?: string
          current_package_id?: string | null
          email: string
          email_notifications?: boolean | null
          phone?: string | null
          remaining_servings?: number | null
          restaurant_name: string
          updated_at?: string
          user_auth_id: string
        }
        Update: {
          app_notifications?: boolean | null
          client_id?: string
          contact_name?: string
          created_at?: string
          current_package_id?: string | null
          email?: string
          email_notifications?: boolean | null
          phone?: string | null
          remaining_servings?: number | null
          restaurant_name?: string
          updated_at?: string
          user_auth_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_current_package_id_fkey"
            columns: ["current_package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["package_id"]
          },
        ]
      }
      cocktails: {
        Row: {
          client_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          notes: string | null
          reference_image_urls: string[] | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          reference_image_urls?: string[] | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          reference_image_urls?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_submissions: {
        Row: {
          assigned_editor_id: string | null
          category: string | null
          client_id: string | null
          created_lead_id: string | null
          description: string | null
          edit_count: number | null
          edit_history: Json | null
          final_approval_timestamp: string | null
          fixed_prompt: string | null
          ingredients: string[] | null
          internal_team_notes: string | null
          item_name_at_submission: string
          item_type: string
          lead_id: string | null
          lora_id: string | null
          lora_link: string | null
          lora_name: string | null
          main_processed_image_url: string | null
          original_image_urls: string[] | null
          original_item_id: string | null
          priority: string | null
          processed_at: string | null
          processed_image_urls: string[] | null
          status_בעיבוד_at: string | null
          status_הושלמה_ואושרה_at: string | null
          status_הערות_התקבלו_at: string | null
          status_מוכנה_להצגה_at: string | null
          status_ממתינה_לעיבוד_at: string | null
          submission_contact_email: string | null
          submission_contact_name: string | null
          submission_contact_phone: string | null
          submission_id: string
          submission_status: string
          target_completion_date: string | null
          uploaded_at: string
        }
        Insert: {
          assigned_editor_id?: string | null
          category?: string | null
          client_id?: string | null
          created_lead_id?: string | null
          description?: string | null
          edit_count?: number | null
          edit_history?: Json | null
          final_approval_timestamp?: string | null
          fixed_prompt?: string | null
          ingredients?: string[] | null
          internal_team_notes?: string | null
          item_name_at_submission: string
          item_type: string
          lead_id?: string | null
          lora_id?: string | null
          lora_link?: string | null
          lora_name?: string | null
          main_processed_image_url?: string | null
          original_image_urls?: string[] | null
          original_item_id?: string | null
          priority?: string | null
          processed_at?: string | null
          processed_image_urls?: string[] | null
          status_בעיבוד_at?: string | null
          status_הושלמה_ואושרה_at?: string | null
          status_הערות_התקבלו_at?: string | null
          status_מוכנה_להצגה_at?: string | null
          status_ממתינה_לעיבוד_at?: string | null
          submission_contact_email?: string | null
          submission_contact_name?: string | null
          submission_contact_phone?: string | null
          submission_id?: string
          submission_status?: string
          target_completion_date?: string | null
          uploaded_at?: string
        }
        Update: {
          assigned_editor_id?: string | null
          category?: string | null
          client_id?: string | null
          created_lead_id?: string | null
          description?: string | null
          edit_count?: number | null
          edit_history?: Json | null
          final_approval_timestamp?: string | null
          fixed_prompt?: string | null
          ingredients?: string[] | null
          internal_team_notes?: string | null
          item_name_at_submission?: string
          item_type?: string
          lead_id?: string | null
          lora_id?: string | null
          lora_link?: string | null
          lora_name?: string | null
          main_processed_image_url?: string | null
          original_image_urls?: string[] | null
          original_item_id?: string | null
          priority?: string | null
          processed_at?: string | null
          processed_image_urls?: string[] | null
          status_בעיבוד_at?: string | null
          status_הושלמה_ואושרה_at?: string | null
          status_הערות_התקבלו_at?: string | null
          status_מוכנה_להצגה_at?: string | null
          status_ממתינה_לעיבוד_at?: string | null
          submission_contact_email?: string | null
          submission_contact_name?: string | null
          submission_contact_phone?: string | null
          submission_id?: string
          submission_status?: string
          target_completion_date?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_submissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "customer_submissions_created_lead_id_fkey"
            columns: ["created_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "customer_submissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["lead_id"]
          },
        ]
      }
      dishes: {
        Row: {
          client_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          notes: string | null
          reference_image_urls: string[] | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          reference_image_urls?: string[] | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          reference_image_urls?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      drinks: {
        Row: {
          client_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          notes: string | null
          reference_image_urls: string[] | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          reference_image_urls?: string[] | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          reference_image_urls?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      lead_activity_log: {
        Row: {
          activity_description: string
          activity_id: string
          activity_timestamp: string
          lead_id: string
          user_id: string | null
        }
        Insert: {
          activity_description: string
          activity_id?: string
          activity_timestamp?: string
          lead_id: string
          user_id?: string | null
        }
        Update: {
          activity_description?: string
          activity_id?: string
          activity_timestamp?: string
          lead_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activity_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["lead_id"]
          },
        ]
      }
      lead_comments: {
        Row: {
          comment_id: string
          comment_text: string
          comment_timestamp: string
          lead_id: string
          user_id: string | null
        }
        Insert: {
          comment_id?: string
          comment_text: string
          comment_timestamp?: string
          lead_id: string
          user_id?: string | null
        }
        Update: {
          comment_id?: string
          comment_text?: string
          comment_timestamp?: string
          lead_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_comments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["lead_id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          ai_prompt_cost_per_unit: number | null
          ai_prompts_count: number
          ai_training_15_count: number | null
          ai_training_25_count: number | null
          ai_training_5_count: number | null
          ai_training_cost_per_unit: number | null
          ai_trainings_count: number
          business_type: string | null
          client_id: string | null
          contact_name: string
          created_at: string
          email: string
          exchange_rate_at_conversion: number | null
          free_sample_package_active: boolean | null
          lead_id: string
          lead_source: string | null
          lead_status: string | null
          next_follow_up_date: string | null
          notes: string | null
          phone: string
          previous_status: string | null
          reminder_at: string | null
          reminder_details: string | null
          restaurant_name: string
          revenue_from_lead_local: number | null
          revenue_from_lead_usd: number | null
          roi: number | null
          status: string
          total_ai_costs: number | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          ai_prompt_cost_per_unit?: number | null
          ai_prompts_count?: number
          ai_training_15_count?: number | null
          ai_training_25_count?: number | null
          ai_training_5_count?: number | null
          ai_training_cost_per_unit?: number | null
          ai_trainings_count?: number
          business_type?: string | null
          client_id?: string | null
          contact_name: string
          created_at?: string
          email: string
          exchange_rate_at_conversion?: number | null
          free_sample_package_active?: boolean | null
          lead_id?: string
          lead_source?: string | null
          lead_status?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          phone: string
          previous_status?: string | null
          reminder_at?: string | null
          reminder_details?: string | null
          restaurant_name: string
          revenue_from_lead_local?: number | null
          revenue_from_lead_usd?: number | null
          roi?: number | null
          status?: string
          total_ai_costs?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          ai_prompt_cost_per_unit?: number | null
          ai_prompts_count?: number
          ai_training_15_count?: number | null
          ai_training_25_count?: number | null
          ai_training_5_count?: number | null
          ai_training_cost_per_unit?: number | null
          ai_trainings_count?: number
          business_type?: string | null
          client_id?: string | null
          contact_name?: string
          created_at?: string
          email?: string
          exchange_rate_at_conversion?: number | null
          free_sample_package_active?: boolean | null
          lead_id?: string
          lead_source?: string | null
          lead_status?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          phone?: string
          previous_status?: string | null
          reminder_at?: string | null
          reminder_details?: string | null
          restaurant_name?: string
          revenue_from_lead_local?: number | null
          revenue_from_lead_usd?: number | null
          roi?: number | null
          status?: string
          total_ai_costs?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      leads_old: {
        Row: {
          contact_name: string
          created_at: string
          email: string
          lead_id: string
          message: string | null
          phone: string | null
          restaurant_name: string
          status: string | null
          updated_at: string
        }
        Insert: {
          contact_name: string
          created_at?: string
          email: string
          lead_id?: string
          message?: string | null
          phone?: string | null
          restaurant_name: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          contact_name?: string
          created_at?: string
          email?: string
          lead_id?: string
          message?: string | null
          phone?: string | null
          restaurant_name?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      service_packages: {
        Row: {
          created_at: string
          description: string | null
          is_active: boolean | null
          name: string
          package_id: string
          price: number
          total_servings: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          is_active?: boolean | null
          name: string
          package_id?: string
          price: number
          total_servings: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          is_active?: boolean | null
          name?: string
          package_id?: string
          price?: number
          total_servings?: number
          updated_at?: string
        }
        Relationships: []
      }
      submission_comments: {
        Row: {
          comment_id: string
          comment_text: string
          comment_type: string
          created_at: string
          created_by: string | null
          submission_id: string
          tagged_users: string[] | null
          updated_at: string
          visibility: string
        }
        Insert: {
          comment_id?: string
          comment_text: string
          comment_type: string
          created_at?: string
          created_by?: string | null
          submission_id: string
          tagged_users?: string[] | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          comment_id?: string
          comment_text?: string
          comment_type?: string
          created_at?: string
          created_by?: string | null
          submission_id?: string
          tagged_users?: string[] | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_comments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "customer_submissions"
            referencedColumns: ["submission_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_client_ownership: {
        Args: { client_id: string }
        Returns: boolean
      }
      convert_lead_to_client: {
        Args: { p_lead_id: string }
        Returns: string
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_client_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      handle_new_submission_for_lead_creation: {
        Args: {
          p_submission_restaurant_name: string
          p_submission_contact_name: string
          p_submission_email: string
          p_submission_phone: string
        }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_editor: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_lead_activity: {
        Args: {
          p_lead_id: string
          p_activity_description: string
          p_user_id?: string
        }
        Returns: undefined
      }
      migrate_leads_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      public_submit_item_by_restaurant_name: {
        Args:
          | {
              p_restaurant_name: string
              p_item_type: string
              p_item_name: string
              p_description?: string
              p_category?: string
              p_ingredients?: string[]
              p_reference_image_urls?: string[]
            }
          | {
              p_restaurant_name: string
              p_item_type: string
              p_item_name: string
              p_description?: string
              p_category?: string
              p_ingredients?: string[]
              p_reference_image_urls?: string[]
              p_branding_material_urls?: string[]
              p_reference_example_urls?: string[]
              p_contact_name?: string
              p_contact_email?: string
              p_contact_phone?: string
            }
          | {
              p_restaurant_name: string
              p_item_type: string
              p_item_name: string
              p_description?: string
              p_notes?: string
              p_reference_image_urls?: string[]
            }
        Returns: string
      }
    }
    Enums: {
      lead_source_enum:
        | "website"
        | "referral"
        | "facebook"
        | "instagram"
        | "auto_submission"
        | "other"
      lead_status_enum:
        | "new"
        | "contacted"
        | "interested_sent_pics"
        | "waiting_reply"
        | "meeting_scheduled"
        | "demo_done"
        | "quote_sent"
        | "cold_follow_up"
        | "not_interested"
        | "converted_to_client"
        | "archived"
      lead_status_type:
        | "ליד חדש"
        | "פנייה ראשונית בוצעה"
        | "בטיפול"
        | "מעוניין"
        | "לא מעוניין"
        | "הפך ללקוח"
        | "ארכיון"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      lead_source_enum: [
        "website",
        "referral",
        "facebook",
        "instagram",
        "auto_submission",
        "other",
      ],
      lead_status_enum: [
        "new",
        "contacted",
        "interested_sent_pics",
        "waiting_reply",
        "meeting_scheduled",
        "demo_done",
        "quote_sent",
        "cold_follow_up",
        "not_interested",
        "converted_to_client",
        "archived",
      ],
      lead_status_type: [
        "ליד חדש",
        "פנייה ראשונית בוצעה",
        "בטיפול",
        "מעוניין",
        "לא מעוניין",
        "הפך ללקוח",
        "ארכיון",
      ],
    },
  },
} as const

