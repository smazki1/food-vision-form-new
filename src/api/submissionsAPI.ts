
import { supabase } from '@/integrations/supabase/client';

export const submissionsAPI = {
  async submitPublicForm(formData: {
    restaurantName: string;
    contactName: string;
    phone: string;
    email: string;
    itemType: string;
    itemName: string;
    description: string;
    specialNotes?: string;
    category?: string;
    images: File[];
  }) {
    try {
      // Reject public flow to enforce auth
      throw new Error('Please log in to submit.');
      // 1. Upload images (legacy - removed)
      const imageUrls = await Promise.all(
        formData.images.map(async (file) => {
          const fileName = `public-submissions/${Date.now()}-${Math.random().toString(36).substring(2)}.${file.name.split('.').pop()}`;
          const { data, error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const publicUrl = data ? supabase.storage.from('uploads').getPublicUrl(fileName).data.publicUrl : null;
          if (!publicUrl) throw new Error('Failed to get public URL for uploaded file.');
          
          return publicUrl;
        })
      );

      // 2. Legacy RPC removed
    } catch (error: any) {
      console.error('Error in form submission:', error);
      return { success: false, error: error.message };
    }
  }
};
