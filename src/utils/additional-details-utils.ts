import { supabase } from "@/integrations/supabase/client";
import { AdditionalDetails } from "@/types/food-vision";
import { uploadFileToStorage } from "./storage-utils";

/**
 * Processes additional details and saves to the database
 */
export const processAdditionalDetails = async (additionalDetails: AdditionalDetails, clientId: string): Promise<void> => {
  let brandingMaterialsUrl: string | null = null;
  // Check if brandingMaterials is a File object before trying to upload
  if (additionalDetails.brandingMaterials instanceof File) {
    brandingMaterialsUrl = await uploadFileToStorage(additionalDetails.brandingMaterials);
  } else if (typeof additionalDetails.brandingMaterials === 'string') {
    // If it's already a string, assume it's a URL (e.g., from a previous submission or manual input)
    brandingMaterialsUrl = additionalDetails.brandingMaterials;
  }

  // Use upsert instead of insert to update if the record already exists
  const { error } = await supabase.from('additional_details').upsert({
    client_id: clientId,
    visual_style: additionalDetails.visualStyle,
    brand_colors: additionalDetails.brandColors,
    branding_materials_url: brandingMaterialsUrl,
    general_notes: additionalDetails.generalNotes
  });

  if (error) {
    console.error('Error upserting additional details:', error);
    throw new Error(`Supabase error upserting additional details: ${error.message} (Code: ${error.code})`);
  }
}
