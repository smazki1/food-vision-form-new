import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client'; // Corrected Supabase client path again

// Define a basic Lead type for this simple hook
interface SimpleLead {
  lead_id: string;
  restaurant_name: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
  created_at: string | null;
  // Add other essential fields you expect, ensure they exist in the 'leads' table
}

export const useSimpleLeads = () => {
  return useQuery<SimpleLead[], Error>({
    queryKey: ['simple-leads'],
    queryFn: async () => {
      // Basic request, no complex filters, sorting, or joins
      const { data, error } = await supabase
        .from('leads')
        .select('lead_id, restaurant_name, contact_name, phone, email, status, created_at'); // Corrected id to lead_id based on schema
      
      if (error) {
        console.error("Error in useSimpleLeads:", error);
        throw error;
      }
      
      return data || [];
    },
  });
}; 