import { supabase } from '@/integrations/supabase/client';

export const uploadImages = async (
  files: File[],
  isAuthenticated: boolean,
  clientId: string | null,
  itemType: string
): Promise<string[]> => {
  const uploadedImageUrls: string[] = [];
  
  for (const file of files) {
    console.log('[ImageUpload] Uploading file:', file.name);
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    let filePath: string;
    if (isAuthenticated && clientId) {
      filePath = `${clientId}/${itemType}/${fileName}`;
    } else {
      filePath = `public-submissions/${fileName}`;
    }

    const { error: uploadError } = await supabase.storage
      .from('food-vision-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('[ImageUpload] Upload error:', uploadError);
      throw new Error(`שגיאה בהעלאת תמונה: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('food-vision-images')
      .getPublicUrl(filePath);

    uploadedImageUrls.push(publicUrl);
    console.log('[ImageUpload] Uploaded image URL:', publicUrl);
  }

  console.log('[ImageUpload] All images uploaded successfully');
  return uploadedImageUrls;
};

export const uploadAdditionalFiles = async (
  files: File[],
  fileType: 'branding' | 'reference',
  isAuthenticated: boolean,
  clientId: string | null,
  itemType: string
): Promise<string[]> => {
  if (!files || files.length === 0) {
    return [];
  }

  const uploadedFileUrls: string[] = [];
  
  for (const file of files) {
    console.log(`[AdditionalFileUpload] Uploading ${fileType} file:`, file.name);
    const fileExt = file.name.split('.').pop() || 'pdf';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    let filePath: string;
    if (isAuthenticated && clientId) {
      filePath = `${clientId}/${itemType}/${fileType}/${fileName}`;
    } else {
      filePath = `public-submissions/${fileType}/${fileName}`;
    }

    const { error: uploadError } = await supabase.storage
      .from('food-vision-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error(`[AdditionalFileUpload] Upload error for ${fileType}:`, uploadError);
      throw new Error(`שגיאה בהעלאת קובץ ${fileType === 'branding' ? 'מיתוג' : 'רפרנס'}: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('food-vision-images')
      .getPublicUrl(filePath);

    uploadedFileUrls.push(publicUrl);
    console.log(`[AdditionalFileUpload] Uploaded ${fileType} file URL:`, publicUrl);
  }

  console.log(`[AdditionalFileUpload] All ${fileType} files uploaded successfully`);
  return uploadedFileUrls;
};
