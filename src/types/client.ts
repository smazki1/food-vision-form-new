
import { Database } from "@/integrations/supabase/types";

export type Client = {
  client_id: string;
  restaurant_name: string;
  contact_name: string;
  phone: string;
  email: string;
  created_at: string;
  original_lead_id: string | null;
  client_status: ClientStatus;
  current_package_id: string | null;
  remaining_servings: number;
  last_activity_at: string;
  internal_notes: string | null;
};

export type ClientStatus = Database["public"]["Enums"]["client_status_type"];

export const CLIENT_STATUS_OPTIONS: ClientStatus[] = [
  "פעיל",
  "לא פעיל",
  "בהמתנה",
];
