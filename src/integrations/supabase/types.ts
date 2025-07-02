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
      affiliate_assigned_packages: {
        Row: {
          affiliate_id: string
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          package_id: string | null
          package_name: string
          remaining_dishes: number
          remaining_images: number
          start_date: string | null
          total_dishes: number
          total_images: number
          updated_at: string | null
        }
        Insert: {
          affiliate_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          package_id?: string | null
          package_name: string
          remaining_dishes: number
          remaining_images: number
          start_date?: string | null
          total_dishes: number
          total_images: number
          updated_at?: string | null
        }
        Update: {
          affiliate_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          package_id?: string | null
          package_name?: string
          remaining_dishes?: number
          remaining_images?: number
          start_date?: string | null
          total_dishes?: number
          total_images?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_assigned_packages_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["affiliate_id"]
          },
          {
            foreignKeyName: "affiliate_assigned_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["package_id"]
          },
        ]
      }
      affiliate_clients: {
        Row: {
          affiliate_id: string
          client_id: string
          id: string
          referral_method: string | null
          referral_source: string | null
          referred_at: string | null
          status: string | null
        }
        Insert: {
          affiliate_id: string
          client_id: string
          id?: string
          referral_method?: string | null
          referral_source?: string | null
          referred_at?: string | null
          status?: string | null
        }
        Update: {
          affiliate_id?: string
          client_id?: string
          id?: string
          referral_method?: string | null
          referral_source?: string | null
          referred_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clients_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["affiliate_id"]
          },
          {
            foreignKeyName: "affiliate_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          base_amount: number
          client_id: string
          commission_amount: number
          commission_id: string
          commission_rate: number
          created_at: string | null
          package_type: string | null
          payment_date: string | null
          payment_notes: string | null
          payment_status: string | null
          transaction_type: string
        }
        Insert: {
          affiliate_id: string
          base_amount: number
          client_id: string
          commission_amount: number
          commission_id?: string
          commission_rate: number
          created_at?: string | null
          package_type?: string | null
          payment_date?: string | null
          payment_notes?: string | null
          payment_status?: string | null
          transaction_type: string
        }
        Update: {
          affiliate_id?: string
          base_amount?: number
          client_id?: string
          commission_amount?: number
          commission_id?: string
          commission_rate?: number
          created_at?: string | null
          package_type?: string | null
          payment_date?: string | null
          payment_notes?: string | null
          payment_status?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["affiliate_id"]
          },
          {
            foreignKeyName: "affiliate_commissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      affiliate_package_allocations: {
        Row: {
          affiliate_package_id: string
          allocated_at: string | null
          allocated_dishes: number
          allocated_images: number
          allocation_id: string
          client_id: string
          dishes_used: number | null
          images_used: number | null
          status: string | null
        }
        Insert: {
          affiliate_package_id: string
          allocated_at?: string | null
          allocated_dishes: number
          allocated_images: number
          allocation_id?: string
          client_id: string
          dishes_used?: number | null
          images_used?: number | null
          status?: string | null
        }
        Update: {
          affiliate_package_id?: string
          allocated_at?: string | null
          allocated_dishes?: number
          allocated_images?: number
          allocation_id?: string
          client_id?: string
          dishes_used?: number | null
          images_used?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_package_allocations_affiliate_package_id_fkey"
            columns: ["affiliate_package_id"]
            isOneToOne: false
            referencedRelation: "affiliate_packages"
            referencedColumns: ["package_id"]
          },
          {
            foreignKeyName: "affiliate_package_allocations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      affiliate_packages: {
        Row: {
          affiliate_id: string
          dishes_used: number | null
          images_used: number | null
          package_id: string
          package_type: string
          purchase_price: number
          purchased_at: string | null
          status: string | null
          total_dishes: number
          total_images: number
        }
        Insert: {
          affiliate_id: string
          dishes_used?: number | null
          images_used?: number | null
          package_id?: string
          package_type: string
          purchase_price: number
          purchased_at?: string | null
          status?: string | null
          total_dishes: number
          total_images: number
        }
        Update: {
          affiliate_id?: string
          dishes_used?: number | null
          images_used?: number | null
          package_id?: string
          package_type?: string
          purchase_price?: number
          purchased_at?: string | null
          status?: string | null
          total_dishes?: number
          total_images?: number
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_packages_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["affiliate_id"]
          },
        ]
      }
      affiliates: {
        Row: {
          affiliate_id: string
          commission_rate_deluxe: number | null
          commission_rate_full_menu: number | null
          commission_rate_tasting: number | null
          consumed_images: number | null
          created_at: string | null
          current_package_id: string | null
          email: string
          internal_notes: string | null
          name: string
          password: string | null
          phone: string | null
          remaining_images: number | null
          remaining_servings: number | null
          reserved_images: number | null
          status: string | null
          total_earnings: number | null
          total_referrals: number | null
          updated_at: string | null
          user_auth_id: string | null
          username: string | null
        }
        Insert: {
          affiliate_id?: string
          commission_rate_deluxe?: number | null
          commission_rate_full_menu?: number | null
          commission_rate_tasting?: number | null
          consumed_images?: number | null
          created_at?: string | null
          current_package_id?: string | null
          email: string
          internal_notes?: string | null
          name: string
          password?: string | null
          phone?: string | null
          remaining_images?: number | null
          remaining_servings?: number | null
          reserved_images?: number | null
          status?: string | null
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string | null
          user_auth_id?: string | null
          username?: string | null
        }
        Update: {
          affiliate_id?: string
          commission_rate_deluxe?: number | null
          commission_rate_full_menu?: number | null
          commission_rate_tasting?: number | null
          consumed_images?: number | null
          created_at?: string | null
          current_package_id?: string | null
          email?: string
          internal_notes?: string | null
          name?: string
          password?: string | null
          phone?: string | null
          remaining_images?: number | null
          remaining_servings?: number | null
          reserved_images?: number | null
          status?: string | null
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string | null
          user_auth_id?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_current_package_id_fkey"
            columns: ["current_package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["package_id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          ai_prompt_cost_per_unit: number | null
          ai_prompts_count: number | null
          ai_training_15_count: number | null
          ai_training_25_count: number | null
          ai_training_5_count: number | null
          ai_training_cost_per_unit: number | null
          ai_trainings_count: number | null
          app_notifications: boolean | null
          archive_status: string | null
          business_type: string | null
          client_id: string
          client_status: string | null
          consumed_images: number | null
          contact_name: string
          created_at: string
          current_package_id: string | null
          email: string
          email_notifications: boolean | null
          exchange_rate_at_conversion: number | null
          internal_notes: string | null
          last_activity_at: string | null
          next_follow_up_date: string | null
          notes: string | null
          original_lead_id: string | null
          payment_amount_ils: number | null
          payment_due_date: string | null
          payment_status: string | null
          phone: string | null
          remaining_images: number | null
          remaining_servings: number | null
          reminder_at: string | null
          reminder_details: string | null
          reserved_images: number | null
          restaurant_name: string
          revenue_from_client_local: number | null
          revenue_from_client_usd: number | null
          roi: number | null
          total_ai_costs: number | null
          total_work_time_minutes: number | null
          updated_at: string
          user_auth_id: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          ai_prompt_cost_per_unit?: number | null
          ai_prompts_count?: number | null
          ai_training_15_count?: number | null
          ai_training_25_count?: number | null
          ai_training_5_count?: number | null
          ai_training_cost_per_unit?: number | null
          ai_trainings_count?: number | null
          app_notifications?: boolean | null
          archive_status?: string | null
          business_type?: string | null
          client_id?: string
          client_status?: string | null
          consumed_images?: number | null
          contact_name: string
          created_at?: string
          current_package_id?: string | null
          email: string
          email_notifications?: boolean | null
          exchange_rate_at_conversion?: number | null
          internal_notes?: string | null
          last_activity_at?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          original_lead_id?: string | null
          payment_amount_ils?: number | null
          payment_due_date?: string | null
          payment_status?: string | null
          phone?: string | null
          remaining_images?: number | null
          remaining_servings?: number | null
          reminder_at?: string | null
          reminder_details?: string | null
          reserved_images?: number | null
          restaurant_name: string
          revenue_from_client_local?: number | null
          revenue_from_client_usd?: number | null
          roi?: number | null
          total_ai_costs?: number | null
          total_work_time_minutes?: number | null
          updated_at?: string
          user_auth_id: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          ai_prompt_cost_per_unit?: number | null
          ai_prompts_count?: number | null
          ai_training_15_count?: number | null
          ai_training_25_count?: number | null
          ai_training_5_count?: number | null
          ai_training_cost_per_unit?: number | null
          ai_trainings_count?: number | null
          app_notifications?: boolean | null
          archive_status?: string | null
          business_type?: string | null
          client_id?: string
          client_status?: string | null
          consumed_images?: number | null
          contact_name?: string
          created_at?: string
          current_package_id?: string | null
          email?: string
          email_notifications?: boolean | null
          exchange_rate_at_conversion?: number | null
          internal_notes?: string | null
          last_activity_at?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          original_lead_id?: string | null
          payment_amount_ils?: number | null
          payment_due_date?: string | null
          payment_status?: string | null
          phone?: string | null
          remaining_images?: number | null
          remaining_servings?: number | null
          reminder_at?: string | null
          reminder_details?: string | null
          reserved_images?: number | null
          restaurant_name?: string
          revenue_from_client_local?: number | null
          revenue_from_client_usd?: number | null
          roi?: number | null
          total_ai_costs?: number | null
          total_work_time_minutes?: number | null
          updated_at?: string
          user_auth_id?: string
          website_url?: string | null
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
      service_packages: {
        Row: {
          created_at: string
          description: string | null
          features_tags: string[] | null
          is_active: boolean | null
          max_edits_per_serving: number
          max_processing_time_days: number | null
          package_id: string
          package_name: string
          price: number
          special_notes: string | null
          total_images: number | null
          total_servings: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features_tags?: string[] | null
          is_active?: boolean | null
          max_edits_per_serving?: number
          max_processing_time_days?: number | null
          package_id?: string
          package_name: string
          price: number
          special_notes?: string | null
          total_images?: number | null
          total_servings: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features_tags?: string[] | null
          is_active?: boolean | null
          max_edits_per_serving?: number
          max_processing_time_days?: number | null
          package_id?: string
          package_name?: string
          price?: number
          special_notes?: string | null
          total_images?: number | null
          total_servings?: number
          updated_at?: string
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
``` 