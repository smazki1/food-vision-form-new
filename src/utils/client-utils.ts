import { supabase } from "@/integrations/supabase/client";
import { ClientDetails } from "@/types/food-vision";

/**
 * Checks if a client exists by email or authUserId and returns client_id if found.
 * Otherwise creates a new client and returns the new client_id.
 * Ensures the client record is appropriately linked to the authUserId.
 */
export const getOrCreateClient = async (
  clientDetails: ClientDetails, 
  authUserIdParam?: string // Renamed to avoid conflict, optional current authenticated user ID
): Promise<string> => {
  let effectiveAuthUserId = authUserIdParam; // Initialize with the parameter

  try {
    // If authUserId is not provided from param, try to get it from the current session
    if (!effectiveAuthUserId) {
      console.log("[getOrCreateClient] authUserId not provided, attempting to get from session.");
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.warn("[getOrCreateClient] Error fetching session:", sessionError);
        // Proceed without authUserId if session fetch fails
      } else if (sessionData?.session?.user?.id) {
        effectiveAuthUserId = sessionData.session.user.id;
        console.log(`[getOrCreateClient] authUserId from session: ${effectiveAuthUserId}`);
      } else {
        console.log("[getOrCreateClient] No active session or user ID in session.");
      }
    }

    let clientToUseId: string | null = null;
    let clientFoundBy: string | null = null;

    // Priority 1: Try to find a client linked to the current auth user ID
    if (effectiveAuthUserId) { // Now use effectiveAuthUserId which might be from param or session
      console.log(`[getOrCreateClient] Attempting to find client by authUserId: ${effectiveAuthUserId}`);
      const { data: userLinkedClient, error: userLinkedClientError } = await supabase
        .from('clients')
        .select('client_id, email, user_auth_id, remaining_servings')
        .eq('user_auth_id', effectiveAuthUserId)
        .single();

      if (userLinkedClientError && userLinkedClientError.code !== 'PGRST116') { // PGRST116 = 0 rows, not an error for .single()
        console.error("[getOrCreateClient] Error fetching client by authUserId:", userLinkedClientError);
        // Don't throw yet, allow fallback to email match or creation.
      }
      if (userLinkedClient) {
        clientToUseId = userLinkedClient.client_id;
        clientFoundBy = "authUserId";
        console.log(`[getOrCreateClient] Found client ${clientToUseId} by authUserId ${effectiveAuthUserId}.`);
        // Optional: Update client details from form if they differ and logic allows.
        // Example: if (userLinkedClient.email !== clientDetails.email) { /* update logic */ }
      }
    }

    // Priority 2: If no client found by authUserId, try by email
    if (!clientToUseId && clientDetails.email) {
      console.log(`[getOrCreateClient] Client not found by authUserId, attempting by email: ${clientDetails.email}`);
      const { data: emailMatchClients, error: emailMatchError } = await supabase
        .from('clients')
        .select('client_id, user_auth_id, remaining_servings')
        .eq('email', clientDetails.email)
        .limit(1); // Take the first match if multiple (though email should ideally be unique)

      if (emailMatchError) {
        console.error("[getOrCreateClient] Error fetching client by email:", emailMatchError);
        // Don't throw yet, allow fallback to creation.
      }

      if (emailMatchClients && emailMatchClients.length > 0) {
        const existingClientByEmail = emailMatchClients[0];
        
        if (effectiveAuthUserId) {
          if (!existingClientByEmail.user_auth_id) {
            // Email match found, client is unlinked, and user is logged in: Link them.
            console.log(`[getOrCreateClient] Client ${existingClientByEmail.client_id} (email: ${clientDetails.email}) found unlinked. Linking to authUserId ${effectiveAuthUserId}.`);
            const { error: updateError } = await supabase
              .from('clients')
              .update({ user_auth_id: effectiveAuthUserId })
              .eq('client_id', existingClientByEmail.client_id)
              .select('client_id')
              .single();

            if (updateError) {
              console.error(`[getOrCreateClient] Failed to link authUserId ${effectiveAuthUserId} to client ${existingClientByEmail.client_id}:`, updateError);
              // Throw an error if linking fails, as this is a critical step when an authUserId is provided for an existing anonymous client.
              throw new Error(`Failed to update client ${existingClientByEmail.client_id} with new authUserId: ${updateError.message}`);
            }
            clientToUseId = existingClientByEmail.client_id;
            clientFoundBy = "email_linked_now";
          } else if (existingClientByEmail.user_auth_id === effectiveAuthUserId) {
            // Email match found, and it's already linked to the current auth user. Good.
            clientToUseId = existingClientByEmail.client_id;
            clientFoundBy = "email_already_linked_to_user";
            console.log(`[getOrCreateClient] Client ${clientToUseId} (email: ${clientDetails.email}) found, already linked to authUserId ${effectiveAuthUserId}.`);
          } else {
            // Email match found, but it's linked to a DIFFERENT auth user. This is a conflict.
            console.warn(`[getOrCreateClient] CONFLICT: Email ${clientDetails.email} matches client ${existingClientByEmail.client_id}, but it's linked to a different auth user (${existingClientByEmail.user_auth_id}) than current (${effectiveAuthUserId}).`);
            // Business decision needed:
            // 1. Fail (throw error) - Safest default for now.
            // 2. Create a new client for current authUser (ignoring email match, potentially leading to duplicate emails if not unique constraint).
            // 3. Allow current authUser to "take over" (requires careful verification, not implemented here).
            throw new Error(`Client email conflict: This email is already registered to a different user account. Please use a different email or log in to the correct account.`);
          }
        } else {
          // No authUserId provided (e.g., anonymous submission), but found a client by email. Use it.
          clientToUseId = existingClientByEmail.client_id;
          clientFoundBy = "email_anonymous_user";
          console.log(`[getOrCreateClient] Client ${clientToUseId} (email: ${clientDetails.email}) found for anonymous user.`);
        }
      }
    }

    // Priority 3: If still no client, create a new one
    if (!clientToUseId) {
      console.log(`[getOrCreateClient] No client found by ${clientFoundBy || 'any method'}. Creating new client for email ${clientDetails.email} and authUserId ${effectiveAuthUserId || 'N/A'}.`);
      
      let packageIdForNewClient: string | null = null;
      let servingsForNewClient: number = 0;

      try {
        // @ts-ignore TypeScript struggles with this specific Supabase SDK chaining for reasons not immediately obvious
        const { data: tastingPackage, error: packageError } = await supabase
          .from('service_packages')
          .select('package_id, total_servings')
          .eq('package_name', 'חבילת טעימה חינמית') // CORRECTED: Changed from 'name' to 'package_name'
          .eq('is_active', true)    // Make sure to get an active package
          .single();

        if (packageError && packageError.code !== 'PGRST116') { // PGRST116 means no rows found, not an error here
          console.error('[getOrCreateClient] Error fetching "חבילת טעימה חינמית" package:', packageError);
        }
        
        if (tastingPackage) {
          packageIdForNewClient = tastingPackage.package_id;
          servingsForNewClient = tastingPackage.total_servings; // Should be 1 as per confirmation
          console.log(`[getOrCreateClient] Found "חבילת טעימה חינמית" package ID: ${packageIdForNewClient} with ${servingsForNewClient} servings.`);
        } else {
          console.warn('[getOrCreateClient] "חבילת טעימה חינמית" package not found or not active. New client will have no initial package.');
        }
      } catch (e) {
        console.error('[getOrCreateClient] Exception while fetching "חבילת טעימה חינמית" package:', e);
      }

      const newClientPayload = {
        restaurant_name: clientDetails.restaurantName,
        contact_name: clientDetails.contactName,
        phone: clientDetails.phoneNumber,
        email: clientDetails.email,
        user_auth_id: effectiveAuthUserId, 
        current_package_id: packageIdForNewClient,
        remaining_servings: servingsForNewClient
      };
      
      console.log("[getOrCreateClient] Inserting new client with payload:", newClientPayload);
      
      // Perform the insert
      const { data, error } = await supabase
        .from('clients')
        .insert(newClientPayload)
        .select('client_id')
        .single();

      // Handle the response data and error separately
      const newClientError = error;
      const newClientData = data as { client_id: string } | null;

      if (newClientError) {
        console.error("[getOrCreateClient] Error creating new client:", newClientError);
        throw newClientError;
      }
      if (!newClientData || !newClientData.client_id) {
          console.error("[getOrCreateClient] Failed to create new client or retrieve its ID, newClientData is null/undefined or client_id is missing.");
          throw new Error("Client creation failed: No data or client_id returned after insert.");
      }
      clientToUseId = newClientData.client_id;
      clientFoundBy = "newly_created";
      console.log(`[getOrCreateClient] Successfully created new client ${clientToUseId}.`);
    }
    
    // Here, you might want to re-fetch the client's remaining_servings if it's critical
    // and wasn't fetched or could have changed, e.g.:
    // const { data: clientInfo } = await supabase.from('clients').select('remaining_servings').eq('client_id', clientToUseId).single();
    // if (clientInfo && clientInfo.remaining_servings <= 0) { /* handle no servings */ }

    if (!clientToUseId) {
        // This case should ideally not be reached if the logic above is sound.
        console.error("[getOrCreateClient] CRITICAL: clientToUseId is still null after all checks. This should not happen.");
        throw new Error("Unable to determine client ID after all checks.");
    }

    console.log(`[getOrCreateClient] Final determined client_id: ${clientToUseId} (found by: ${clientFoundBy})`);
    return clientToUseId;

  } catch (error) {
    // Log the error with more context before re-throwing or throwing a new one.
    console.error(`[getOrCreateClient] Error during client processing for email ${clientDetails.email} and authUserId ${effectiveAuthUserId || 'N/A'}:`, error);
    
    // Handle specific known errors more gracefully if desired
    if (error instanceof Error && error.message.startsWith("Client email conflict")) {
        throw error; // Re-throw the specific conflict error
    }

    // Attempt to get a more specific message from Supabase-like error objects
    let errorMessage = "An unknown error occurred";
    if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = String((error as { message: string }).message);
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = String(error);
    }
    
    // For other errors, throw a new error with a more descriptive message
    throw new Error(`Failed to get or create client: ${errorMessage}`);
  }
};

export interface ClientResult {
  clientId: string | null;
  error?: string | null;
}
