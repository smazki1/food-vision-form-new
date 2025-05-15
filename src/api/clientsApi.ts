
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/types/lead";

// Check if a client with the given email already exists
export const checkClientExists = async (email: string) => {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
};

// Create a new client from a lead
export const createClientFromLead = async (
  lead: Lead,
  packageId: string,
  servingsCount: number
) => {
  const { data, error } = await supabase
    .from("clients")
    .insert({
      restaurant_name: lead.restaurant_name,
      contact_name: lead.contact_name,
      phone: lead.phone_number,
      email: lead.email,
      original_lead_id: lead.id,
      client_status: "פעיל",
      remaining_servings: servingsCount,
      current_package_id: packageId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};
