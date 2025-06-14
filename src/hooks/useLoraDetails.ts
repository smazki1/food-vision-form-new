import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LoraDetails {
  lora_name: string;
  lora_id: string;
  lora_link: string;
  fixed_prompt: string;
}

export const useLoraDetails = (submissionId: string | null) => {
  const [loraDetails, setLoraDetails] = useState<LoraDetails>({
    lora_name: '',
    lora_id: '',
    lora_link: '',
    fixed_prompt: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch LORA details for the submission
  const fetchLoraDetails = async () => {
    if (!submissionId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('customer_submissions')
        .select('lora_name, lora_id, lora_link, fixed_prompt')
        .eq('submission_id', submissionId)
        .single();

      if (error) {
        console.error('Error fetching LORA details:', error);
        return;
      }

      if (data) {
        setLoraDetails({
          lora_name: data.lora_name || '',
          lora_id: data.lora_id || '',
          lora_link: data.lora_link || '',
          fixed_prompt: data.fixed_prompt || ''
        });
      }
    } catch (error) {
      console.error('Error fetching LORA details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save LORA details to database
  const saveLoraDetails = async (details: LoraDetails) => {
    if (!submissionId) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('customer_submissions')
        .update({
          lora_name: details.lora_name || null,
          lora_id: details.lora_id || null,
          lora_link: details.lora_link || null,
          fixed_prompt: details.fixed_prompt || null
        })
        .eq('submission_id', submissionId);

      if (error) {
        console.error('Error saving LORA details:', error);
        toast.error('שגיאה בשמירת פרטי LORA');
        return;
      }

      toast.success('פרטי LORA נשמרו בהצלחה');
    } catch (error) {
      console.error('Error saving LORA details:', error);
      toast.error('שגיאה בשמירת פרטי LORA');
    } finally {
      setIsSaving(false);
    }
  };

  // Update LORA field with debounced auto-save
  const updateLoraField = (field: keyof LoraDetails, value: string) => {
    const updatedDetails = { ...loraDetails, [field]: value };
    setLoraDetails(updatedDetails);
    
    // Debounced save after 1 second
    const timeoutId = setTimeout(() => {
      saveLoraDetails(updatedDetails);
    }, 1000);

    // Clear previous timeout
    return () => clearTimeout(timeoutId);
  };

  // Fetch LORA details when submission ID changes
  useEffect(() => {
    fetchLoraDetails();
  }, [submissionId]);

  return {
    loraDetails,
    updateLoraField,
    isLoading,
    isSaving,
    refetch: fetchLoraDetails
  };
}; 