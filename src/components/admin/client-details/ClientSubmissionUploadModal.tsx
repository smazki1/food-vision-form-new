import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { sanitizePathComponent } from '@/utils/pathSanitization';
import { v4 as uuidv4 } from 'uuid';
import { Client } from '@/types/client';

interface ClientSubmissionUploadModalProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
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

export const ClientSubmissionUploadModal: React.FC<ClientSubmissionUploadModalProps> = ({
  client,
  isOpen,
  onClose,
  onSuccess
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemTypes = [
    { value: 'dish', label: 'מנה' },
    { value: 'drink', label: 'שתיה' },
    { value: 'cocktail', label: 'קוקטייל' },
    { value: 'dessert', label: 'קינוח' },
    { value: 'appetizer', label: 'מנה ראשונה' },
    { value: 'main', label: 'מנה עיקרית' },
    { value: 'salad', label: 'סלט' },
    { value: 'soup', label: 'מרק' },
    { value: 'bread', label: 'לחם/מאפה' },
    { value: 'sauce', label: 'רוטב' },
    { value: 'other', label: 'אחר' }
  ];

  const handleFileUpload = (files: FileList | null, type: 'referenceImages' | 'brandingMaterials' | 'referenceExamples') => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const maxFiles = 10;
    const maxSize = 25 * 1024 * 1024; // 25MB
    
    // Validate file count
    if (fileArray.length > maxFiles) {
      toast.error(`ניתן להעלות עד ${maxFiles} קבצים בכל פעם`);
      return;
    }
    
    // Validate file sizes and types
    for (const file of fileArray) {
      if (file.size > maxSize) {
        toast.error(`הקובץ ${file.name} גדול מדי. גודל מקסימלי: 25MB`);
        return;
      }
      
      if (type === 'referenceImages' && !file.type.startsWith('image/')) {
        toast.error(`${file.name} אינו קובץ תמונה תקין`);
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], ...fileArray]
    }));
  };

  const removeFile = (index: number, type: 'referenceImages' | 'brandingMaterials' | 'referenceExamples') => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.itemName.trim()) {
      toast.error('יש להזין שם פריט');
      return;
    }
    
    if (!formData.itemType) {
      toast.error('יש לבחור סוג פריט');
      return;
    }
    
    if (formData.referenceImages.length === 0) {
      toast.error('יש להעלות לפחות תמונת רפרנס אחת');
      return;
    }

    setIsSubmitting(true);
    try {
      const newItemId = uuidv4();
      const sanitizedItemType = sanitizePathComponent(formData.itemType);
      
      // Upload reference images
      const uploadPromises = formData.referenceImages.map(async (file) => {
        const fileExtension = file.name.split('.').pop();
        const uniqueFileName = `${newItemId}/${uuidv4()}.${fileExtension}`;
        const filePath = `clients/${client.client_id}/${sanitizedItemType}/product/${uniqueFileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('food-vision-images')
          .upload(filePath, file);
        
        if (uploadError) {
          throw new Error(`שגיאה בהעלאת ${file.name}: ${uploadError.message}`);
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('food-vision-images')
          .getPublicUrl(filePath);
        
        if (!publicUrlData?.publicUrl) {
          throw new Error(`שגיאה בקבלת URL ציבורי עבור ${file.name}`);
        }
        
        return publicUrlData.publicUrl;
      });

      // Upload branding materials
      const brandingUploadPromises = formData.brandingMaterials.map(async (file) => {
        const fileExtension = file.name.split('.').pop();
        const uniqueFileName = `${newItemId}/${uuidv4()}.${fileExtension}`;
        const filePath = `clients/${client.client_id}/${sanitizedItemType}/branding/${uniqueFileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('food-vision-images')
          .upload(filePath, file);
        
        if (uploadError) {
          throw new Error(`שגיאה בהעלאת חומר מיתוג ${file.name}: ${uploadError.message}`);
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('food-vision-images')
          .getPublicUrl(filePath);
        
        if (!publicUrlData?.publicUrl) {
          throw new Error(`שגיאה בקבלת URL ציבורי עבור חומר מיתוג ${file.name}`);
        }
        
        return publicUrlData.publicUrl;
      });

      // Upload reference examples
      const referenceUploadPromises = formData.referenceExamples.map(async (file) => {
        const fileExtension = file.name.split('.').pop();
        const uniqueFileName = `${newItemId}/${uuidv4()}.${fileExtension}`;
        const filePath = `clients/${client.client_id}/${sanitizedItemType}/reference/${uniqueFileName}`;
        
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
      
      // Create submission record
      const description = formData.description || '';
      const specialNotes = formData.specialNotes || '';
      const combinedDescription = [description, specialNotes].filter(Boolean).join('\n\nהערות: ');

      const submissionData = {
        client_id: client.client_id,
        original_item_id: newItemId,
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
        throw new Error(`שגיאה ביצירת ההגשה: ${submissionError.message}`);
      }

      toast.success('ההגשה נוצרה בהצלחה!');
      
      // Reset form
      setFormData({
        itemName: '',
        itemType: '',
        description: '',
        specialNotes: '',
        referenceImages: [],
        brandingMaterials: [],
        referenceExamples: []
      });
      
      onSuccess?.();
      onClose();
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'אירעה שגיאה בעת יצירת ההגשה');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            העלה הגשה חדשה עבור {client.restaurant_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="itemName">שם הפריט *</Label>
              <Input
                id="itemName"
                value={formData.itemName}
                onChange={(e) => setFormData(prev => ({ ...prev, itemName: e.target.value }))}
                placeholder="הזן שם פריט..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="itemType">סוג פריט *</Label>
              <Select
                value={formData.itemType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, itemType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג פריט" />
                </SelectTrigger>
                <SelectContent>
                  {itemTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="תאר את הפריט..."
              rows={3}
            />
          </div>

          {/* Special Notes */}
          <div className="space-y-2">
            <Label htmlFor="specialNotes">הערות מיוחדות</Label>
            <Textarea
              id="specialNotes"
              value={formData.specialNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, specialNotes: e.target.value }))}
              placeholder="הערות נוספות..."
              rows={2}
            />
          </div>

          {/* Reference Images */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  תמונות רפרנס (חובה)
                </Label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                  <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <div className="space-y-2">
                    <Label htmlFor="imageUpload" className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>העלה תמונות</span>
                      </Button>
                    </Label>
                    <Input
                      id="imageUpload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files, 'referenceImages')}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500">
                      תמונות המוצר/מנה. עד 10 תמונות, 25MB לקובץ.
                    </p>
                  </div>
                </div>

                {/* Reference Images List */}
                {formData.referenceImages.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">תמונות שנבחרו:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {formData.referenceImages.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="bg-gray-100 rounded p-2 text-xs truncate pr-6">
                            {file.name}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-1 right-1 h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                            onClick={() => removeFile(index, 'referenceImages')}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Branding Materials */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  חומרי מיתוג (אופציונלי)
                </Label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                  <Paperclip className="h-8 w-8 mx-auto text-gray-400 mb-2" />
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
                      onChange={(e) => handleFileUpload(e.target.files, 'brandingMaterials')}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500">
                      לוגו, צבעי מותג, גופנים וכדומה. עד 5 קבצים, 25MB לקובץ.
                    </p>
                  </div>
                </div>

                {/* Branding Files List */}
                {formData.brandingMaterials.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">קבצים שנבחרו:</p>
                    <div className="space-y-1">
                      {formData.brandingMaterials.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-100 rounded p-2">
                          <span className="text-xs truncate flex-1">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => removeFile(index, 'brandingMaterials')}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reference Examples */}
          <Card>
            <CardContent className="p-4">
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
                      onChange={(e) => handleFileUpload(e.target.files, 'referenceExamples')}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500">
                      תמונות השראה, סגנונות, דוגמאות מתחרים וכדומה. עד 5 קבצים, 25MB לקובץ.
                    </p>
                  </div>
                </div>

                {/* Reference Files List */}
                {formData.referenceExamples.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">קבצים שנבחרו:</p>
                    <div className="space-y-1">
                      {formData.referenceExamples.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-100 rounded p-2">
                          <span className="text-xs truncate flex-1">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => removeFile(index, 'referenceExamples')}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              ביטול
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  יוצר הגשה...
                </>
              ) : (
                'צור הגשה'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 