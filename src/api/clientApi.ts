
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";

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
