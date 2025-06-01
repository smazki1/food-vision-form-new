
// Client types - unified with models.ts
export interface Client {
  client_id: string;
  restaurant_name: string;
  contact_name: string;
  phone: string;
  email: string;
  client_status: ClientStatus;
  original_lead_id?: string;
  user_auth_id?: string;
  current_package_id?: string;
  remaining_servings: number;
  created_at: string;
  last_activity_at: string;
  internal_notes?: string;
  email_notifications?: boolean;
  app_notifications?: boolean;
  service_packages?: {
    package_name: string;
    total_servings: number;
  };
}

export type ClientStatus = 
  | "פעיל"
  | "לא פעיל"
  | "בהמתנה";

export const CLIENT_STATUS_OPTIONS: ClientStatus[] = [
  "פעיל",
  "לא פעיל", 
  "בהמתנה"
];
