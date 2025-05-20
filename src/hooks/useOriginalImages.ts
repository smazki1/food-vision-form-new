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
        console.log("[useOriginalImages] Bailing out: originalItemId or itemType missing", { originalItemId, itemType });
        return null;
      }

      let tableName: string;
      let idColumnName: string; // Will be set in the switch
      const selectColumnName: string = "reference_image_urls";

      switch (itemType) {
        case "dish":
          tableName = "dishes";
          idColumnName = "dish_id"; // Corrected: Assuming original_item_id in submissions FKs to dish_id in dishes
          break;
        case "cocktail":
          tableName = "cocktails";
          idColumnName = "cocktail_id"; // Assuming original_item_id in submissions FKs to cocktail_id in cocktails
          break;
        case "drink":
          tableName = "drinks";
          idColumnName = "drink_id";    // Assuming original_item_id in submissions FKs to drink_id in drinks
          break;
        default:
          console.error(`[useOriginalImages] Unknown item type: ${itemType}`);
          return null;
      }

      console.log(`[useOriginalImages] Preparing to query Supabase. 
        Table: ${tableName}, 
        ID Column: ${idColumnName}, 
        Select Column: ${selectColumnName}, 
        Item ID: ${originalItemId}`
      );

      // @ts-ignore 
      const { data, error } = await supabase
        .from(tableName) 
        .select(selectColumnName)
        .eq(idColumnName, originalItemId)
        .single();
      
      console.log("[useOriginalImages] Supabase response:", { data, error });

      if (error) {
        console.error(
          `[useOriginalImages] Supabase error object while fetching from ${tableName} for ID ${originalItemId}:`,
          JSON.stringify(error, null, 2)
        );
        if (error.code === 'PGRST116') {
          return null; 
        }
        throw new Error(
          `Failed to fetch original images from ${tableName} for ID ${originalItemId}: ${error.message}`
        );
      }

      if (data && typeof data === 'object' && selectColumnName in data && Array.isArray((data as any)[selectColumnName])) {
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