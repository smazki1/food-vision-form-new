
import { supabase } from "@/integrations/supabase/client";
import { ClientDetails } from "@/types/food-vision";

/**
 * Checks if a client exists by email and returns client_id if found
 * Otherwise creates a new client and returns the new client_id
 */
export const getOrCreateClient = async (clientDetails: ClientDetails): Promise<string> => {
  try {
    // Check if client already exists by email to prevent duplicates
    const { data: existingClients } = await supabase
      .from('clients')
      .select('client_id, remaining_servings')
      .eq('email', clientDetails.email)
      .limit(1);
      
    // If client doesn't exist, create a new one
    if (!existingClients || existingClients.length === 0) {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          restaurant_name: clientDetails.restaurantName,
          contact_name: clientDetails.contactName,
          phone: clientDetails.phoneNumber,
          email: clientDetails.email
        })
        .select()
        .single();

      if (clientError) throw clientError;
      return clientData.client_id;
    } else {
      // Use existing client ID
      const client_id = existingClients[0].client_id;
      console.log("Using existing client:", client_id);
      
      // If client has no remaining servings, we might want to prevent submission in a production app
      if (existingClients[0].remaining_servings <= 0) {
        console.warn("Client has no remaining servings:", client_id);
        // Note: In a production app, you'd implement further logic here
      }
      
      return client_id;
    }
  } catch (error) {
    console.error("Error in getOrCreateClient:", error);
    throw error;
  }
}
