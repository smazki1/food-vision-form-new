
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

export const usePublicImageUpload = () => {
  const handleImageUpload = (files: File[], setFormData: (updater: (prev: any) => any) => void, setErrors: (updater: (prev: any) => any) => void) => {
    if (files.length > 10) {
      toast.error('ניתן להעלות עד 10 תמונות בלבד');
      return;
    }
    setFormData(prev => ({ ...prev, images: files }));
    setErrors(prev => ({ ...prev, images: '' }));
  };

  const removeImage = (index: number, setFormData: (updater: (prev: any) => any) => void) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const uploadImages = async (images: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const file of images) {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `public-submissions/${fileName}`;
      
      console.log(`[Upload] Uploading to: ${filePath}`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('food-vision-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error(`שגיאה בהעלאת קובץ: ${file.name}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from('food-vision-images')
        .getPublicUrl(filePath);
        
      uploadedUrls.push(publicUrlData.publicUrl);
      console.log(`[Upload] Successfully uploaded: ${publicUrlData.publicUrl}`);
    }
    
    return uploadedUrls;
  };

  return {
    handleImageUpload,
    removeImage,
    uploadImages
  };
};
