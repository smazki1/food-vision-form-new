import { Database } from "@/integrations/supabase/types";

export type Client = {
  client_id: string;
  restaurant_name: string;
  contact_name: string;
  phone: string;
  email: string;
  created_at: string;
  updated_at: string;
  original_lead_id: string | null;
  client_status: string;
  current_package_id: string | null;
  remaining_servings: number;
  remaining_images: number;
  consumed_images: number;
  reserved_images: number;
  last_activity_at: string;
  internal_notes: string | null;
  user_auth_id: string | null;
  email_notifications?: boolean;
  app_notifications?: boolean;
  website_url?: string | null;
  address?: string | null;
  business_type?: string | null;
  payment_status?: string | null;
  payment_due_date?: string | null;
  payment_amount_ils?: number | null;
  archive_status?: string | null;
  next_follow_up_date?: string | null;
  reminder_details?: string | null;
  notes?: string | null;
  service_packages?: {
    package_name: string;
    total_servings: number;
  };
};

export const CLIENT_STATUS_OPTIONS: string[] = [
  "פעיל",
  "לא פעיל", 
  "בהמתנה",
  "מושהה",
  "ארכיון"
];
