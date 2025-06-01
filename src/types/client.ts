
// Client types - unified with models.ts
export interface Client {
  client_id: string;
  restaurant_name: string;
  contact_name: string;
  phone: string;
  email: string;
  client_status: string;
  original_lead_id?: string;
  user_auth_id?: string;
  current_package_id?: string;
  remaining_servings: number;
  created_at: string;
  last_activity_at: string;
  internal_notes?: string; // Optional field for compatibility
}

export type ClientStatus = 
  | "פעיל"
  | "לא פעיל"
  | "מושעה";

export const CLIENT_STATUS_OPTIONS: ClientStatus[] = [
  "פעיל",
  "לא פעיל", 
  "מושעה"
];
