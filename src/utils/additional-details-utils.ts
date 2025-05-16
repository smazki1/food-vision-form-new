
import { supabase } from "@/integrations/supabase/client";
import { AdditionalDetails } from "@/types/food-vision";
import { uploadFileToStorage } from "./storage-utils";

/**
 * Processes additional details and saves to the database
 */
export const processAdditionalDetails = async (additionalDetails: AdditionalDetails, clientId: string): Promise<void> => {
  const brandingMaterialsUrl = additionalDetails.brandingMaterials 
    ? await uploadFileToStorage(additionalDetails.brandingMaterials) 
    : null;

  await supabase.from('additional_details').insert({
    client_id: clientId,
    visual_style: additionalDetails.visualStyle,
    brand_colors: additionalDetails.brandColors,
    branding_materials_url: brandingMaterialsUrl,
    general_notes: additionalDetails.generalNotes
  });
}
