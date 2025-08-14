import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FormData {
  restaurantName: string;
  contactEmail: string;
  contactPhone: string;
  itemName: string;
  itemType: string;
  description: string;
  specialNotes: string;
  referenceImages: File[];
  brandingMaterials?: File[];
  referenceExamples?: File[];
  submitterName?: string;
}

export const handlePublicSubmission = async (
  _formData: FormData,
  _uploadedImageUrls: string[],
  _brandingMaterialUrls: string[] = [],
  _referenceExampleUrls: string[] = []
) => {
  throw new Error('Please log in to submit.');
};
