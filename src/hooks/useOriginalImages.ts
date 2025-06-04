import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

export type SubmissionItemType = string;

interface OriginalImage {
  image_id: string;
  image_url: string;
  item_type: string;
  item_name: string;
  uploaded_at: string;
}

export const useOriginalImages = (submissionId: string | undefined) => {
  return useQuery({
    queryKey: ['original-images', submissionId],
    queryFn: async (): Promise<string[]> => {
      if (!submissionId) {
        throw new Error('Submission ID is required');
      }

      console.log('[useOriginalImages] Fetching original images for submission:', submissionId);
      
      // Get the submission details including original_item_id
      const { data: submission, error: submissionError } = await supabase
        .from('customer_submissions')
        .select('original_item_id, item_type')
        .eq('submission_id', submissionId)
        .single();

      if (submissionError) {
        console.error('[useOriginalImages] Error fetching submission:', submissionError);
        throw submissionError;
      }

      if (!submission?.original_item_id) {
        console.log('[useOriginalImages] No original_item_id found for submission');
        return [];
      }

      const { original_item_id, item_type } = submission;
      console.log('[useOriginalImages] Found original_item_id:', original_item_id, 'type:', item_type);

      // Determine which table to query based on item_type
      let tableName = '';
      switch (item_type) {
        case 'dish':
          tableName = 'dishes';
          break;
        case 'cocktail':
          tableName = 'cocktails';
          break;
        case 'drink':
          tableName = 'drinks';
          break;
        default:
          console.error('[useOriginalImages] Unknown item_type:', item_type);
          throw new Error(`Unknown item type: ${item_type}`);
      }

      // Get the original item and its reference images
      const { data, error } = await supabase
        .from(tableName)
        .select('name, reference_image_urls')
        .eq(`${item_type}_id`, original_item_id)
        .single();

      if (error) {
        console.error('[useOriginalImages] Error fetching original item:', error);
        throw error;
      }

      if (!data?.reference_image_urls) {
        console.log('[useOriginalImages] No reference images found for original item');
        return [];
      }

      // Return the reference_image_urls array directly as strings
      const referenceImages: string[] = data.reference_image_urls || [];
      console.log('[useOriginalImages] Found original images:', referenceImages.length);
      return referenceImages;
    },
    enabled: !!submissionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
