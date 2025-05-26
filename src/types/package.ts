
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

// Add ServicePackage as an alias for Package for backward compatibility
export type ServicePackage = Package;

// Updated with real IDs from the database for the primary three tiers
export const MOCK_PACKAGES: Package[] = [
  {
    package_id: "2ab154ff-e697-495e-85e1-8a3cffff2f82", // Real ID
    package_name: "חבילה בסיסית",
    total_servings: 5,
    price: 500,
    description: "חבילה בסיסית עם 5 מנות",
    is_active: true,
    max_edits_per_serving: 1, // Retained from original mock logic
    created_at: new Date().toISOString(), // Keep as is, not critical for this mock usage
    updated_at: new Date().toISOString()  // Keep as is
  },
  {
    package_id: "128cb968-1267-4ee2-a4e6-00dc4d5e3702", // Real ID
    package_name: "חבילה סטנדרטית",
    total_servings: 15,
    price: 1200,
    description: "חבילה סטנדרטית עם 15 מנות",
    is_active: true,
    max_edits_per_serving: 2, // Retained from original mock logic
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    package_id: "378b7c01-4abf-4cbd-abb3-33c6a79d5437", // Real ID
    package_name: "חבילה פרימיום",
    total_servings: 30,
    price: 2000,
    description: "חבילה פרימיום עם 30 מנות",
    is_active: true,
    max_edits_per_serving: 3, // Retained from original mock logic
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
