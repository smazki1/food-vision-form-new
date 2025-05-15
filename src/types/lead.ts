
import { Database } from "@/integrations/supabase/types";

export type Lead = {
  id: string;
  restaurant_name: string;
  contact_name: string;
  phone_number: string;
  email: string;
  lead_status: LeadStatus;
  lead_source: LeadSource | null;
  created_at: string;
  last_updated_at: string;
  notes: string | null;
  reminder_at: string | null;
  reminder_details: string | null;
  free_sample_package_active: boolean;
};

export type LeadStatus = Database["public"]["Enums"]["lead_status_type"];

export type LeadSource = Database["public"]["Enums"]["lead_source_type"];

export const LEAD_STATUS_OPTIONS: LeadStatus[] = [
  "ליד חדש",
  "פנייה ראשונית בוצעה",
  "מעוניין",
  "לא מעוניין",
  "נקבעה פגישה/שיחה",
  "הדגמה בוצעה",
  "הצעת מחיר נשלחה",
  "ממתין לתשובה",
  "הפך ללקוח",
];

export const LEAD_SOURCE_OPTIONS: LeadSource[] = [
  "אתר",
  "הפניה",
  "פייסבוק",
  "אינסטגרם",
  "אחר",
];
