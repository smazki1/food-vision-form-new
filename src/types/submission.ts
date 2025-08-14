export interface CustomerSubmission {
  submission_id: string;
  client_id: string;
  uploaded_at: string;
  processed_at: string | null;
  final_approval_timestamp: string | null;
  assigned_editor_id: string | null;
  edit_history: any;
  lead_id: string | null;
  original_item_id: string | null;
  created_lead_id: string | null;
  processed_image_count: number;
  image_credits_used: number;
  main_processed_image_url: string | null;
  lora_link: string | null;
  lora_name: string | null;
  lora_id: string | null;
  fixed_prompt: string | null;
  restaurant_name: string;
  contact_name: string;
  email: string;
  phone: string;
  branding_material_urls: string[];
  reference_example_urls: string[];
  description: string;
  category: string;
  ingredients: string[];
  item_type: 'dish' | 'drink' | 'cocktail' | 'additional';
  item_name_at_submission: string;
  submission_status: string;
  original_image_urls: string[];
  processed_image_urls: string[];
  selected_style: string | null;
  design_notes: string | null;
  custom_style_data: string | null;
}

// Submission status definitions
export const SUBMISSION_STATUSES = {
  'ממתינה לעיבוד': { label: 'ממתינה לעיבוד', color: 'gray' },
  'בעיבוד': { label: 'בעיבוד', color: 'blue' },
  'מוכנה להצגה': { label: 'מוכנה להצגה', color: 'yellow' },
  'הערות התקבלו': { label: 'הערות התקבלו', color: 'orange' },
  'הושלמה ואושרה': { label: 'הושלמה ואושרה', color: 'green' }
} as const;

export type SubmissionStatusKey = keyof typeof SUBMISSION_STATUSES;
export type SubmissionStatus = typeof SUBMISSION_STATUSES[SubmissionStatusKey];

// Image view mode types
export type ImageViewMode = 'grid' | 'gallery' | 'comparison';

// Submission comment types
export type SubmissionCommentType = 'admin_internal' | 'client_visible' | 'editor_note';

// Image comment types
export type ImageCommentType = 'admin_internal' | 'client_visible' | 'editor_note';

// Image comment interface
export interface ImageComment {
  comment_id: string;
  submission_id: string;
  image_url: string;
  image_type: 'original' | 'processed';
  comment_type: ImageCommentType;
  comment_text: string;
  tagged_users: string[] | null;
  visibility: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Legacy submission comment interface (keeping for backward compatibility)
export interface SubmissionComment {
  comment_id: string;
  submission_id: string;
  comment_type: SubmissionCommentType;
  comment_text: string;
  tagged_users: string[] | null;
  visibility: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
