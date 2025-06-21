
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
      // 1. Upload images
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

      // 2. Save data using correct RPC function name
      const { data: rpcData, error: rpcError } = await supabase.rpc('public_submit_item_by_restaurant_name', {
        p_restaurant_name: formData.restaurantName,
        p_contact_name: formData.contactName,
        p_phone: formData.phone,
        p_email: formData.email,
        p_item_type: formData.itemType,
        p_item_name: formData.itemName,
        p_description: formData.description,
        p_special_notes: formData.specialNotes || '',
        p_category: formData.category || '',
        p_image_urls: JSON.stringify(imageUrls)
      });

      if (rpcError) throw rpcError;

      return { success: true, submissionId: rpcData };
    } catch (error: any) {
      console.error('Error in form submission:', error);
      return { success: false, error: error.message };
    }
  }
};
