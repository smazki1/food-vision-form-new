// src/types/models.ts
import type { LeadStatus, LeadSource, ClientStatus, SubmissionStatus } from '@/constants/statusTypes';

export interface Lead {
  lead_id: string;
  restaurant_name: string;
  contact_name: string;
  phone: string; // סטנדרטיזציה של שם השדה
  email: string;
  lead_status: LeadStatus;
  lead_source: LeadSource | null;
  created_at: string;
  updated_at: string;
  next_follow_up_date?: string;
  next_follow_up_notes?: string;
  notes?: string;
  ai_trainings_count: number;
  ai_training_cost_per_unit: number;
  ai_prompts_count: number;
  ai_prompt_cost_per_unit: number;
  total_ai_costs?: number; // שדה מחושב
  revenue_from_lead_local?: number;
  exchange_rate_at_conversion?: number;
  revenue_from_lead_usd?: number; // שדה מחושב
  roi?: number; // שדה מחושב
  client_id?: string; // קישור ללקוח אם הומר
  free_sample_package_active: boolean;
}

export interface Client {
  client_id: string;
  restaurant_name: string;
  contact_name: string;
  phone: string;
  email: string;
  client_status: ClientStatus;
  original_lead_id?: string; // קישור לליד המקורי
  user_auth_id?: string;
  current_package_id?: string;
  remaining_servings: number;
  created_at: string;
  last_activity_at: string;
  // שאר השדות הרלוונטיים
}

export interface Submission {
  submission_id: string;
  restaurant_name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  item_type: 'dish' | 'cocktail' | 'drink';
  item_name: string;
  description?: string;
  special_notes?: string;
  image_urls: string[];
  status: SubmissionStatus;
  created_at: string;
  created_lead_id?: string; // קישור לליד שנוצר אם יש
}

// וכן הלאה עבור מודלים נוספים
export type { LeadStatus, ClientStatus }; 