
// src/types/models.ts
import type { LeadStatus, LeadSource, ClientStatus, SubmissionStatus } from '@/constants/statusTypes';

export interface Lead {
  lead_id: string;
  id?: string; // For backward compatibility
  restaurant_name: string;
  contact_name: string;
  phone: string;
  phone_number?: string; // For backward compatibility
  email: string;
  lead_status: LeadStatus;
  lead_source: LeadSource | null;
  created_at: string;
  updated_at: string;
  last_updated_at?: string; // For backward compatibility
  next_follow_up_date?: string;
  next_follow_up_notes?: string;
  reminder_at?: string | null; // For backward compatibility
  reminder_details?: string | null; // For backward compatibility
  notes?: string;
  ai_trainings_count: number;
  ai_training_cost_per_unit: number;
  ai_prompts_count: number;
  ai_prompt_cost_per_unit: number;
  total_ai_costs?: number;
  revenue_from_lead_local?: number;
  exchange_rate_at_conversion?: number;
  revenue_from_lead_usd?: number;
  roi?: number;
  client_id?: string;
  free_sample_package_active: boolean;
}

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
  created_lead_id?: string;
}

export type { LeadStatus, LeadSource, ClientStatus };
