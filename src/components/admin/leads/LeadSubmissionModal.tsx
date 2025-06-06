import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  CheckCircle,
  AlertTriangle,
  FileText,
  UtensilsCrossed,
  Coffee,
  Wine,
  Building,
  Package,
  Paperclip
} from 'lucide-react';
import { Lead } from '@/types/lead';

// Utility function to sanitize path components for storage
const sanitizePathComponent = (text: string): string => {
  // First, replace whole Hebrew words with their English equivalents
  const hebrewToEnglish: Record<string, string> = {
    'מנה': 'dish',
    'שתיה': 'drink', 
    'קוקטייל': 'cocktail',
    'עוגה': 'cake',
    'קינוח': 'dessert',
    'סלט': 'salad',
    'מרק': 'soup',
    'פיצה': 'pizza',
    'המבורגר': 'hamburger',
    'סטייק': 'steak',
    'פסטה': 'pasta',
    'סושי': 'sushi',
    'כריך': 'sandwich'
  };

  let result = text;
  
  // Replace known Hebrew words
  Object.entries(hebrewToEnglish).forEach(([hebrew, english]) => {
    result = result.replace(new RegExp(hebrew, 'g'), english);
  });
  
  // Replace any remaining Hebrew characters with dashes
  result = result.replace(/[א-ת]/g, '-');
  
  // Replace any non-alphanumeric characters (except dash and underscore) with dash
  result = result.replace(/[^a-zA-Z0-9\-_]/g, '-');
  
  // Collapse multiple dashes into single dash
  result = result.replace(/-+/g, '-');
  
  // Remove leading and trailing dashes
  result = result.replace(/^-|-$/g, '');
  
  return result;
};

interface LeadSubmissionModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

interface SubmissionFormData {
  itemName: string;
  itemType: string;
  description: string;
  specialNotes: string;
  referenceImages: File[];
  brandingMaterials: File[];
  referenceExamples: File[];
}

const ITEM_TYPES = [
  { value: 'מנה', label: 'מנה/מוצר', icon: UtensilsCrossed },
  { value: 'שתיה', label: 'שתיה', icon: Coffee },
  { value: 'קוקטייל', label: 'קוקטייל', icon: Wine }
];

