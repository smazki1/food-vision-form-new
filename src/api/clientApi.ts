import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Client, ClientStatus } from "@/types/client";

export async function getClientById(clientId: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("client_id", clientId)
    .single();

  if (error) {
    console.error("Error fetching client details:", error);
    throw error;
  }

  return data as Client;
}

export async function updateClient(
  clientId: string,
  updates: Partial<Client>
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update(updates)
    .eq("client_id", clientId)
    .select()
    .single();

  if (error) {
    console.error("Error updating client details:", error);
    throw error;
  }

  return data as Client;
}

export async function getClientDetails(clientId: string): Promise<Client | null> {
  return getClientById(clientId);
}

export async function updateClientDetails(
  clientId: string,
  updates: Partial<Client>
): Promise<Client> {
  return updateClient(clientId, updates);
}

export async function addServingsToClient(
  clientId: string,
  servingsToAdd: number
): Promise<Client> {
  // First get the current servings count
  const { data: client, error: fetchError } = await supabase
    .from("clients")
    .select("remaining_servings")
    .eq("client_id", clientId)
    .single();

  if (fetchError) {
    console.error("Error fetching client servings:", fetchError);
    throw fetchError;
  }

  const currentServings = client.remaining_servings;
  const newServingsCount = currentServings + servingsToAdd;

  // Update with the new count
  const { data, error: updateError } = await supabase
    .from("clients")
    .update({ remaining_servings: newServingsCount })
    .eq("client_id", clientId)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating client servings:", updateError);
    throw updateError;
  }

  return data as Client;
}

export async function checkEmailExists(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("clients")
    .select("email")
    .eq("email", email)
    .limit(1);

  if (error) {
    console.error("Error checking email existence:", error);
    throw error;
  }

  return data && data.length > 0;
}

export async function createUserAccountForClient(
  clientId: string,
  email: string
): Promise<{ userId: string; client: Client; tempPassword: string }> {
  // Generate a random temporary password
  const tempPassword = Math.random().toString(36).slice(-8);

  // First create the user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true, // Auto-confirm email
  });

  if (authError) {
    console.error("Error creating user account:", authError);
    throw authError;
  }

  // Cast authData.user to User type
  const user = authData.user as User;
  
  // Then update the client record with the auth user ID
  const { data: clientData, error: clientError } = await supabase
    .from("clients")
    .update({ user_auth_id: user.id })
    .eq("client_id", clientId)
    .select()
    .single();

  if (clientError) {
    console.error("Error linking user to client:", clientError);
    throw clientError;
  }

  return { 
    userId: user.id,
    client: clientData as Client,
    tempPassword
  };
}

export async function assignPackageToClient(
  clientId: string,
  packageId: string,
  servingsCount: number,
  notes?: string,
  expirationDate?: Date
): Promise<Client> {
  // Create the updates object with the required fields
  const updates: Partial<Client> = {
    current_package_id: packageId,
    remaining_servings: servingsCount,
  };

  // If there are notes, prepend them to the existing internal notes or create new ones
  if (notes) {
    const { data: currentClient } = await supabase
      .from("clients")
      .select("internal_notes")
      .eq("client_id", clientId)
      .single();

    const currentNotes = currentClient?.internal_notes || "";
    const timestamp = new Date().toLocaleString("he-IL");
    const formattedNote = `[${timestamp} - הקצאת חבילה] ${notes}`;
    
    updates.internal_notes = currentNotes 
      ? `${formattedNote}\n\n${currentNotes}`
      : formattedNote;
  }

  // TODO: In the future, we might want to add fields like:
  // - package_assigned_at
  // - current_package_expires_at
  // - payment_status
  // For now, we're just using the existing fields

  // Perform the update
  const { data, error } = await supabase
    .from("clients")
    .update(updates)
    .eq("client_id", clientId)
    .select()
    .single();

  if (error) {
    console.error("Error assigning package to client:", error);
    throw error;
  }

  return data as Client;
}

export async function getPackageName(packageId: string | null): Promise<string | null> {
  if (!packageId) return null;

  try {
    const { data, error } = await supabase
      .from("service_packages")
      .select("package_name")
      .eq("package_id", packageId)
      .single();

    if (error) throw error;
    return data?.package_name || null;
  } catch (error) {
    console.error("Error fetching package name:", error);
    return null;
  }
}
