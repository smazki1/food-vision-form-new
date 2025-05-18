import { Database } from "@/integrations/supabase/types";

export type CustomerSubmission = Database['public']['Tables']['customer_submissions']['Row'] & {
  service_packages?: {
    package_name: string;
  } | null;
}; 