export const LeadSubmissionModal: React.FC<LeadSubmissionModalProps> = ({
  lead,
  isOpen,
  onClose
}) => {
  const [formData, setFormData] = useState<SubmissionFormData>({
    itemName: '',
    itemType: '',
    description: '',
    specialNotes: '',
    referenceImages: [],
    brandingMaterials: [],
    referenceExamples: []
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [brandingPreviews, setBrandingPreviews] = useState<string[]>([]);
  const [referencePreviews, setReferencePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const queryClient = useQueryClient();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        itemName: '',
        itemType: '',
        description: '',
        specialNotes: '',
        referenceImages: [],
        brandingMaterials: [],
        referenceExamples: []
      });
      setImagePreviews([]);
      setBrandingPreviews([]);
      setReferencePreviews([]);
      setErrors({});
    } else {
      // Cleanup image previews when modal closes
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      brandingPreviews.forEach(url => URL.revokeObjectURL(url));
      referencePreviews.forEach(url => URL.revokeObjectURL(url));
      setImagePreviews([]);
      setBrandingPreviews([]);
      setReferencePreviews([]);
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      brandingPreviews.forEach(url => URL.revokeObjectURL(url));
      referencePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Enter' && event.ctrlKey) {
        // Ctrl+Enter to submit
        if (formData.itemName.trim() && formData.itemType && formData.referenceImages.length > 0 && !isSubmitting) {
          handleSubmit();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, formData, isSubmitting]);

  const handleInputChange = (field: keyof SubmissionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing/selecting
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSelectChange = (field: keyof SubmissionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user makes a selection
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const currentTotal = formData.referenceImages.length + newFiles.length;
    
    if (currentTotal > 10) {
      toast.error('ניתן להעלות עד 10 תמונות בסך הכל');
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    newFiles.forEach(file => {
      if (!file.type.startsWith('image/')) {
        invalidFiles.push(`${file.name} - פורמט לא נתמך`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        invalidFiles.push(`${file.name} - קובץ גדול מדי (מעל 10MB)`);
        return;
      }
      validFiles.push(file);
    });

    if (invalidFiles.length > 0) {
      toast.error(`קבצים לא תקינים:\n${invalidFiles.join('\n')}`);
    }

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        referenceImages: [...prev.referenceImages, ...validFiles]
      }));

      // Create previews
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }

    // Reset input
    event.target.value = '';
  };

  const handleBrandingUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const currentTotal = formData.brandingMaterials.length + newFiles.length;
    
    if (currentTotal > 5) {
      toast.error('ניתן להעלות עד 5 קבצי מיתוג');
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    newFiles.forEach(file => {
      const validTypes = ['image/', 'application/pdf', 'application/vnd.openxmlformats-officedocument'];
      const isValidType = validTypes.some(type => file.type.startsWith(type));
      
      if (!isValidType) {
        invalidFiles.push(`${file.name} - פורמט לא נתמך (נדרש: תמונה, PDF או מסמך Word)`);
        return;
      }
      if (file.size > 25 * 1024 * 1024) { // 25MB limit
        invalidFiles.push(`${file.name} - קובץ גדול מדי (מעל 25MB)`);
        return;
      }
      validFiles.push(file);
    });

    if (invalidFiles.length > 0) {
      toast.error(`קבצים לא תקינים:\n${invalidFiles.join('\n')}`);
    }

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        brandingMaterials: [...prev.brandingMaterials, ...validFiles]
      }));

      // Create previews for images
      const newPreviews = validFiles.map(file => {
        if (file.type.startsWith('image/')) {
          return URL.createObjectURL(file);
        }
        return ''; // No preview for non-images
      });
      setBrandingPreviews(prev => [...prev, ...newPreviews]);
    }

    // Reset input
    event.target.value = '';
  };

  const handleReferenceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const currentTotal = formData.referenceExamples.length + newFiles.length;
    
    if (currentTotal > 5) {
      toast.error('ניתן להעלות עד 5 קבצי דוגמאות');
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    newFiles.forEach(file => {
      const validTypes = ['image/', 'application/pdf', 'application/vnd.openxmlformats-officedocument'];
      const isValidType = validTypes.some(type => file.type.startsWith(type));
      
      if (!isValidType) {
        invalidFiles.push(`${file.name} - פורמט לא נתמך (נדרש: תמונה, PDF או מסמך Word)`);
        return;
      }
      if (file.size > 25 * 1024 * 1024) { // 25MB limit
        invalidFiles.push(`${file.name} - קובץ גדול מדי (מעל 25MB)`);
        return;
      }
      validFiles.push(file);
    });

    if (invalidFiles.length > 0) {
      toast.error(`קבצים לא תקינים:\n${invalidFiles.join('\n')}`);
    }

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        referenceExamples: [...prev.referenceExamples, ...validFiles]
      }));

      // Create previews for images
      const newPreviews = validFiles.map(file => {
        if (file.type.startsWith('image/')) {
          return URL.createObjectURL(file);
        }
        return ''; // No preview for non-images
      });
      setReferencePreviews(prev => [...prev, ...newPreviews]);
    }

    // Reset input
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      referenceImages: prev.referenceImages.filter((_, i) => i !== index)
    }));
    
    // Revoke and remove preview
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeBrandingFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      brandingMaterials: prev.brandingMaterials.filter((_, i) => i !== index)
    }));
    
    // Revoke and remove preview if it exists
    if (brandingPreviews[index]) {
      URL.revokeObjectURL(brandingPreviews[index]);
    }
    setBrandingPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeReferenceFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      referenceExamples: prev.referenceExamples.filter((_, i) => i !== index)
    }));
    
    // Revoke and remove preview if it exists
    if (referencePreviews[index]) {
      URL.revokeObjectURL(referencePreviews[index]);
    }
    setReferencePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.itemName.trim()) {
      newErrors.itemName = 'שם הפריט הוא שדה חובה';
    }

    if (!formData.itemType) {
      newErrors.itemType = 'סוג הפריט הוא שדה חובה';
    }

    if (formData.referenceImages.length < 1) {
      newErrors.referenceImages = 'יש להעלות לפחות תמונה אחת';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('יש לתקן את השגיאות בטופס');
      return;
    }

    setIsSubmitting(true);
    toast.info('מעלה קבצים ושומר הגשה...');

    try {
      const newItemId = uuidv4();
      
      // Sanitize item type for storage path
      const sanitizedItemType = sanitizePathComponent(formData.itemType) || 'item';
      
      // Upload reference images to Supabase storage
      const uploadPromises = formData.referenceImages.map(async (file) => {
        const fileExtension = file.name.split('.').pop();
        const uniqueFileName = `${newItemId}/${uuidv4()}.${fileExtension}`;
        // Store in lead's folder structure with sanitized path
        const filePath = `leads/${lead.lead_id}/${sanitizedItemType}/${uniqueFileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('food-vision-images')
          .upload(filePath, file);
        
        if (uploadError) {
          throw new Error(`שגיאה בהעלאת קובץ ${file.name}: ${uploadError.message}`);
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('food-vision-images')
          .getPublicUrl(filePath);
        
        if (!publicUrlData?.publicUrl) {
          throw new Error(`שגיאה בקבלת URL ציבורי עבור ${file.name}`);
        }
        
        return publicUrlData.publicUrl;
      });

      // Upload branding materials if any
      const brandingUploadPromises = formData.brandingMaterials.map(async (file) => {
        const fileExtension = file.name.split('.').pop();
        const uniqueFileName = `${newItemId}/${uuidv4()}.${fileExtension}`;
        const filePath = `leads/${lead.lead_id}/${sanitizedItemType}/branding/${uniqueFileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('food-vision-images')
          .upload(filePath, file);
        
        if (uploadError) {
          throw new Error(`שגיאה בהעלאת קובץ מיתוג ${file.name}: ${uploadError.message}`);
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('food-vision-images')
          .getPublicUrl(filePath);
        
        if (!publicUrlData?.publicUrl) {
          throw new Error(`שגיאה בקבלת URL ציבורי עבור קובץ מיתוג ${file.name}`);
        }
        
        return publicUrlData.publicUrl;
      });

      // Upload reference examples if any
      const referenceUploadPromises = formData.referenceExamples.map(async (file) => {
        const fileExtension = file.name.split('.').pop();
        const uniqueFileName = `${newItemId}/${uuidv4()}.${fileExtension}`;
        const filePath = `leads/${lead.lead_id}/${sanitizedItemType}/reference/${uniqueFileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('food-vision-images')
          .upload(filePath, file);
        
        if (uploadError) {
          throw new Error(`שגיאה בהעלאת קובץ דוגמה ${file.name}: ${uploadError.message}`);
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('food-vision-images')
          .getPublicUrl(filePath);
        
        if (!publicUrlData?.publicUrl) {
          throw new Error(`שגיאה בקבלת URL ציבורי עבור קובץ דוגמה ${file.name}`);
        }
        
        return publicUrlData.publicUrl;
      });
      
      // Wait for all uploads to complete
      const uploadedImageUrls = await Promise.all(uploadPromises);
      const uploadedBrandingUrls = formData.brandingMaterials.length > 0 ? await Promise.all(brandingUploadPromises) : [];
      const uploadedReferenceUrls = formData.referenceExamples.length > 0 ? await Promise.all(referenceUploadPromises) : [];
      
      // Create submission record linked to the lead with all file types
      const description = formData.description || '';
      const specialNotes = formData.specialNotes || '';
      const combinedDescription = [description, specialNotes].filter(Boolean).join('\n\nהערות: ');
      
      const submissionData = {
        lead_id: lead.lead_id,
        item_type: formData.itemType,
        item_name_at_submission: formData.itemName,
        submission_status: 'ממתינה לעיבוד' as const,
        original_image_urls: uploadedImageUrls,
        branding_material_urls: uploadedBrandingUrls.length > 0 ? uploadedBrandingUrls : null,
        reference_example_urls: uploadedReferenceUrls.length > 0 ? uploadedReferenceUrls : null,
        description: combinedDescription || null
      };

      const { error: submissionError } = await supabase
        .from('customer_submissions')
        .insert(submissionData);

      if (submissionError) {
        console.error('Submission error:', submissionError);
        throw new Error(`שגיאה בשמירת ההגשה: ${submissionError.message}`);
      }

      // Log activity for the lead
      const additionalFiles = uploadedBrandingUrls.length + uploadedReferenceUrls.length;
      const additionalFilesText = additionalFiles > 0 ? ` + ${additionalFiles} קבצים נוספים` : '';
      const activityData = {
        lead_id: lead.lead_id,
        activity_description: `הועלתה הגשה חדשה: ${formData.itemName} (${formData.itemType}) - ${uploadedImageUrls.length} תמונות${additionalFilesText}`
      };

      await supabase
        .from('lead_activity_log')
        .insert(activityData);

      toast.success('ההגשה נוצרה בהצלחה!');
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['enhanced-leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', lead.lead_id] });
      queryClient.invalidateQueries({ queryKey: ['submissions', lead.lead_id] });
      queryClient.invalidateQueries({ queryKey: ['customer-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      onClose();
      
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || 'אירעה שגיאה במהלך ההגשה');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            העלאת הגשה לליד - {lead.restaurant_name}
          </DialogTitle>
          <DialogDescription>
            הוספת הגשה חדשה הקשורה לליד זה
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-200px)] overflow-y-auto">
          <div className="space-y-6 p-1">
            {/* Form Progress Indicator */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">מצב ההגשה</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {formData.itemName.trim() ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300"></div>
                  )}
                  <span className={formData.itemName.trim() ? 'text-green-700' : 'text-gray-600'}>
                    שם הפריט {formData.itemName.trim() ? '✓' : '(נדרש)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {formData.itemType ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300"></div>
                  )}
                  <span className={formData.itemType ? 'text-green-700' : 'text-gray-600'}>
                    סוג הפריט {formData.itemType ? '✓' : '(נדרש)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {formData.referenceImages.length > 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300"></div>
                  )}
                  <span className={formData.referenceImages.length > 0 ? 'text-green-700' : 'text-gray-600'}>
                    תמונות ({formData.referenceImages.length}/10) {formData.referenceImages.length > 0 ? '✓' : '(נדרש לפחות 1)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Lead Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="h-5 w-5" />
                  פרטי הליד
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">מסעדה:</span> {lead.restaurant_name}
                  </div>
                  <div>
                    <span className="font-medium">איש קשר:</span> {lead.contact_name || 'לא צוין'}
                  </div>
                  <div>
                    <span className="font-medium">טלפון:</span> {lead.phone || 'לא צוין'}
                  </div>
                  <div>
                    <span className="font-medium">אימייל:</span> {lead.email || 'לא צוין'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Submission Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                פרטי ההגשה
              </h3>

              {/* Item Name */}
              <div className="space-y-2">
                <Label htmlFor="itemName">שם הפריט *</Label>
                <Input
                  id="itemName"
                  value={formData.itemName}
                  onChange={(e) => handleInputChange('itemName', e.target.value)}
                  placeholder="הזן את שם הפריט"
                  className={errors.itemName ? 'border-red-500' : ''}
                />
                {errors.itemName && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {errors.itemName}
                  </p>
                )}
              </div>

              {/* Item Type */}
              <div className="space-y-2">
                <Label htmlFor="itemType">סוג הפריט *</Label>
                <Input
                  id="itemType"
                  value={formData.itemType}
                  onChange={(e) => handleInputChange('itemType', e.target.value)}
                  placeholder="לדוגמה: מנה, שתיה, צמיד, כוסות..."
                  maxLength={50}
                  className={errors.itemType ? 'border-red-500' : ''}
                />
                {errors.itemType && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {errors.itemType}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  הזינו תיאור קצר של סוג הפריט (עד 50 תווים)
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">תיאור הפריט</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="תאר את הפריט, מרכיבים, דרך הכנה וכו'"
                  rows={3}
                />
              </div>

              {/* Special Notes */}
              <div className="space-y-2">
                <Label htmlFor="specialNotes">הערות מיוחדות</Label>
                <Textarea
                  id="specialNotes"
                  value={formData.specialNotes}
                  onChange={(e) => handleInputChange('specialNotes', e.target.value)}
                  placeholder="הערות נוספות, דרישות מיוחדות וכו'"
                  rows={2}
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>תמונות הפריט *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <Label htmlFor="imageUpload" className="cursor-pointer">
                      <Button variant="outline" asChild>
                        <span>בחר תמונות</span>
                      </Button>
                    </Label>
                    <Input
                      id="imageUpload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <p className="text-sm text-gray-500">
                      JPG, PNG או WEBP עד 10MB לתמונה. עד 10 תמונות.
                    </p>
                  </div>
                </div>
                
                {errors.referenceImages && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {errors.referenceImages}
                  </p>
                )}

                {/* Image Previews */}
                {formData.referenceImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {formData.referenceImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imagePreviews[index]}
                          alt={`תצוגה מקדימה ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-xs p-1 rounded truncate">
                          {file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Branding Materials Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  חומרי מיתוג (אופציונלי)
                </Label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                  <Package className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <div className="space-y-2">
                    <Label htmlFor="brandingUpload" className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>העלה חומרי מיתוג</span>
                      </Button>
                    </Label>
                    <Input
                      id="brandingUpload"
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleBrandingUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500">
                      לוגו, מדריך מיתוג, צבעים וכדומה. עד 5 קבצים, 25MB לקובץ.
                    </p>
                  </div>
                </div>

                {/* Branding Files List */}
                {formData.brandingMaterials.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {formData.brandingMaterials.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded border">
                        <div className="flex items-center gap-2">
                          {file.type.startsWith('image/') ? (
                            <img
                              src={brandingPreviews[index]}
                              alt={file.name}
                              className="w-8 h-8 object-cover rounded"
                            />
                          ) : (
                            <Paperclip className="h-4 w-4 text-blue-600" />
                          )}
                          <span className="text-sm text-blue-800 truncate max-w-[200px]">{file.name}</span>
                          <span className="text-xs text-blue-600">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBrandingFile(index)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reference Examples Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  דוגמאות ורפרנסים (אופציונלי)
                </Label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                  <Paperclip className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <div className="space-y-2">
                    <Label htmlFor="referenceUpload" className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>העלה דוגמאות</span>
                      </Button>
                    </Label>
                    <Input
                      id="referenceUpload"
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleReferenceUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500">
                      תמונות השראה, סגנונות, דוגמאות מתחרים וכדומה. עד 5 קבצים, 25MB לקובץ.
                    </p>
                  </div>
                </div>

                {/* Reference Files List */}
                {formData.referenceExamples.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {formData.referenceExamples.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-purple-50 rounded border">
                        <div className="flex items-center gap-2">
                          {file.type.startsWith('image/') ? (
                            <img
                              src={referencePreviews[index]}
                              alt={file.name}
                              className="w-8 h-8 object-cover rounded"
                            />
                          ) : (
                            <Paperclip className="h-4 w-4 text-purple-600" />
                          )}
                          <span className="text-sm text-purple-800 truncate max-w-[200px]">{file.name}</span>
                          <span className="text-xs text-purple-600">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeReferenceFile(index)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex-shrink-0 flex flex-col gap-3 pt-4 border-t-2 border-gray-200 bg-white p-4 shadow-lg">
          {/* Form Validation Summary */}
          {(!formData.itemName.trim() || !formData.itemType || formData.referenceImages.length === 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  יש להשלים את השדות הנדרשים לפני שליחת ההגשה
                </span>
              </div>
            </div>
          )}
          
          {/* Ready to Submit */}
          {formData.itemName.trim() && formData.itemType && formData.referenceImages.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  ההגשה מוכנה לשליחה! לחץ על "צור הגשה" או השתמש ב-Ctrl+Enter
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting} size="lg">
              ביטול
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !formData.itemName.trim() || formData.referenceImages.length === 0}
              className="min-w-[140px] bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  שולח הגשה...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 ml-2" />
                  צור הגשה
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 