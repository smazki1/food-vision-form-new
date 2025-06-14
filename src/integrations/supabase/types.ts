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
      backups: {
        Row: {
          backup_data: Json
          backup_type: string
          created_at: string | null
          id: string
        }
        Insert: {
          backup_data: Json
          backup_type: string
          created_at?: string | null
          id?: string
        }
        Update: {
          backup_data?: Json
          backup_type?: string
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      client_design_settings: {
        Row: {
          category: string
          client_id: string
          created_at: string
          id: string
          is_active: boolean | null
          reference_images: string[] | null
          style_notes: string | null
          updated_at: string
        }
        Insert: {
          category: string
          client_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          reference_images?: string[] | null
          style_notes?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          client_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          reference_images?: string[] | null
          style_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_design_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      client_image_activity_log: {
        Row: {
          activity_id: string
          activity_type: string
          change_amount: number
          client_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          images_after: number
          images_before: number
        }
        Insert: {
          activity_id?: string
          activity_type: string
          change_amount: number
          client_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          images_after: number
          images_before: number
        }
        Update: {
          activity_id?: string
          activity_type?: string
          change_amount?: number
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          images_after?: number
          images_before?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_image_activity_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
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
          branding_material_urls: string[] | null
          category: string | null
          client_id: string | null
          contact_name: string | null
          created_lead_id: string | null
          description: string | null
          edit_history: Json | null
          email: string | null
          final_approval_timestamp: string | null
          fixed_prompt: string | null
          image_credits_used: number | null
          ingredients: string[] | null
          item_name_at_submission: string
          item_type: string
          lead_id: string | null
          lora_id: string | null
          lora_link: string | null
          lora_name: string | null
          main_processed_image_url: string | null
          original_image_urls: string[] | null
          original_item_id: string | null
          phone: string | null
          processed_at: string | null
          processed_image_count: number | null
          processed_image_urls: string[] | null
          reference_example_urls: string[] | null
          restaurant_name: string | null
          submission_id: string
          submission_status: string
          uploaded_at: string
        }
        Insert: {
          assigned_editor_id?: string | null
          branding_material_urls?: string[] | null
          category?: string | null
          client_id?: string | null
          contact_name?: string | null
          created_lead_id?: string | null
          description?: string | null
          edit_history?: Json | null
          email?: string | null
          final_approval_timestamp?: string | null
          fixed_prompt?: string | null
          image_credits_used?: number | null
          ingredients?: string[] | null
          item_name_at_submission: string
          item_type: string
          lead_id?: string | null
          lora_id?: string | null
          lora_link?: string | null
          lora_name?: string | null
          main_processed_image_url?: string | null
          original_image_urls?: string[] | null
          original_item_id?: string | null
          phone?: string | null
          processed_at?: string | null
          processed_image_count?: number | null
          processed_image_urls?: string[] | null
          reference_example_urls?: string[] | null
          restaurant_name?: string | null
          submission_id?: string
          submission_status?: string
          uploaded_at?: string
        }
        Update: {
          assigned_editor_id?: string | null
          branding_material_urls?: string[] | null
          category?: string | null
          client_id?: string | null
          contact_name?: string | null
          created_lead_id?: string | null
          description?: string | null
          edit_history?: Json | null
          email?: string | null
          final_approval_timestamp?: string | null
          fixed_prompt?: string | null
          image_credits_used?: number | null
          ingredients?: string[] | null
          item_name_at_submission?: string
          item_type?: string
          lead_id?: string | null
          lora_id?: string | null
          lora_link?: string | null
          lora_name?: string | null
          main_processed_image_url?: string | null
          original_image_urls?: string[] | null
          original_item_id?: string | null
          phone?: string | null
          processed_at?: string | null
          processed_image_count?: number | null
          processed_image_urls?: string[] | null
          reference_example_urls?: string[] | null
          restaurant_name?: string | null
          submission_id?: string
          submission_status?: string
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
          estimated_images_needed: string | null
          exchange_rate_at_conversion: number | null
          free_sample_package_active: boolean | null
          items_quantity_range: string | null
          lead_id: string
          lead_source: string | null
          lead_status: string | null
          next_follow_up_date: string | null
          notes: string | null
          phone: string
          previous_status: string | null
          primary_image_usage: string | null
          reminder_at: string | null
          reminder_details: string | null
          restaurant_name: string
          revenue_from_lead_local: number | null
          revenue_from_lead_usd: number | null
          roi: number | null
          status: string
          total_ai_costs: number | null
          total_work_time_minutes: number | null
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
          estimated_images_needed?: string | null
          exchange_rate_at_conversion?: number | null
          free_sample_package_active?: boolean | null
          items_quantity_range?: string | null
          lead_id?: string
          lead_source?: string | null
          lead_status?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          phone: string
          previous_status?: string | null
          primary_image_usage?: string | null
          reminder_at?: string | null
          reminder_details?: string | null
          restaurant_name: string
          revenue_from_lead_local?: number | null
          revenue_from_lead_usd?: number | null
          roi?: number | null
          status?: string
          total_ai_costs?: number | null
          total_work_time_minutes?: number | null
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
          estimated_images_needed?: string | null
          exchange_rate_at_conversion?: number | null
          free_sample_package_active?: boolean | null
          items_quantity_range?: string | null
          lead_id?: string
          lead_source?: string | null
          lead_status?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          phone?: string
          previous_status?: string | null
          primary_image_usage?: string | null
          reminder_at?: string | null
          reminder_details?: string | null
          restaurant_name?: string
          revenue_from_lead_local?: number | null
          revenue_from_lead_usd?: number | null
          roi?: number | null
          status?: string
          total_ai_costs?: number | null
          total_work_time_minutes?: number | null
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
      submissions: {
        Row: {
          business_name: string
          created_at: string | null
          description: string
          id: number
          image_urls: string[] | null
          item_name: string
          item_type: string
          special_notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          business_name: string
          created_at?: string | null
          description: string
          id?: number
          image_urls?: string[] | null
          item_name: string
          item_type: string
          special_notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          business_name?: string
          created_at?: string | null
          description?: string
          id?: number
          image_urls?: string[] | null
          item_name?: string
          item_type?: string
          special_notes?: string | null
          status?: string | null
          updated_at?: string | null
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
      work_sessions: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          session_date: string
          updated_at: string | null
          work_type: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          duration_minutes: number
          id?: string
          session_date: string
          updated_at?: string | null
          work_type?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          session_date?: string
          updated_at?: string | null
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      work_time_sessions: {
        Row: {
          created_at: string
          duration_minutes: number | null
          end_time: string | null
          entity_id: string
          entity_type: string
          id: string
          is_active: boolean | null
          notes: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_health_check: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      backup_critical_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      check_auth_config: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_client_ownership: {
        Args: { client_id: string }
        Returns: boolean
      }
      check_system_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          status: string
          details: Json
        }[]
      }
      convert_lead_to_client: {
        Args: { p_lead_id: string }
        Returns: string
      }
      create_service_package: {
        Args: {
          p_package_name: string
          p_description?: string
          p_total_servings?: number
          p_price?: number
          p_is_active?: boolean
          p_max_processing_time_days?: number
          p_max_edits_per_serving?: number
          p_special_notes?: string
          p_total_images?: number
        }
        Returns: {
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
      }
      create_supabase_user: {
        Args: { user_email: string; user_password: string }
        Returns: Json
      }
      debug_user_auth: {
        Args: { user_email: string }
        Returns: {
          property: string
          value: string
        }[]
      }
      delete_service_package: {
        Args: { p_package_id: string }
        Returns: boolean
      }
      fix_user_auth_issues: {
        Args: { user_email: string }
        Returns: Json
      }
      generate_password_reset_for_user: {
        Args: { user_email: string }
        Returns: Json
      }
      generate_system_diagnostic_report: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_auth_data: {
        Args: { user_uid: string }
        Returns: Json
      }
      get_user_auth_info: {
        Args: { p_email: string }
        Returns: Json
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
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
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
              p_items_quantity_range?: string
              p_estimated_images_needed?: string
              p_primary_image_usage?: string
            }
          | {
              p_restaurant_name: string
              p_item_type: string
              p_item_name: string
              p_description?: string
              p_notes?: string
              p_reference_image_urls?: string[]
            }
        Returns: Json
      }
      reset_user_password: {
        Args: { user_email: string; new_password: string }
        Returns: Json
      }
      reset_user_password_secure: {
        Args: { p_email: string; p_new_password: string }
        Returns: Json
      }
      simulate_auth_success: {
        Args: { user_email: string }
        Returns: Json
      }
      test_auth_connection: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_auth_settings: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_manual_auth: {
        Args: { user_email: string; test_password: string }
        Returns: Json
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      update_service_package: {
        Args: {
          p_package_id: string
          p_package_name?: string
          p_description?: string
          p_total_servings?: number
          p_price?: number
          p_is_active?: boolean
          p_max_processing_time_days?: number
          p_max_edits_per_serving?: number
          p_special_notes?: string
          p_total_images?: number
        }
        Returns: {
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
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
      verify_auth_system_health: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      verify_password: {
        Args: { user_email: string; test_password: string }
        Returns: boolean
      }
      verify_user_password: {
        Args: { p_email: string; p_password: string }
        Returns: Json
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
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
