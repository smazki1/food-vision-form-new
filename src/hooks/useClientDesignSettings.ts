import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientDesignSetting {
  id: string;
  client_id: string;
  category: string;
  reference_images: string[];
  style_notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Hook to fetch all design settings for a client
export const useClientDesignSettings = (clientId: string) => {
  return useQuery<ClientDesignSetting[]>({
    queryKey: ['client-design-settings', clientId],
    queryFn: async () => {
      console.log('[useClientDesignSettings] Fetching settings for client:', clientId);
      
      const { data, error } = await supabase
        .from('client_design_settings')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useClientDesignSettings] Error fetching settings:', error);
        throw error;
      }

      console.log('[useClientDesignSettings] Found settings:', data?.length || 0);
      return data || [];
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 10, // Consider data fresh for 10 minutes
  });
};

// Hook to add a new design category
export const useAddDesignCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, category }: { clientId: string; category: string }) => {
      console.log('[useAddDesignCategory] Adding category:', category, 'for client:', clientId);

      // Check if category already exists
      const { data: existing } = await supabase
        .from('client_design_settings')
        .select('id')
        .eq('client_id', clientId)
        .eq('category', category)
        .eq('is_active', true)
        .single();

      if (existing) {
        throw new Error(`הקטגוריה "${category}" כבר קיימת עבור לקוח זה`);
      }

      const { data, error } = await supabase
        .from('client_design_settings')
        .insert({
          client_id: clientId,
          category: category,
          reference_images: [],
          style_notes: '',
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('[useAddDesignCategory] Error adding category:', error);
        throw error;
      }

      console.log('[useAddDesignCategory] Successfully added category:', data);
      return data;
    },
    onSuccess: (data, { clientId, category }) => {
      queryClient.invalidateQueries({ queryKey: ['client-design-settings', clientId] });
      toast.success(`קטגוריית "${category}" נוספה בהצלחה`);
    },
    onError: (error: any) => {
      console.error('[useAddDesignCategory] Mutation error:', error);
      toast.error(error.message || 'שגיאה בהוספת הקטגוריה');
    }
  });
};

// Hook to update design settings
export const useUpdateDesignSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      settingId, 
      updates 
    }: { 
      settingId: string; 
      updates: Partial<Omit<ClientDesignSetting, 'id' | 'client_id' | 'created_at' | 'updated_at'>>
    }) => {
      console.log('[useUpdateDesignSettings] Updating setting:', settingId, updates);

      const { data, error } = await supabase
        .from('client_design_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', settingId)
        .select()
        .single();

      if (error) {
        console.error('[useUpdateDesignSettings] Error updating setting:', error);
        throw error;
      }

      console.log('[useUpdateDesignSettings] Successfully updated setting:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-design-settings', data.client_id] });
      toast.success('הגדרות העיצוב עודכנו בהצלחה');
    },
    onError: (error: any) => {
      console.error('[useUpdateDesignSettings] Mutation error:', error);
      toast.error(`שגיאה בעדכון הגדרות העיצוב: ${error.message}`);
    }
  });
};

// Hook to upload reference images
export const useUploadReferenceImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      clientId, 
      settingId, 
      file 
    }: { 
      clientId: string; 
      settingId: string; 
      file: File 
    }) => {
      console.log('[useUploadReferenceImage] Uploading image for setting:', settingId);

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientId}/${settingId}/${Date.now()}.${fileExt}`;
      const filePath = `client-design-references/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('food-vision-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[useUploadReferenceImage] Upload error:', uploadError);
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('food-vision-images')
        .getPublicUrl(filePath);

      // Get current setting
      const { data: currentSetting, error: fetchError } = await supabase
        .from('client_design_settings')
        .select('reference_images')
        .eq('id', settingId)
        .single();

      if (fetchError) {
        console.error('[useUploadReferenceImage] Fetch error:', fetchError);
        throw fetchError;
      }

      // Add new image to the array
      const updatedImages = [...(currentSetting.reference_images || []), publicUrl];

      // Update the setting with new image
      const { data, error } = await supabase
        .from('client_design_settings')
        .update({
          reference_images: updatedImages,
          updated_at: new Date().toISOString()
        })
        .eq('id', settingId)
        .select()
        .single();

      if (error) {
        console.error('[useUploadReferenceImage] Update error:', error);
        throw error;
      }

      console.log('[useUploadReferenceImage] Successfully uploaded and updated:', data);
      return { url: publicUrl, setting: data };
    },
    onSuccess: (data, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: ['client-design-settings', clientId] });
      toast.success('תמונת הרקע הועלתה בהצלחה');
    },
    onError: (error: any) => {
      console.error('[useUploadReferenceImage] Mutation error:', error);
      toast.error(`שגיאה בהעלאת התמונה: ${error.message}`);
    }
  });
};

// Hook to remove reference image
export const useRemoveReferenceImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      clientId, 
      settingId, 
      imageUrl 
    }: { 
      clientId: string; 
      settingId: string; 
      imageUrl: string 
    }) => {
      console.log('[useRemoveReferenceImage] Removing image:', imageUrl, 'from setting:', settingId);

      // Get current setting
      const { data: currentSetting, error: fetchError } = await supabase
        .from('client_design_settings')
        .select('reference_images')
        .eq('id', settingId)
        .single();

      if (fetchError) {
        console.error('[useRemoveReferenceImage] Fetch error:', fetchError);
        throw fetchError;
      }

      // Remove image from array
      const updatedImages = (currentSetting.reference_images || []).filter(
        (url: string) => url !== imageUrl
      );

      // Update the setting
      const { data, error } = await supabase
        .from('client_design_settings')
        .update({
          reference_images: updatedImages,
          updated_at: new Date().toISOString()
        })
        .eq('id', settingId)
        .select()
        .single();

      if (error) {
        console.error('[useRemoveReferenceImage] Update error:', error);
        throw error;
      }

      // Optionally delete from storage (commented out for safety)
      // const filePath = imageUrl.split('/').slice(-4).join('/'); // Extract path from URL
      // await supabase.storage.from('food-vision-images').remove([filePath]);

      console.log('[useRemoveReferenceImage] Successfully removed image:', data);
      return data;
    },
    onSuccess: (data, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: ['client-design-settings', clientId] });
      toast.success('תמונת הרקע הוסרה בהצלחה');
    },
    onError: (error: any) => {
      console.error('[useRemoveReferenceImage] Mutation error:', error);
      toast.error(`שגיאה בהסרת התמונה: ${error.message}`);
    }
  });
}; 