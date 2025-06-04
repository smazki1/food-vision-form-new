import { Database } from "@/integrations/supabase/types";

export type CustomerSubmission = Database['public']['Tables']['customer_submissions']['Row'] & {
  service_packages?: {
    package_name: string;
  } | null;
};

// Comment system types
export type SubmissionCommentType = 'admin_internal' | 'client_visible' | 'editor_note';

export type SubmissionCommentVisibility = 'private' | 'client' | 'editor' | 'admin' | 'all';

export type SubmissionComment = {
  comment_id: string;
  submission_id: string;
  comment_type: SubmissionCommentType;
  comment_text: string;
  tagged_users: string[] | null;
  visibility: SubmissionCommentVisibility;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Related data
  created_by_user?: {
    email: string;
    name?: string;
  };
};

// Enhanced submission with comments
export type EnhancedSubmission = CustomerSubmission & {
  comments?: SubmissionComment[];
  lora_link?: string | null;
  lora_name?: string | null;
  fixed_prompt?: string | null;
  lora_id?: string | null;
  created_lead_id?: string | null;
  lead_id?: string | null;
  description?: string | null;
  category?: string | null;
  ingredients?: string[] | null;
  priority?: string | null;
  clients?: { 
    restaurant_name: string; 
    contact_name: string; 
    email: string; 
    phone: string; 
  };
  leads?: { 
    restaurant_name: string; 
    contact_name: string; 
    email: string; 
    phone: string; 
  };
};

// Image management types
export type ImageViewMode = 'grid' | 'comparison' | 'gallery';

export type SubmissionImage = {
  url: string;
  isProcessed: boolean;
  isMain?: boolean;
  uploadedAt?: string;
};

// Status management
export const SUBMISSION_STATUSES = {
  'ממתינה לעיבוד': { color: 'bg-yellow-100 text-yellow-800', label: 'ממתינה לעיבוד' },
  'בעיבוד': { color: 'bg-blue-100 text-blue-800', label: 'בעיבוד' },
  'מוכנה להצגה': { color: 'bg-purple-100 text-purple-800', label: 'מוכנה להצגה' },
  'הערות התקבלו': { color: 'bg-orange-100 text-orange-800', label: 'הערות התקבלו' },
  'הושלמה ואושרה': { color: 'bg-green-100 text-green-800', label: 'הושלמה ואושרה' },
} as const;

export type SubmissionStatusKey = keyof typeof SUBMISSION_STATUSES; 