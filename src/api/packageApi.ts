
import { supabase } from "@/integrations/supabase/client";
import { Package } from "@/types/package";

export async function getPackages(): Promise<Package[]> {
  const { data, error } = await supabase
    .from("service_packages")
    .select("*")
    .order("price", { ascending: true });

  if (error) {
    console.error("Error fetching packages:", error);
    throw error;
  }

  return data as Package[];
}

export async function getPackageById(packageId: string): Promise<Package | null> {
  const { data, error } = await supabase
    .from("service_packages")
    .select("*")
    .eq("package_id", packageId)
    .single();

  if (error) {
    console.error(`Error fetching package with ID ${packageId}:`, error);
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    throw error;
  }

  return data as Package;
}

export async function createPackage(packageData: Omit<Package, "package_id" | "created_at" | "updated_at">): Promise<Package> {
  const { data, error } = await supabase
    .from("service_packages")
    .insert(packageData)
    .select()
    .single();

  if (error) {
    console.error("Error creating package:", error);
    throw error;
  }

  return data as Package;
}

export async function updatePackage(packageId: string, packageData: Partial<Package>): Promise<Package> {
  const { data, error } = await supabase
    .from("service_packages")
    .update(packageData)
    .eq("package_id", packageId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating package with ID ${packageId}:`, error);
    throw error;
  }

  return data as Package;
}

export async function togglePackageActiveStatus(packageId: string, isActive: boolean): Promise<Package> {
  return updatePackage(packageId, { is_active: isActive });
}

export async function deletePackage(packageId: string): Promise<void> {
  const { error } = await supabase
    .from("service_packages")
    .delete()
    .eq("package_id", packageId);

  if (error) {
    console.error(`Error deleting package with ID ${packageId}:`, error);
    throw error;
  }
}
