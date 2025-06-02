
// Database types
export type LeadStatus = 'ליד חדש' | 'בטיפול' | 'מעוניין' | 'לא מעוניין' | 'הפך ללקוח' | 'ארכיון';
export type LeadSource = 'אתר' | 'חברים' | 'פייסבוק' | 'אינסטגרם' | 'גוגל' | 'אחר';

// Enum versions for type safety
export enum LeadStatusEnum {
  NEW = 'ליד חדש',
  IN_TREATMENT = 'בטיפול', 
  INTERESTED = 'מעוניין',
  NOT_INTERESTED = 'לא מעוניין',
  CONVERTED_TO_CLIENT = 'הפך ללקוח',
  ARCHIVED = 'ארכיון'
}

export enum LeadSourceEnum {
  WEBSITE = 'אתר',
  FRIENDS = 'חברים',
  FACEBOOK = 'פייסבוק', 
  INSTAGRAM = 'אינסטגרם',
  GOOGLE = 'גוגל',
  OTHER = 'אחר'
}

// Display mappings
export const LEAD_STATUS_DISPLAY: Record<LeadStatusEnum, string> = {
  [LeadStatusEnum.NEW]: 'ליד חדש',
  [LeadStatusEnum.IN_TREATMENT]: 'בטיפול',
  [LeadStatusEnum.INTERESTED]: 'מעוניין', 
  [LeadStatusEnum.NOT_INTERESTED]: 'לא מעוניין',
  [LeadStatusEnum.CONVERTED_TO_CLIENT]: 'הפך ללקוח',
  [LeadStatusEnum.ARCHIVED]: 'ארכיון'
};

export const LEAD_SOURCE_DISPLAY: Record<LeadSourceEnum, string> = {
  [LeadSourceEnum.WEBSITE]: 'אתר',
  [LeadSourceEnum.FRIENDS]: 'חברים',
  [LeadSourceEnum.FACEBOOK]: 'פייסבוק',
  [LeadSourceEnum.INSTAGRAM]: 'אינסטגרם', 
  [LeadSourceEnum.GOOGLE]: 'גוגל',
  [LeadSourceEnum.OTHER]: 'אחר'
};

// Helper functions for mapping
export const mapLeadStatusToHebrew = (status: LeadStatusEnum): string => {
  return LEAD_STATUS_DISPLAY[status] || status;
};

export const mapHebrewToLeadStatusEnum = (hebrew: string): LeadStatusEnum => {
  const entry = Object.entries(LEAD_STATUS_DISPLAY).find(([_, value]) => value === hebrew);
  return entry ? entry[0] as LeadStatusEnum : LeadStatusEnum.NEW;
};

export const mapLeadSourceToHebrew = (source: LeadSourceEnum): string => {
  return LEAD_SOURCE_DISPLAY[source] || source;
};

export const mapHebrewToLeadSourceEnum = (hebrew: string): LeadSourceEnum => {
  const entry = Object.entries(LEAD_SOURCE_DISPLAY).find(([_, value]) => value === hebrew);
  return entry ? entry[0] as LeadSourceEnum : LeadSourceEnum.OTHER;
};

// Main Lead interface
export interface Lead {
  lead_id: string;
  restaurant_name: string;
  contact_name: string;
  phone: string;
  email: string;
  website_url?: string;
  address?: string;
  lead_status: LeadStatusEnum;
  lead_source?: LeadSourceEnum | null;
  notes?: string;
  created_at: string;
  updated_at: string;
  next_follow_up_date?: string;
  next_follow_up_notes?: string;
  reminder_at?: string;
  reminder_details?: string;
  ai_trainings_count: number;
  ai_training_cost_per_unit: number;
  ai_prompts_count: number;
  ai_prompt_cost_per_unit: number;
  revenue_from_lead_local: number;
  exchange_rate_at_conversion: number;
  client_id?: string;
  free_sample_package_active: boolean;
  id: string; // Alias for lead_id for compatibility
  revenue_from_lead_usd?: number;
  business_type?: string;
  lora_page_url?: string;
  style_description?: string;
  custom_prompt?: string;
  reminder_notes?: string;
  conversion_reason?: string;
  rejection_reason?: string;
  archived_at?: string;
  total_ai_costs?: number;
  roi?: number;
  ai_training_5_count?: number;
  ai_training_15_count?: number;
  ai_training_25_count?: number;
  is_archived?: boolean;
}

// Lead activity and comment interfaces
export interface LeadActivity {
  activity_id: string;
  lead_id: string;
  activity_description: string;
  activity_timestamp: string;
  user_id?: string;
}

export interface LeadComment {
  comment_id: string;
  lead_id: string;
  comment_text: string;
  comment_timestamp: string;
  user_id?: string;
}

// Legacy Lead interface for backward compatibility
export interface LegacyLead {
  lead_id: string;
  restaurant_name: string;
  contact_name: string;
  phone: string;
  email: string;
  lead_status: string;
  created_at: string;
  updated_at: string;
}

// Lead source options for forms
export const LEAD_SOURCE_OPTIONS = [
  { value: LeadSourceEnum.WEBSITE, label: 'אתר' },
  { value: LeadSourceEnum.FRIENDS, label: 'חברים' },
  { value: LeadSourceEnum.FACEBOOK, label: 'פייסבוק' },
  { value: LeadSourceEnum.INSTAGRAM, label: 'אינסטגרם' },
  { value: LeadSourceEnum.GOOGLE, label: 'גוגל' },
  { value: LeadSourceEnum.OTHER, label: 'אחר' },
];

// Utility functions
export const calculateTotalAICosts = (lead: Lead): number => {
  const trainingCosts = (lead.ai_trainings_count || 0) * (lead.ai_training_cost_per_unit || 0);
  const promptCosts = (lead.ai_prompts_count || 0) * (lead.ai_prompt_cost_per_unit || 0);
  const training5Costs = (lead.ai_training_5_count || 0) * 5;
  const training15Costs = (lead.ai_training_15_count || 0) * 15;
  const training25Costs = (lead.ai_training_25_count || 0) * 25;
  
  return trainingCosts + promptCosts + training5Costs + training15Costs + training25Costs;
};

export const convertUSDToILS = (usdAmount: number, exchangeRate: number = 3.6): number => {
  return usdAmount * exchangeRate;
};

// AI Pricing Settings interface
export interface AIPricingSetting {
  setting_id: string;
  setting_name: string;
  setting_value: number;
  description?: string;
  last_updated_by?: string;
  updated_at: string;
}

// Enhanced leads filter interface
export interface EnhancedLeadsFilter {
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
  page?: number;
  pageSize?: number;
}
