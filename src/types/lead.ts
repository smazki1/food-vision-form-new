import { Database } from "@/integrations/supabase/types";

// Legacy Lead type - kept for backward compatibility during migration
export type LegacyLead = {
  id: string;
  restaurant_name: string;
  contact_name: string;
  phone: string;
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

// Legacy enums - kept for backward compatibility
export type LeadStatus = Database["public"]["Enums"]["lead_status_type"];
export type LeadSource = Database["public"]["Enums"]["lead_source_type"];

// New Lead type matching the enhanced schema
export type Lead = {
  lead_id: string;
  restaurant_name: string;
  contact_name: string;
  phone: string;
  email: string;
  website_url?: string;
  address?: string;
  lead_status: LeadStatusEnum;
  ai_trainings_count: number;
  ai_training_cost_per_unit: number;
  ai_prompts_count: number;
  ai_prompt_cost_per_unit: number;
  total_ai_costs?: number; // Generated column
  revenue_from_lead_local?: number;
  exchange_rate_at_conversion?: number;
  revenue_from_lead_usd?: number; // Generated column
  roi?: number; // Generated column
  lead_source?: LeadSourceEnum;
  created_at: string;
  updated_at: string;
  next_follow_up_date?: string;
  notes?: string;
  next_follow_up_notes?: string;
  client_id?: string;
  free_sample_package_active: boolean;
  previous_status?: string;
};

// Activity log entry
export type LeadActivity = {
  activity_id: string;
  lead_id: string;
  activity_timestamp: string;
  activity_description: string;
  user_id?: string;
};

// Comment entry
export type LeadComment = {
  comment_id: string;
  lead_id: string;
  comment_timestamp: string;
  comment_text: string;
  user_id?: string;
};

// AI Pricing Setting
export type AIPricingSetting = {
  setting_id: string;
  setting_name: string;
  setting_value: number;
  description?: string;
  last_updated_by?: string;
  updated_at: string;
};

// New enum types matching the database enums
export enum LeadStatusEnum {
  NEW = 'new',
  CONTACTED = 'contacted',
  INTERESTED_SENT_PICS = 'interested_sent_pics',
  WAITING_REPLY = 'waiting_reply',
  MEETING_SCHEDULED = 'meeting_scheduled',
  DEMO_DONE = 'demo_done',
  QUOTE_SENT = 'quote_sent',
  COLD_FOLLOW_UP = 'cold_follow_up',
  NOT_INTERESTED = 'not_interested',
  CONVERTED_TO_CLIENT = 'converted_to_client',
  ARCHIVED = 'archived'
}

export enum LeadSourceEnum {
  WEBSITE = 'website',
  REFERRAL = 'referral',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  AUTO_SUBMISSION = 'auto_submission',
  OTHER = 'other'
}

// Legacy status options - kept for backward compatibility
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

// Legacy source options - kept for backward compatibility
export const LEAD_SOURCE_OPTIONS: LeadSource[] = [
  "אתר",
  "הפניה",
  "פייסבוק",
  "אינסטגרם",
  "אחר",
];

// New status options
export const LEAD_STATUS_ENUM_OPTIONS = Object.values(LeadStatusEnum);

// New source options
export const LEAD_SOURCE_ENUM_OPTIONS = Object.values(LeadSourceEnum);

// Mapping from status enum to the *actual Hebrew string values in the DB enum lead_status_type*
export const LEAD_STATUS_DB_MAP: Record<LeadStatusEnum, string> = {
  [LeadStatusEnum.NEW]: 'ליד חדש',
  [LeadStatusEnum.CONTACTED]: 'פנייה ראשונית בוצעה',
  [LeadStatusEnum.INTERESTED_SENT_PICS]: 'מעוניין', // Corrected: Simple DB value
  [LeadStatusEnum.WAITING_REPLY]: 'ממתין לתשובה',
  [LeadStatusEnum.MEETING_SCHEDULED]: 'נקבעה פגישה/שיחה',
  [LeadStatusEnum.DEMO_DONE]: 'הדגמה בוצעה',
  [LeadStatusEnum.QUOTE_SENT]: 'הצעת מחיר נשלחה',
  [LeadStatusEnum.COLD_FOLLOW_UP]: 'ליד קר - לחזור אליו', // Assuming this is a valid DB enum or will be handled if not
  [LeadStatusEnum.NOT_INTERESTED]: 'לא מעוניין',
  [LeadStatusEnum.CONVERTED_TO_CLIENT]: 'הפך ללקוח',
  [LeadStatusEnum.ARCHIVED]: 'ארכיון' // Assuming this is a valid DB enum or will be added
};

// Mapping from status enum to display text (more descriptive for UI)
export const LEAD_STATUS_DISPLAY: Record<LeadStatusEnum, string> = {
  [LeadStatusEnum.NEW]: 'ליד חדש',
  [LeadStatusEnum.CONTACTED]: 'פנייה ראשונית בוצעה',
  [LeadStatusEnum.INTERESTED_SENT_PICS]: 'מעוניין - שלחתי תמונות',
  [LeadStatusEnum.WAITING_REPLY]: 'ממתין לתשובה',
  [LeadStatusEnum.MEETING_SCHEDULED]: 'נקבעה פגישה/שיחה',
  [LeadStatusEnum.DEMO_DONE]: 'הדגמה בוצעה',
  [LeadStatusEnum.QUOTE_SENT]: 'הצעת מחיר נשלחה',
  [LeadStatusEnum.COLD_FOLLOW_UP]: 'ליד קר - לחזור אליו',
  [LeadStatusEnum.NOT_INTERESTED]: 'לא מעוניין',
  [LeadStatusEnum.CONVERTED_TO_CLIENT]: 'הפך ללקוח',
  [LeadStatusEnum.ARCHIVED]: 'ארכיון'
};

// Mapping from source enum to display text
export const LEAD_SOURCE_DISPLAY: Record<LeadSourceEnum, string> = {
  [LeadSourceEnum.WEBSITE]: 'אתר',
  [LeadSourceEnum.REFERRAL]: 'הפניה',
  [LeadSourceEnum.FACEBOOK]: 'פייסבוק',
  [LeadSourceEnum.INSTAGRAM]: 'אינסטגרם',
  [LeadSourceEnum.AUTO_SUBMISSION]: 'הגשה אוטומטית',
  [LeadSourceEnum.OTHER]: 'אחר'
};

// Function to map English Enum value (used in code) to Hebrew string (used in DB)
export const mapLeadStatusToHebrew = (statusEnum?: LeadStatusEnum): string | undefined => {
  if (!statusEnum) return undefined;
  return LEAD_STATUS_DB_MAP[statusEnum]; // Changed to use the new DB map
};

export const mapLeadSourceToHebrew = (sourceEnum?: LeadSourceEnum): string | undefined => {
  if (!sourceEnum) return undefined;
  return LEAD_SOURCE_DISPLAY[sourceEnum];
};

// Function to map Hebrew string (from DB or UI) to English Enum value (for code use)
export const mapHebrewToLeadStatusEnum = (hebrewStatus?: string): LeadStatusEnum | undefined => {
  if (!hebrewStatus) return undefined;
  // This function might need to check against both LEAD_STATUS_DB_MAP and LEAD_STATUS_DISPLAY
  // if the input could be either a DB value or a display value.
  // For now, assuming input `hebrewStatus` is a DB value for mapping back to Enum.
  let entry = Object.entries(LEAD_STATUS_DB_MAP).find(([, value]) => value === hebrewStatus);
  // Fallback to checking display map if not found in DB map (e.g., if UI sends display value back)
  if (!entry) {
    entry = Object.entries(LEAD_STATUS_DISPLAY).find(([, value]) => value === hebrewStatus);
  }
  return entry ? entry[0] as LeadStatusEnum : undefined;
};

export const mapHebrewToLeadSourceEnum = (hebrewSource?: string): LeadSourceEnum | undefined => {
  if (!hebrewSource) return undefined;
  const entry = Object.entries(LEAD_SOURCE_DISPLAY).find(([, value]) => value === hebrewSource);
  return entry ? entry[0] as LeadSourceEnum : undefined;
};

// Filter for leads list
export type LeadsFilter = {
  searchTerm?: string;
  status?: LeadStatusEnum | 'all';
  leadSource?: LeadSourceEnum | 'all';
  dateFilter?: 'today' | 'this-week' | 'this-month' | 'all';
  onlyReminders?: boolean;
  remindersToday?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  excludeArchived?: boolean;
  onlyArchived?: boolean;
};
