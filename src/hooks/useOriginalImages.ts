import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
// Removed FoodItem import as we are fetching string URLs directly from DB

type ItemType = "dishes" | "cocktails" | "drinks";

// This interface helps in asserting the type of the data object later
interface ItemWithReferenceImages {
  reference_images: string[];
  // Include other common fields if necessary, or keep it minimal
}

/**
 * Fetches the original reference images for a given item.
 * @param originalItemId The ID of the original item (dish, cocktail, drink).
 * @param itemType The type of the item.
 * @returns The query result containing an array of reference image URLs or null.
 */
export const useOriginalImages = (originalItemId?: string, itemType?: ItemType) => {
  return useQuery<string[] | null, Error>({
    queryKey: ["originalImages", originalItemId, itemType],
    queryFn: async () => {
      if (!originalItemId || !itemType) {
        return null;
      }

      console.log(`[useOriginalImages] Fetching original images for item ID: ${originalItemId}, type: ${itemType}`);

      // @ts-ignore - Supabase SDK can struggle with dynamic table names in .from(), leading to deep type instantiation.
      // We are confident itemType is one of "dishes", "cocktails", or "drinks".
      const { data, error } = await supabase
        .from(itemType) 
        .select("reference_images")
        .eq("id", originalItemId)
        .single();

      if (error) {
        console.error(
          `[useOriginalImages] Error fetching original images for ${itemType} ID ${originalItemId}:`,
          error
        );
        if (error.code === 'PGRST116') { // "No rows found"
          return null; 
        }
        throw new Error(
          `Failed to fetch original images for ${itemType} ID ${originalItemId}: ${error.message}`
        );
      }

      // Perform a runtime check and type assertion
      if (data && typeof data === 'object' && 'reference_images' in data && Array.isArray((data as ItemWithReferenceImages).reference_images)) {
        const typedData = data as ItemWithReferenceImages;
        console.log(`[useOriginalImages] Successfully fetched original images:`, typedData.reference_images);
        return typedData.reference_images;
      } else {
        console.log(`[useOriginalImages] No reference images found or data format is unexpected for ${itemType} ID ${originalItemId}. Data:`, data);
        return null;
      }
    },
    enabled: !!originalItemId && !!itemType,
    staleTime: 5 * 60 * 1000, 
  });
}; 