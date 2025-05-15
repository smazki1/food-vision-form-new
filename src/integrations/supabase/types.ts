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
      clients: {
        Row: {
          client_id: string
          client_status: Database["public"]["Enums"]["client_status_type"]
          contact_name: string
          created_at: string
          current_package_id: string | null
          email: string
          internal_notes: string | null
          last_activity_at: string
          original_lead_id: string | null
          phone: string
          remaining_servings: number
          restaurant_name: string
          user_auth_id: string | null
        }
        Insert: {
          client_id?: string
          client_status?: Database["public"]["Enums"]["client_status_type"]
          contact_name: string
          created_at?: string
          current_package_id?: string | null
          email: string
          internal_notes?: string | null
          last_activity_at?: string
          original_lead_id?: string | null
          phone: string
          remaining_servings?: number
          restaurant_name: string
          user_auth_id?: string | null
        }
        Update: {
          client_id?: string
          client_status?: Database["public"]["Enums"]["client_status_type"]
          contact_name?: string
          created_at?: string
          current_package_id?: string | null
          email?: string
          internal_notes?: string | null
          last_activity_at?: string
          original_lead_id?: string | null
          phone?: string
          remaining_servings?: number
          restaurant_name?: string
          user_auth_id?: string | null
        }
        Relationships: []
      }
      cocktails: {
        Row: {
          client_id: string
          cocktail_id: string
          created_at: string
          description: string | null
          ingredients: string | null
          name: string
          notes: string | null
          reference_image_urls: string[] | null
        }
        Insert: {
          client_id: string
          cocktail_id?: string
          created_at?: string
          description?: string | null
          ingredients?: string | null
          name: string
          notes?: string | null
          reference_image_urls?: string[] | null
        }
        Update: {
          client_id?: string
          cocktail_id?: string
          created_at?: string
          description?: string | null
          ingredients?: string | null
          name?: string
          notes?: string | null
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
      dishes: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          dish_id: string
          ingredients: string | null
          name: string
          notes: string | null
          reference_image_urls: string[] | null
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          dish_id?: string
          ingredients?: string | null
          name: string
          notes?: string | null
          reference_image_urls?: string[] | null
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          dish_id?: string
          ingredients?: string | null
          name?: string
          notes?: string | null
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
          client_id: string
          created_at: string
          description: string | null
          drink_id: string
          ingredients: string | null
          name: string
          notes: string | null
          reference_image_urls: string[] | null
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          drink_id?: string
          ingredients?: string | null
          name: string
          notes?: string | null
          reference_image_urls?: string[] | null
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          drink_id?: string
          ingredients?: string | null
          name?: string
          notes?: string | null
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
      [_ in never]: never
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
