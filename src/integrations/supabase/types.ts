export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      additional_details: {
        Row: {
          brand_colors: string | null
          branding_materials_url: string | null
          client_id: string
          created_at: string
          general_notes: string | null
          visual_style: string | null
        }
        Insert: {
          brand_colors?: string | null
          branding_materials_url?: string | null
          client_id: string
          created_at?: string
          general_notes?: string | null
          visual_style?: string | null
        }
        Update: {
          brand_colors?: string | null
          branding_materials_url?: string | null
          client_id?: string
          created_at?: string
          general_notes?: string | null
          visual_style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "additional_details_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      client_packages: {
        Row: {
          client_id: string
          created_at: string
          id: string
          package_name: string
          remaining_dishes: number
          total_dishes: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          package_name: string
          remaining_dishes: number
          total_dishes: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          package_name?: string
          remaining_dishes?: number
          total_dishes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_packages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      clients: {
        Row: {
          app_notifications: boolean | null
          client_id: string
          client_status: Database["public"]["Enums"]["client_status_type"]
          contact_name: string
          created_at: string
          current_package_id: string | null
          email: string
          email_notifications: boolean | null
          internal_notes: string | null
          last_activity_at: string
          original_lead_id: string | null
          phone: string
          remaining_servings: number
          restaurant_name: string
          user_auth_id: string | null
        }
        Insert: {
          app_notifications?: boolean | null
          client_id?: string
          client_status?: Database["public"]["Enums"]["client_status_type"]
          contact_name: string
          created_at?: string
          current_package_id?: string | null
          email: string
          email_notifications?: boolean | null
          internal_notes?: string | null
          last_activity_at?: string
          original_lead_id?: string | null
          phone: string
          remaining_servings?: number
          restaurant_name: string
          user_auth_id?: string | null
        }
        Update: {
          app_notifications?: boolean | null
          client_id?: string
          client_status?: Database["public"]["Enums"]["client_status_type"]
          contact_name?: string
          created_at?: string
          current_package_id?: string | null
          email?: string
          email_notifications?: boolean | null
          internal_notes?: string | null
          last_activity_at?: string
          original_lead_id?: string | null
          phone?: string
          remaining_servings?: number
          restaurant_name?: string
          user_auth_id?: string | null
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
          cocktail_id: string
          created_at: string
          description: string | null
          id: string | null
          image_urls: string[] | null
          ingredients: string | null
          ingredients_array: string[] | null
          name: string
          notes: string | null
          price: number | null
          reference_image_urls: string[] | null
        }
        Insert: {
          client_id?: string | null
          cocktail_id?: string
          created_at?: string
          description?: string | null
          id?: string | null
          image_urls?: string[] | null
          ingredients?: string | null
          ingredients_array?: string[] | null
          name: string
          notes?: string | null
          price?: number | null
          reference_image_urls?: string[] | null
        }
        Update: {
          client_id?: string | null
          cocktail_id?: string
          created_at?: string
          description?: string | null
          id?: string | null
          image_urls?: string[] | null
          ingredients?: string | null
          ingredients_array?: string[] | null
          name?: string
          notes?: string | null
          price?: number | null
          reference_image_urls?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "cocktails_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      customer_submissions: {
        Row: {
          assigned_editor_id: string | null
          assigned_package_id_at_submission: string | null
          client_id: string | null
          created_at: string
          edit_count: number | null
          edit_history: Json | null
          final_approval_timestamp: string | null
          internal_team_notes: string | null
          item_name_at_submission: string
          item_type: string
          main_processed_image_url: string | null
          original_item_id: string
          priority: string | null
          processed_image_urls: string[] | null
          status_בעיבוד_at: string | null
          status_הושלמה_ואושרה_at: string | null
          status_הערות_התקבלו_at: string | null
          status_מוכנה_להצגה_at: string | null
          status_ממתינה_לעיבוד_at: string | null
          submission_id: string
          submission_status: string
          target_completion_date: string | null
          uploaded_at: string
        }
        Insert: {
          assigned_editor_id?: string | null
          assigned_package_id_at_submission?: string | null
          client_id?: string | null
          created_at?: string
          edit_count?: number | null
          edit_history?: Json | null
          final_approval_timestamp?: string | null
          internal_team_notes?: string | null
          item_name_at_submission: string
          item_type: string
          main_processed_image_url?: string | null
          original_item_id: string
          priority?: string | null
          processed_image_urls?: string[] | null
          status_בעיבוד_at?: string | null
          status_הושלמה_ואושרה_at?: string | null
          status_הערות_התקבלו_at?: string | null
          status_מוכנה_להצגה_at?: string | null
          status_ממתינה_לעיבוד_at?: string | null
          submission_id?: string
          submission_status?: string
          target_completion_date?: string | null
          uploaded_at?: string
        }
        Update: {
          assigned_editor_id?: string | null
          assigned_package_id_at_submission?: string | null
          client_id?: string | null
          created_at?: string
          edit_count?: number | null
          edit_history?: Json | null
          final_approval_timestamp?: string | null
          internal_team_notes?: string | null
          item_name_at_submission?: string
          item_type?: string
          main_processed_image_url?: string | null
          original_item_id?: string
          priority?: string | null
          processed_image_urls?: string[] | null
          status_בעיבוד_at?: string | null
          status_הושלמה_ואושרה_at?: string | null
          status_הערות_התקבלו_at?: string | null
          status_מוכנה_להצגה_at?: string | null
          status_ממתינה_לעיבוד_at?: string | null
          submission_id?: string
          submission_status?: string
          target_completion_date?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_submissions_assigned_package_id_at_submission_fkey"
            columns: ["assigned_package_id_at_submission"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["package_id"]
          },
          {
            foreignKeyName: "customer_submissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      dishes: {
        Row: {
          category: string | null
          client_id: string | null
          created_at: string
          description: string | null
          dish_id: string
          id: string | null
          image_urls: string[] | null
          ingredients: string | null
          name: string
          notes: string | null
          price: number | null
          reference_image_urls: string[] | null
        }
        Insert: {
          category?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          dish_id?: string
          id?: string | null
          image_urls?: string[] | null
          ingredients?: string | null
          name: string
          notes?: string | null
          price?: number | null
          reference_image_urls?: string[] | null
        }
        Update: {
          category?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          dish_id?: string
          id?: string | null
          image_urls?: string[] | null
          ingredients?: string | null
          name?: string
          notes?: string | null
          price?: number | null
          reference_image_urls?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "dishes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      drinks: {
        Row: {
          category: string | null
          client_id: string | null
          created_at: string
          description: string | null
          drink_id: string
          id: string | null
          image_urls: string[] | null
          ingredients: string | null
          name: string
          notes: string | null
          price: number | null
          reference_image_urls: string[] | null
        }
        Insert: {
          category?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          drink_id?: string
          id?: string | null
          image_urls?: string[] | null
          ingredients?: string | null
          name: string
          notes?: string | null
          price?: number | null
          reference_image_urls?: string[] | null
        }
        Update: {
          category?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          drink_id?: string
          id?: string | null
          image_urls?: string[] | null
          ingredients?: string | null
          name?: string
          notes?: string | null
          price?: number | null
          reference_image_urls?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "drinks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      leads: {
        Row: {
          contact_name: string
          created_at: string
          email: string
          free_sample_package_active: boolean
          id: string
          last_updated_at: string
          lead_source: Database["public"]["Enums"]["lead_source_type"] | null
          lead_status: Database["public"]["Enums"]["lead_status_type"]
          notes: string | null
          phone_number: string
          reminder_at: string | null
          reminder_details: string | null
          restaurant_name: string
        }
        Insert: {
          contact_name: string
          created_at?: string
          email: string
          free_sample_package_active?: boolean
          id?: string
          last_updated_at?: string
          lead_source?: Database["public"]["Enums"]["lead_source_type"] | null
          lead_status?: Database["public"]["Enums"]["lead_status_type"]
          notes?: string | null
          phone_number: string
          reminder_at?: string | null
          reminder_details?: string | null
          restaurant_name: string
        }
        Update: {
          contact_name?: string
          created_at?: string
          email?: string
          free_sample_package_active?: boolean
          id?: string
          last_updated_at?: string
          lead_source?: Database["public"]["Enums"]["lead_source_type"] | null
          lead_status?: Database["public"]["Enums"]["lead_status_type"]
          notes?: string | null
          phone_number?: string
          reminder_at?: string | null
          reminder_details?: string | null
          restaurant_name?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          message_id: string
          read_status: boolean
          sender_id: string
          sender_type: string
          submission_id: string
          timestamp: string
        }
        Insert: {
          content: string
          message_id?: string
          read_status?: boolean
          sender_id: string
          sender_type: string
          submission_id: string
          timestamp?: string
        }
        Update: {
          content?: string
          message_id?: string
          read_status?: boolean
          sender_id?: string
          sender_type?: string
          submission_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "customer_submissions"
            referencedColumns: ["submission_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          link: string | null
          message: string
          notification_id: string
          read_status: boolean
          related_entity_id: string | null
          related_entity_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          link?: string | null
          message: string
          notification_id?: string
          read_status?: boolean
          related_entity_id?: string | null
          related_entity_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          link?: string | null
          message?: string
          notification_id?: string
          read_status?: boolean
          related_entity_id?: string | null
          related_entity_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      service_packages: {
        Row: {
          created_at: string
          description: string | null
          features_tags: string[] | null
          is_active: boolean
          max_edits_per_serving: number
          max_processing_time_days: number | null
          package_id: string
          package_name: string
          price: number
          total_servings: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features_tags?: string[] | null
          is_active?: boolean
          max_edits_per_serving?: number
          max_processing_time_days?: number | null
          package_id?: string
          package_name: string
          price?: number
          total_servings?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features_tags?: string[] | null
          is_active?: boolean
          max_edits_per_serving?: number
          max_processing_time_days?: number | null
          package_id?: string
          package_name?: string
          price?: number
          total_servings?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      visual_styles: {
        Row: {
          created_at: string
          image_url: string
          style_id: string
          style_name: string
        }
        Insert: {
          created_at?: string
          image_url: string
          style_id?: string
          style_name: string
        }
        Update: {
          created_at?: string
          image_url?: string
          style_id?: string
          style_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_client_for_user: {
        Args: { user_auth_id: string }
        Returns: string
      }
      get_client_id: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_auth_data: {
        Args: { user_uid: string }
        Returns: {
          user_role: string
          client_id: string
          restaurant_name: string
          has_client_record: boolean
        }[]
      }
      get_user_client_id: {
        Args: { user_uid: string }
        Returns: string
      }
      has_role: {
        Args: { user_id: string; role_name: string }
        Returns: boolean
      }
      is_account_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_or_account_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_client_owner: {
        Args: { client_id: string }
        Returns: boolean
      }
      is_editor: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      public_submit_item_by_restaurant_name: {
        Args: {
          p_restaurant_name: string
          p_item_type: string
          p_item_name: string
          p_description?: string
          p_category?: string
          p_ingredients?: string[]
          p_price?: number
          p_reference_image_urls?: string[]
        }
        Returns: Json
      }
    }
    Enums: {
      client_status_type: "פעיל" | "לא פעיל" | "בהמתנה"
      lead_source_type: "אתר" | "הפניה" | "פייסבוק" | "אינסטגרם" | "אחר"
      lead_status_type:
        | "ליד חדש"
        | "פנייה ראשונית בוצעה"
        | "מעוניין"
        | "לא מעוניין"
        | "נקבעה פגישה/שיחה"
        | "הדגמה בוצעה"
        | "הצעת מחיר נשלחה"
        | "ממתין לתשובה"
        | "הפך ללקוח"
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
  public: {
    Enums: {
      client_status_type: ["פעיל", "לא פעיל", "בהמתנה"],
      lead_source_type: ["אתר", "הפניה", "פייסבוק", "אינסטגרם", "אחר"],
      lead_status_type: [
        "ליד חדש",
        "פנייה ראשונית בוצעה",
        "מעוניין",
        "לא מעוניין",
        "נקבעה פגישה/שיחה",
        "הדגמה בוצעה",
        "הצעת מחיר נשלחה",
        "ממתין לתשובה",
        "הפך ללקוח",
      ],
    },
  },
} as const
