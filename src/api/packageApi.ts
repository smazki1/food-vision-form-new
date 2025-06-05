import { supabase } from "@/integrations/supabase/client";
import { Package } from "@/types/package";

// Helper function to transform database rows to Package interface
const transformDbRowToPackage = (row: any): Package => ({
  package_id: row.package_id,
  package_name: row.package_name, // Now using package_name directly from DB
  description: row.description,
  total_servings: row.total_servings,
  price: row.price,
  is_active: row.is_active,
  max_processing_time_days: row.max_processing_time_days,
  max_edits_per_serving: row.max_edits_per_serving,
  special_notes: row.special_notes,
  total_images: row.total_images,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

// Helper function to transform Package interface to database format
const transformPackageToDbRow = (packageData: Omit<Package, "package_id" | "created_at" | "updated_at">) => ({
  package_name: packageData.package_name, // Now using package_name directly for DB
  description: packageData.description,
  total_servings: packageData.total_servings,
  price: packageData.price,
  is_active: packageData.is_active,
  max_processing_time_days: packageData.max_processing_time_days,
  max_edits_per_serving: packageData.max_edits_per_serving,
  special_notes: packageData.special_notes,
  total_images: packageData.total_images,
});

export async function getPackages(): Promise<Package[]> {
  console.log('[packageApi] getPackages called');
  
  const { data, error } = await supabase
    .from("service_packages")
    .select("package_id, package_name, description, total_servings, price, is_active, created_at, updated_at, max_processing_time_days, max_edits_per_serving, special_notes, total_images")
    .order("price", { ascending: true });

  if (error) {
    console.error("Error fetching packages:", error);
    throw error;
  }

  console.log('[packageApi] getPackages raw data:', data);
  const transformedData = data.map(transformDbRowToPackage);
  console.log('[packageApi] getPackages transformed data:', transformedData);
  
  return transformedData;
}

export async function getPackageById(packageId: string): Promise<Package | null> {
  console.log('[packageApi] getPackageById called with ID:', packageId);
  
  const { data, error } = await supabase
    .from("service_packages")
    .select("package_id, package_name, description, total_servings, price, is_active, created_at, updated_at, max_processing_time_days, max_edits_per_serving, special_notes, total_images")
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

  return data ? transformDbRowToPackage(data) : null;
}

export async function createPackage(packageData: Omit<Package, "package_id" | "created_at" | "updated_at">): Promise<Package> {
  console.log('[packageApi] createPackage called with data:', packageData);
  
  // Prepare RPC parameters
  const rpcParams: any = {
    p_package_name: packageData.package_name,
    p_description: packageData.description || null,
    p_total_servings: packageData.total_servings ? Number(packageData.total_servings) : null,
    p_price: packageData.price ? Number(packageData.price) : null,
    p_is_active: packageData.is_active !== undefined ? packageData.is_active : true,
    p_max_processing_time_days: packageData.max_processing_time_days ? Number(packageData.max_processing_time_days) : null,
    p_max_edits_per_serving: packageData.max_edits_per_serving ? Number(packageData.max_edits_per_serving) : null,
    p_special_notes: packageData.special_notes || null,
    p_total_images: packageData.total_images ? Number(packageData.total_images) : null
  };
  
  console.log('[packageApi] createPackage RPC params:', rpcParams);
  
  try {
    const { data, error } = await supabase
      .rpc('create_service_package', rpcParams);

    if (error) {
      console.error("[packageApi] Supabase RPC error creating package:", error);
      console.error(`[packageApi] RPC Error details:`, {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message
      });
      throw error;
    }

    if (!data) {
      console.error(`[packageApi] No data returned from RPC when creating package`);
      throw new Error(`Package creation failed - no data returned`);
    }

    console.log('[packageApi] createPackage RPC success, raw data:', data);
    const transformedData = transformDbRowToPackage(data);
    console.log('[packageApi] createPackage RPC success, transformed data:', transformedData);

    return transformedData;
  } catch (error) {
    console.error(`[packageApi] Exception during createPackage:`, error);
    throw error;
  }
}

export async function updatePackage(packageId: string, packageData: Partial<Package>): Promise<Package> {
  console.log('[packageApi] updatePackage called with ID:', packageId, 'data:', packageData);
  
  // Transform the update data, handling partial updates
  const dbData: any = {
    updated_at: new Date().toISOString() // Always update the timestamp
  };
  
  if (packageData.package_name !== undefined) dbData.package_name = packageData.package_name;
  if (packageData.description !== undefined) dbData.description = packageData.description;
  if (packageData.total_servings !== undefined) dbData.total_servings = Number(packageData.total_servings);
  if (packageData.price !== undefined) dbData.price = Number(packageData.price);
  if (packageData.is_active !== undefined) dbData.is_active = packageData.is_active;
  if (packageData.max_processing_time_days !== undefined) {
    dbData.max_processing_time_days = packageData.max_processing_time_days === null ? null : Number(packageData.max_processing_time_days);
  }
  if (packageData.max_edits_per_serving !== undefined) dbData.max_edits_per_serving = Number(packageData.max_edits_per_serving);
  if (packageData.special_notes !== undefined) dbData.special_notes = packageData.special_notes;
  if (packageData.total_images !== undefined) {
    dbData.total_images = packageData.total_images === null ? null : Number(packageData.total_images);
  }
  
  console.log('[packageApi] updatePackage transformed data for DB:', dbData);

  try {
    const { data, error } = await supabase
      .from("service_packages")
      .update(dbData)
      .eq("package_id", packageId)
      .select("package_id, package_name, description, total_servings, price, is_active, created_at, updated_at, max_processing_time_days, max_edits_per_serving, special_notes, total_images")
      .single();

    if (error) {
      console.error(`[packageApi] Supabase error updating package with ID ${packageId}:`, error);
      console.error(`[packageApi] Error details:`, {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message
      });
      throw error;
    }

    if (!data) {
      console.error(`[packageApi] No data returned when updating package with ID ${packageId}`);
      throw new Error(`Package with ID ${packageId} not found or update failed`);
    }

    console.log('[packageApi] updatePackage success, raw data:', data);
    const transformedData = transformDbRowToPackage(data);
    console.log('[packageApi] updatePackage success, transformed data:', transformedData);
    
    return transformedData;
  } catch (error) {
    console.error(`[packageApi] Exception during updatePackage:`, error);
    throw error;
  }
}

export async function updatePackageViaRPC(packageId: string, packageData: Partial<Package>): Promise<Package> {
  console.log('[packageApi] updatePackageViaRPC called with ID:', packageId, 'data:', packageData);
  
  // Prepare RPC parameters
  const rpcParams: any = {
    p_package_id: packageId
  };
  
  if (packageData.package_name !== undefined) rpcParams.p_package_name = packageData.package_name;
  if (packageData.description !== undefined) rpcParams.p_description = packageData.description;
  if (packageData.total_servings !== undefined) rpcParams.p_total_servings = Number(packageData.total_servings);
  if (packageData.price !== undefined) rpcParams.p_price = Number(packageData.price);
  if (packageData.is_active !== undefined) rpcParams.p_is_active = packageData.is_active;
  if (packageData.max_processing_time_days !== undefined) {
    rpcParams.p_max_processing_time_days = packageData.max_processing_time_days === null ? null : Number(packageData.max_processing_time_days);
  }
  if (packageData.max_edits_per_serving !== undefined) rpcParams.p_max_edits_per_serving = Number(packageData.max_edits_per_serving);
  if (packageData.special_notes !== undefined) rpcParams.p_special_notes = packageData.special_notes;
  if (packageData.total_images !== undefined) {
    rpcParams.p_total_images = packageData.total_images === null ? null : Number(packageData.total_images);
  }
  
  console.log('[packageApi] updatePackageViaRPC RPC params:', rpcParams);

  try {
    const { data, error } = await supabase
      .rpc('update_service_package', rpcParams);

    if (error) {
      console.error(`[packageApi] Supabase RPC error updating package with ID ${packageId}:`, error);
      console.error(`[packageApi] RPC Error details:`, {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message
      });
      throw error;
    }

    if (!data) {
      console.error(`[packageApi] No data returned from RPC when updating package with ID ${packageId}`);
      throw new Error(`Package with ID ${packageId} not found or update failed`);
    }

    console.log('[packageApi] updatePackageViaRPC success, raw data:', data);
    const transformedData = transformDbRowToPackage(data);
    console.log('[packageApi] updatePackageViaRPC success, transformed data:', transformedData);
    
    return transformedData;
  } catch (error) {
    console.error(`[packageApi] Exception during updatePackageViaRPC:`, error);
    throw error;
  }
}

export async function togglePackageActiveStatus(packageId: string, isActive: boolean): Promise<Package> {
  return updatePackageViaRPC(packageId, { is_active: isActive });
}

export async function deletePackage(packageId: string): Promise<void> {
  console.log('[packageApi] deletePackage called with ID:', packageId);
  
  const { error } = await supabase
    .from("service_packages")
    .delete()
    .eq("package_id", packageId);

  if (error) {
    console.error(`Error deleting package with ID ${packageId}:`, error);
    throw error;
  }
}

export async function testUpdatePackage(packageId: string): Promise<Package> {
  console.log('[packageApi] testUpdatePackage called with ID:', packageId);
  
  const testData = {
    updated_at: new Date().toISOString()
  };
  
  console.log('[packageApi] testUpdatePackage simple data:', testData);

  try {
    const { data, error } = await supabase
      .from("service_packages")
      .update(testData)
      .eq("package_id", packageId)
      .select("package_id, package_name, description, total_servings, price, is_active, created_at, updated_at, max_processing_time_days, max_edits_per_serving, special_notes, total_images")
      .single();

    if (error) {
      console.error(`[packageApi] Supabase error in testUpdatePackage with ID ${packageId}:`, error);
      console.error(`[packageApi] Test error details:`, {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message
      });
      throw error;
    }

    if (!data) {
      console.error(`[packageApi] No data returned in testUpdatePackage with ID ${packageId}`);
      throw new Error(`Test package update failed - no data returned`);
    }

    console.log('[packageApi] testUpdatePackage success, raw data:', data);
    const transformedData = transformDbRowToPackage(data);
    console.log('[packageApi] testUpdatePackage success, transformed data:', transformedData);
    
    return transformedData;
  } catch (error) {
    console.error(`[packageApi] Exception during testUpdatePackage:`, error);
    throw error;
  }
}
