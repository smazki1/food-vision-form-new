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
  updated_at: string;
  notes: string | null;
  reminder_at: string | null;
  reminder_details: string | null;
  free_sample_package_active: boolean;
};

// Legacy enums - kept for backward compatibility
export type LeadStatus = Database["public"]["Enums"]["lead_status_type"];
export type LeadSource = Database["public"]["Enums"]["lead_source_type"];

// Enhanced Lead type with comprehensive CRM fields
export type Lead = {
  lead_id: string;
  restaurant_name: string;
  contact_name: string;
  phone: string;
  email: string;
  website_url?: string;
  address?: string;
  business_type?: string;
  is_archived?: boolean;
  lead_status: LeadStatusEnum;
  
  // AI Cost tracking with multiple tiers
  ai_trainings_count: number; // Legacy field, kept for compatibility
  ai_training_25_count?: number; // $2.5 training
  ai_training_15_count?: number; // $1.5 training  
  ai_training_5_count?: number;  // $5.0 training
  ai_training_cost_per_unit: number;
  ai_prompts_count: number;
  ai_prompt_cost_per_unit: number;
  total_ai_costs?: number; // Generated column
  
  // Revenue and ROI
  revenue_from_lead_local?: number;
  exchange_rate_at_conversion?: number;
  revenue_from_lead_usd?: number; // Generated column
  roi?: number; // Generated column
  
  // Lead management
  lead_source?: LeadSourceEnum;
  created_at: string;
  updated_at: string;
  next_follow_up_date?: string;
  notes?: string;
  next_follow_up_notes?: string;
  reminder_notes?: string;
  
  // Conversion tracking
  client_id?: string;
  conversion_reason?: string;
  rejection_reason?: string;
  free_sample_package_active: boolean;
  
  // Relation fields
  lora_page_url?: string;
  style_description?: string;
  custom_prompt?: string;
  
  // Legacy fields
  previous_status?: string;
};

// Business Type
export type BusinessType = {
  id: string;
  type_name: string;
  created_at: string;
  created_by?: string;
};

// Lead Submission Relationship
export type LeadSubmission = {
  id: string;
  lead_id: string;
  submission_id: string;
  created_at: string;
};

// Enhanced Lead Reminder
export type LeadReminder = {
  id: string;
  lead_id: string;
  reminder_date: string;
  reminder_type: string;
  title: string;
  description?: string;
  is_completed: boolean;
  completed_at?: string;
  created_by?: string;
  created_at: string;
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

// Enhanced Lead with related data
export type EnhancedLead = Lead & {
  submissions?: LeadSubmission[];
  reminders?: LeadReminder[];
  activities?: LeadActivity[];
  comments?: LeadComment[];
  business_type_info?: BusinessType;
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
  CAMPAIGN = 'campaign', // קמפיין
  TELEMARKETING = 'telemarketing', // טלמרקטינג
  AUTO_SUBMISSION = 'auto_submission',
  OTHER = 'other'
}

// AI Training Cost Tiers
export const AI_TRAINING_TIERS = {
  TIER_25: { cost: 2.5, label: 'אימון $2.5' },
  TIER_15: { cost: 1.5, label: 'אימון $1.5' },
  TIER_5: { cost: 5.0, label: 'אימון $5.0' }
} as const;

export const AI_PROMPT_COST = 0.16;
export const USD_TO_ILS_RATE = 3.6; // Can be made dynamic later

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

// Enhanced source options including new values
export const LEAD_SOURCE_OPTIONS = [
  "אתר",
  "הפניה", 
  "פייסבוק",
  "אינסטגרם",
  "קמפיין",
  "טלמרקטינג",
  "אחר",
] as const;

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

// Enhanced mapping from source enum to display text including new sources
export const LEAD_SOURCE_DISPLAY: Record<LeadSourceEnum, string> = {
  [LeadSourceEnum.WEBSITE]: 'אתר',
  [LeadSourceEnum.REFERRAL]: 'הפניה',
  [LeadSourceEnum.FACEBOOK]: 'פייסבוק',
  [LeadSourceEnum.INSTAGRAM]: 'אינסטגרם',
  [LeadSourceEnum.CAMPAIGN]: 'קמפיין',
  [LeadSourceEnum.TELEMARKETING]: 'טלמרקטינג',
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

// Enhanced filters
export type EnhancedLeadsFilter = {
  searchTerm?: string;
  status?: LeadStatusEnum | 'all';
  leadSource?: LeadSourceEnum | 'all';
  businessType?: string | 'all';
  dateFilter?: 'today' | 'this-week' | 'this-month' | 'all';
  onlyReminders?: boolean;
  remindersToday?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  excludeArchived?: boolean;
  onlyArchived?: boolean;
  hasDemoPackage?: boolean;
  hasConversions?: boolean;
};

// Cost calculation utilities
export const calculateTotalAICosts = (lead: Partial<Lead>): number => {
  const training25Cost = (lead.ai_training_25_count || 0) * AI_TRAINING_TIERS.TIER_25.cost;
  const training15Cost = (lead.ai_training_15_count || 0) * AI_TRAINING_TIERS.TIER_15.cost;
  const training5Cost = (lead.ai_training_5_count || 0) * AI_TRAINING_TIERS.TIER_5.cost;
  const promptCost = (lead.ai_prompts_count || 0) * AI_PROMPT_COST;
  
  return training25Cost + training15Cost + training5Cost + promptCost;
};

export const calculateROI = (revenue: number, costs: number): number | null => {
  if (costs <= 0) return null;
  return ((revenue - costs) / costs) * 100;
};

export const convertUSDToILS = (usdAmount: number, rate: number = USD_TO_ILS_RATE): number => {
  return usdAmount * rate;
};

export const convertILSToUSD = (ilsAmount: number, rate: number = USD_TO_ILS_RATE): number => {
  return ilsAmount / rate;
};

// Form validation schemas (can be used with zod)
export const LeadFormFields = {
  REQUIRED: ['restaurant_name', 'contact_name', 'phone', 'email'] as const,
  OPTIONAL: ['website_url', 'address', 'business_type', 'style_description', 'custom_prompt', 'notes'] as const,
  COST_TRACKING: ['ai_training_25_count', 'ai_training_15_count', 'ai_training_5_count', 'ai_prompts_count'] as const,
  REVENUE: ['revenue_from_lead_local', 'exchange_rate_at_conversion'] as const
} as const;
