import { supabase } from "@/integrations/supabase/client";
import { ClientDetails } from "@/types/food-vision";

/**
 * Checks if a client exists by email or authUserId and returns client_id if found.
 * Otherwise creates a new client and returns the new client_id.
 * Ensures the client record is appropriately linked to the authUserId.
 */
export const getOrCreateClient = async (
  clientDetails: ClientDetails, 
  authUserId?: string // Optional current authenticated user ID
): Promise<string> => {
  try {
    let clientToUseId: string | null = null;
    let clientFoundBy: string | null = null;

    // Priority 1: Try to find a client linked to the current auth user ID
    if (authUserId) {
      console.log(`[getOrCreateClient] Attempting to find client by authUserId: ${authUserId}`);
      const { data: userLinkedClient, error: userLinkedClientError } = await supabase
        .from('clients')
        .select('client_id, email, user_auth_id, remaining_servings')
        .eq('user_auth_id', authUserId)
        .single();

      if (userLinkedClientError && userLinkedClientError.code !== 'PGRST116') { // PGRST116 = 0 rows, not an error for .single()
        console.error("[getOrCreateClient] Error fetching client by authUserId:", userLinkedClientError);
        // Don't throw yet, allow fallback to email match or creation.
      }
      if (userLinkedClient) {
        clientToUseId = userLinkedClient.client_id;
        clientFoundBy = "authUserId";
        console.log(`[getOrCreateClient] Found client ${clientToUseId} by authUserId ${authUserId}.`);
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
        
        if (authUserId) {
          if (!existingClientByEmail.user_auth_id) {
            // Email match found, client is unlinked, and user is logged in: Link them.
            console.log(`[getOrCreateClient] Client ${existingClientByEmail.client_id} (email: ${clientDetails.email}) found unlinked. Linking to authUserId ${authUserId}.`);
            const { error: updateError } = await supabase
              .from('clients')
              .update({ user_auth_id: authUserId })
              .eq('client_id', existingClientByEmail.client_id);
            if (updateError) {
              console.error(`[getOrCreateClient] Failed to link authUserId ${authUserId} to client ${existingClientByEmail.client_id}:`, updateError);
              // Decide: throw, or use the client_id anyway but it remains unlinked for this transaction?
              // For now, let's proceed but log the error. The client_id is still valid.
            }
            clientToUseId = existingClientByEmail.client_id;
            clientFoundBy = "email_linked_now";
          } else if (existingClientByEmail.user_auth_id === authUserId) {
            // Email match found, and it's already linked to the current auth user. Good.
            clientToUseId = existingClientByEmail.client_id;
            clientFoundBy = "email_already_linked_to_user";
            console.log(`[getOrCreateClient] Client ${clientToUseId} (email: ${clientDetails.email}) found, already linked to authUserId ${authUserId}.`);
          } else {
            // Email match found, but it's linked to a DIFFERENT auth user. This is a conflict.
            console.warn(`[getOrCreateClient] CONFLICT: Email ${clientDetails.email} matches client ${existingClientByEmail.client_id}, but it's linked to a different auth user (${existingClientByEmail.user_auth_id}) than current (${authUserId}).`);
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
      console.log(`[getOrCreateClient] No client found by ${clientFoundBy || 'any method'}. Creating new client for email ${clientDetails.email} and authUserId ${authUserId || 'N/A'}.`);
      const { data: newClientData, error: newClientError } = await supabase
        .from('clients')
        .insert({
          restaurant_name: clientDetails.restaurantName,
          contact_name: clientDetails.contactName,
          phone: clientDetails.phoneNumber,
          email: clientDetails.email,
          user_auth_id: authUserId // This will be null if authUserId is undefined, which is correct for anonymous
        })
        .select('client_id')
        .single();

      if (newClientError) {
        console.error("[getOrCreateClient] Error creating new client:", newClientError);
        throw newClientError; // Rethrow to be caught by the main try-catch
      }
      if (!newClientData) {
          console.error("[getOrCreateClient] Failed to create new client or retrieve its ID, newClientData is null/undefined.");
          throw new Error("Client creation failed: No data returned after insert.");
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
    console.error(`[getOrCreateClient] Error during client processing for email ${clientDetails.email} and authUserId ${authUserId || 'N/A'}:`, error);
    
    // Handle specific known errors more gracefully if desired
    if (error instanceof Error && error.message.startsWith("Client email conflict")) {
        throw error; // Re-throw the specific conflict error
    }
    // For other errors, throw a generic message or the original error
    throw new Error(`Failed to get or create client: ${error instanceof Error ? error.message : String(error)}`);
  }
};
