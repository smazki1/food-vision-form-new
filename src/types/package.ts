
import { Database } from "@/integrations/supabase/types";

export interface Package {
  package_id: string;
  package_name: string;
  description?: string;
  total_servings: number;
  price: number;
  is_active: boolean;
  features_tags?: string[];
  max_processing_time_days?: number;
  max_edits_per_serving: number;
  created_at: string;
  updated_at: string;
}

// TODO: Remove once we fully migrate to database storage
export const MOCK_PACKAGES: Package[] = [
  {
    package_id: "basic",
    package_name: "חבילה בסיסית",
    total_servings: 5,
    price: 500,
    description: "חבילה בסיסית עם 5 מנות",
    is_active: true,
    max_edits_per_serving: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    package_id: "standard",
    package_name: "חבילה סטנדרטית",
    total_servings: 15,
    price: 1200,
    description: "חבילה סטנדרטית עם 15 מנות",
    is_active: true,
    max_edits_per_serving: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    package_id: "premium",
    package_name: "חבילה פרימיום",
    total_servings: 30,
    price: 2000,
    description: "חבילה פרימיום עם 30 מנות",
    is_active: true,
    max_edits_per_serving: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
