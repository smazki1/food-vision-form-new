import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PublicSubmissionData {
  restaurant_name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  item_type: 'dish' | 'cocktail' | 'drink';
  item_name: string;
  description?: string;
  special_notes?: string;
  original_image_urls?: string[];
  branding_material_urls?: string[];
  reference_example_urls?: string[];
  category?: string; // for dishes
  ingredients?: string[]; // for cocktails/drinks
  submission_data?: any; // any additional custom data
}

export const usePublicSubmissions = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitPublicSubmission = async (data: PublicSubmissionData): Promise<{ success: boolean; id?: string; error?: string }> => {
    setIsSubmitting(true);
    
    try {
      console.log('[PublicSubmissions] Submitting to public_submissions table:', data);
      
      // Insert directly into public_submissions table - no RLS issues!
      // Using 'any' cast because the table doesn't exist in types yet
      const { data: insertedData, error } = await (supabase as any)
        .from('public_submissions')
        .insert({
          restaurant_name: data.restaurant_name,
          contact_name: data.contact_name || null,
          contact_email: data.contact_email || null,
          contact_phone: data.contact_phone || null,
          item_type: data.item_type,
          item_name: data.item_name,
          description: data.description || null,
          special_notes: data.special_notes || null,
          original_image_urls: data.original_image_urls || [],
          branding_material_urls: data.branding_material_urls || [],
          reference_example_urls: data.reference_example_urls || [],
          category: data.category || null,
          ingredients: data.ingredients || null,
          submission_data: data.submission_data || null,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('[PublicSubmissions] Error inserting submission:', error);
        return { success: false, error: error.message };
      }

      console.log('[PublicSubmissions] Submission inserted successfully:', insertedData);
      
      toast.success('הגשה נשלחה בהצלחה! אנו נצור איתך קשר בקרוב.', {
        duration: 5000
      });

      return { success: true, id: insertedData.id };

    } catch (error: any) {
      console.error('[PublicSubmissions] Unexpected error:', error);
      const errorMessage = error?.message || 'שגיאה לא צפויה';
      toast.error(`שגיאה בשליחת ההגשה: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitMultiplePublicSubmissions = async (submissions: PublicSubmissionData[]): Promise<{ success: boolean; successCount: number; errors: string[] }> => {
    setIsSubmitting(true);
    
    try {
      console.log('[PublicSubmissions] Submitting multiple submissions:', submissions.length);
      
      const results = await Promise.allSettled(
        submissions.map(submission => submitPublicSubmission(submission))
      );

      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length;

      const errors = results
        .filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success))
        .map(result => {
          if (result.status === 'rejected') {
            return result.reason?.message || 'שגיאה לא צפויה';
          } else if (result.status === 'fulfilled') {
            return result.value.error || 'שגיאה לא צפויה';
          }
          return 'שגיאה לא צפויה';
        });

      if (successful === submissions.length) {
        toast.success(`כל ${successful} ההגשות נשלחו בהצלחה!`);
        return { success: true, successCount: successful, errors: [] };
      } else if (successful > 0) {
        toast.success(`${successful} הגשות נשלחו בהצלחה, ${errors.length} נכשלו.`);
        return { success: true, successCount: successful, errors };
      } else {
        toast.error('כל ההגשות נכשלו. אנא נסה שוב.');
        return { success: false, successCount: 0, errors };
      }

    } catch (error: any) {
      console.error('[PublicSubmissions] Error in multiple submissions:', error);
      toast.error('שגיאה כללית בשליחת ההגשות');
      return { success: false, successCount: 0, errors: [error?.message || 'שגיאה לא צפויה'] };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitPublicSubmission,
    submitMultiplePublicSubmissions,
    isSubmitting
  };
}; 