import React, { useState, useEffect } from 'react';
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
  Building
} from 'lucide-react';
import { Lead } from '@/types/lead';

interface LeadSubmissionModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

interface SubmissionFormData {
  itemName: string;
  itemType: 'dish' | 'cocktail' | 'drink';
  description: string;
  specialNotes: string;
  referenceImages: File[];
}

const ITEM_TYPES = [
  { value: 'dish', label: 'מנה/מוצר', icon: UtensilsCrossed },
  { value: 'drink', label: 'שתיה', icon: Coffee },
  { value: 'cocktail', label: 'קוקטייל', icon: Wine }
];

export const LeadSubmissionModal: React.FC<LeadSubmissionModalProps> = ({
  lead,
  isOpen,
  onClose
}) => {
  const [formData, setFormData] = useState<SubmissionFormData>({
    itemName: '',
    itemType: 'dish',
    description: '',
    specialNotes: '',
    referenceImages: []
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const queryClient = useQueryClient();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        itemName: '',
        itemType: 'dish',
        description: '',
        specialNotes: '',
        referenceImages: []
      });
      setImagePreviews([]);
      setErrors({});
    } else {
      // Cleanup image previews when modal closes
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      setImagePreviews([]);
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
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

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      referenceImages: prev.referenceImages.filter((_, i) => i !== index)
    }));
    
    // Revoke and remove preview
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
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
    toast.info('מעלה תמונות ושומר הגשה...');

    try {
      const newItemId = uuidv4();
      
      // Upload images to Supabase storage
      const uploadPromises = formData.referenceImages.map(async (file) => {
        const fileExtension = file.name.split('.').pop();
        const uniqueFileName = `${newItemId}/${uuidv4()}.${fileExtension}`;
        // Store in lead's folder structure
        const filePath = `leads/${lead.lead_id}/${formData.itemType}/${uniqueFileName}`;
        
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
      
      const uploadedImageUrls = await Promise.all(uploadPromises);
      
      // Create submission record linked to the lead
      const submissionData = {
        created_lead_id: lead.lead_id,
        lead_id: lead.lead_id,
        submission_contact_name: lead.contact_name || '',
        submission_contact_phone: lead.phone || '',
        submission_contact_email: lead.email || '',
        original_item_id: newItemId,
        item_type: formData.itemType,
        item_name_at_submission: formData.itemName,
        submission_status: 'ממתינה לעיבוד' as const,
        original_image_urls: uploadedImageUrls,
        internal_team_notes: `${formData.description ? `תיאור: ${formData.description}\n` : ''}${formData.specialNotes || ''}`.trim() || null
      };

      const { error: submissionError } = await supabase
        .from('customer_submissions')
        .insert(submissionData);

      if (submissionError) {
        console.error('Submission error:', submissionError);
        throw new Error(`שגיאה בשמירת ההגשה: ${submissionError.message}`);
      }

      // Log activity for the lead
      const activityData = {
        lead_id: lead.lead_id,
        activity_description: `הועלתה הגשה חדשה: ${formData.itemName} (${formData.itemType === 'dish' ? 'מנה' : formData.itemType === 'cocktail' ? 'קוקטייל' : 'שתיה'})`
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

  const selectedItemType = ITEM_TYPES.find(type => type.value === formData.itemType);

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
                <Label>סוג הפריט *</Label>
                <Select 
                  value={formData.itemType} 
                  onValueChange={(value) => handleSelectChange('itemType', value)}
                >
                  <SelectTrigger className={errors.itemType ? 'border-red-500' : ''}>
                    <SelectValue>
                      {selectedItemType && (
                        <div className="flex items-center gap-2">
                          <selectedItemType.icon className="h-4 w-4" />
                          {selectedItemType.label}
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.itemType && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {errors.itemType}
                  </p>
                )}
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