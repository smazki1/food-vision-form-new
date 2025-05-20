import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
// Removed FoodItem import as we are fetching string URLs directly from DB

// The type of item as stored in the submission (usually singular)
export type SubmissionItemType = "dish" | "cocktail" | "drink";

// This interface helps in asserting the type of the data object later
interface ItemWithReferenceImages {
  reference_images: string[];
  // Include other common fields if necessary, or keep it minimal
}

/**
 * Fetches the original reference images for a given item.
 * @param originalItemId The ID of the original item (dish, cocktail, drink).
 * @param itemType The type of the item from the submission (e.g., 'dish', 'cocktail', 'drink').
 * @returns The query result containing an array of reference image URLs or null.
 */
export const useOriginalImages = (originalItemId?: string, itemType?: SubmissionItemType) => {
  return useQuery<string[] | null, Error>({
    queryKey: ["originalImages", originalItemId, itemType],
    queryFn: async () => {
      if (!originalItemId || !itemType) {
        return null;
      }

      // Determine the correct Supabase table name
      let tableName: string;
      switch (itemType) {
        case "dish":
          tableName = "dishes";
          break;
        case "cocktail":
          tableName = "cocktails"; // Assuming table name is 'cocktails'
          break;
        case "drink":
          tableName = "drinks";    // Assuming table name is 'drinks'
          break;
        default:
          console.error(`[useOriginalImages] Unknown item type: ${itemType}`);
          return null;
      }

      console.log(`[useOriginalImages] Fetching original images for item ID: ${originalItemId}, type: ${itemType}, table: ${tableName}`);

      // @ts-ignore - Supabase SDK can struggle with dynamic table names in .from(), leading to deep type instantiation.
      const { data, error } = await supabase
        .from(tableName) 
        .select("reference_images")
        .eq("id", originalItemId) // Assuming the ID column in these tables is 'id'
        .single();

      if (error) {
        console.error(
          `[useOriginalImages] Error fetching original images from table ${tableName} for ID ${originalItemId}:`,
          error
        );
        if (error.code === 'PGRST116') { // "No rows found"
          return null; 
        }
        throw new Error(
          `Failed to fetch original images from ${tableName} for ID ${originalItemId}: ${error.message}`
        );
      }

      if (data && typeof data === 'object' && 'reference_images' in data && Array.isArray((data as ItemWithReferenceImages).reference_images)) {
        const typedData = data as ItemWithReferenceImages;
        console.log(`[useOriginalImages] Successfully fetched original images:`, typedData.reference_images);
        return typedData.reference_images;
      } else {
        console.log(`[useOriginalImages] No reference images found or data format is unexpected from ${tableName} for ID ${originalItemId}. Data:`, data);
        return null;
      }
    },
    enabled: !!originalItemId && !!itemType,
    staleTime: 5 * 60 * 1000, 
  });
}; 