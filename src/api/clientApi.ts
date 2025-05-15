
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";
import { User } from "@supabase/supabase-js";

// Fetch a single client by ID
export const getClientById = async (clientId: string) => {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("client_id", clientId)
    .single();

  if (error) throw error;
  return data as Client;
};

// Update a client's details
export const updateClient = async (clientId: string, updates: Partial<Client>) => {
  const { data, error } = await supabase
    .from("clients")
    .update(updates)
    .eq("client_id", clientId)
    .select()
    .single();

  if (error) throw error;
  return data as Client;
};

// Create a user account for a client
export const createUserAccountForClient = async (clientId: string, email: string) => {
  // Generate a random password
  const tempPassword = Math.random().toString(36).slice(-8);
  
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true, // Skip email confirmation for admin-created users
  });

  if (authError) throw authError;
  
  // Ensure we have a user object and properly type it
  if (!authData || !authData.user) {
    throw new Error("Failed to create user account");
  }
  
  // Use explicit casting to User type to resolve the typing issue
  const user = authData.user as User;
  
  // Update client record with user_auth_id
  const { data: clientData, error: clientError } = await supabase
    .from("clients")
    .update({ user_auth_id: user.id })
    .eq("client_id", clientId)
    .select()
    .single();
    
  if (clientError) throw clientError;
  
  return {
    user,
    client: clientData as Client,
    tempPassword
  };
};

// Check if email is already registered as a user
export const checkEmailExists = async (email: string) => {
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) throw error;
  
  return data.users.some(user => user.email === email);
};

// Fetch packages for clients
export const getPackages = async () => {
  // This is a placeholder for when real package data is available
  // For now, we use the mock data from the types/package.ts file
  return import("@/types/package").then(module => module.MOCK_PACKAGES);
};

// Get package name by id
export const getPackageName = async (packageId: string | null) => {
  if (!packageId) return "לא מוגדר";
  
  const packages = await getPackages();
  const pkg = packages.find(p => p.id === packageId);
  return pkg ? pkg.name : packageId;
};
