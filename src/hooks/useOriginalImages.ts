import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
// Removed FoodItem import as we are fetching string URLs directly from DB

// The type of item as stored in the submission (usually singular)
export type SubmissionItemType = "dish" | "cocktail" | "drink";

// This interface helps in asserting the type of the data object later
interface ItemWithReferenceImageUrls {
  reference_image_urls: string[];
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

      let tableName: string;
      let idColumnName: string = "id"; // Default ID column name

      switch (itemType) {
        case "dish":
          tableName = "dishes";
          // If dishes table has a different primary key name for original items, specify here
          // For example: idColumnName = "dish_id"; 
          break;
        case "cocktail":
          tableName = "cocktails";
          // idColumnName = "cocktail_id";
          break;
        case "drink":
          tableName = "drinks";
          // idColumnName = "drink_id";
          break;
        default:
          console.error(`[useOriginalImages] Unknown item type: ${itemType}`);
          return null;
      }

      console.log(`[useOriginalImages] Fetching original images for item ID: ${originalItemId}, type: ${itemType}, table: ${tableName}`);

      // @ts-ignore - Supabase SDK can struggle with dynamic table names in .from(), leading to deep type instantiation.
      const { data, error } = await supabase
        .from(tableName) 
        .select("reference_image_urls")
        .eq(idColumnName, originalItemId)
        .single();

      if (error) {
        console.error(
          `[useOriginalImages] Error fetching original images from table ${tableName} for ID ${originalItemId}:`,
          error
        );
        if (error.code === 'PGRST116') {
          return null; 
        }
        throw new Error(
          `Failed to fetch original images from ${tableName} for ID ${originalItemId}: ${error.message}`
        );
      }

      if (data && typeof data === 'object' && 'reference_image_urls' in data && Array.isArray((data as ItemWithReferenceImageUrls).reference_image_urls)) {
        const typedData = data as ItemWithReferenceImageUrls;
        console.log(`[useOriginalImages] Successfully fetched original images:`, typedData.reference_image_urls);
        return typedData.reference_image_urls;
      } else {
        console.log(`[useOriginalImages] No reference image URLs found or data format is unexpected from ${tableName} for ID ${originalItemId}. Data:`, data);
        return null;
      }
    },
    enabled: !!originalItemId && !!itemType,
    staleTime: 5 * 60 * 1000, 
  });
}; 