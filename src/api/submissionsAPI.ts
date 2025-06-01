import { supabase } from '@/integrations/supabase/client';
import { Submission } from '@/types/models';
// import { Submission } from '@/types/models'; // Uncomment if Submission type is used further

export const submissionsAPI = {
  async submitPublicForm(formData: {
    restaurantName: string;
    contactName: string;
    phone: string;
    email: string;
    itemType: 'dish' | 'cocktail' | 'drink';
    itemName: string;
    description: string;
    specialNotes?: string;
    category?: string;
    images: File[];
  }) {
    try {
      // 1. העלאת התמונות
      const imageUrls = await Promise.all(
        formData.images.map(async (file) => {
          const fileName = `public-submissions/${Date.now()}-${Math.random().toString(36).substring(2)}.${file.name.split('.').pop()}`;
          const { data, error: uploadError } = await supabase.storage
            .from('uploads') // Assuming 'uploads' is your storage bucket name
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          // Ensure data is not null before accessing publicUrl
          const publicUrl = data ? supabase.storage.from('uploads').getPublicUrl(fileName).data.publicUrl : null;
          if (!publicUrl) throw new Error('Failed to get public URL for uploaded file.');
          
          return publicUrl;
        })
      );

      // 2. שמירת הנתונים
      const { data: rpcData, error: rpcError } = await supabase.rpc('public_submit_item_by_restaurant_name', { // Assuming this RPC exists
        p_restaurant_name: formData.restaurantName,
        p_contact_name: formData.contactName,
        p_phone: formData.phone,  // עכשיו משתמשים בשם השדה הנכון
        p_email: formData.email,
        p_item_type: formData.itemType,
        p_item_name: formData.itemName,
        p_description: formData.description,
        p_special_notes: formData.specialNotes || '',
        p_category: formData.category || '',
        p_image_urls: JSON.stringify(imageUrls)
      });

      if (rpcError) throw rpcError;

      return { success: true, submissionId: rpcData }; // Assuming rpcData contains the submissionId
    } catch (error: any) {
      console.error('Error in form submission:', error);
      return { success: false, error: error.message };
    }
  },

  // פונקציות נוספות לניהול הגשות - שליפה, עדכון וכו'
  // async fetchSubmissions(options = {}): Promise<Submission[]> { ... }
  // async fetchSubmissionById(id: string): Promise<Submission> { ... }
}; 