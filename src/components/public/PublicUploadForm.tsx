
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';

interface FormData {
  restaurantName: string;
  itemType: 'dish' | 'cocktail' | 'drink' | '';
  itemName: string;
  description: string;
  category: string;
  ingredients: string;
  images: File[];
}

const PublicUploadForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    restaurantName: '',
    itemType: '',
    itemName: '',
    description: '',
    category: '',
    ingredients: '',
    images: []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 10) {
      toast.error('ניתן להעלות עד 10 תמונות בלבד');
      return;
    }
    setFormData(prev => ({ ...prev, images: files }));
    if (errors.images) {
      setErrors(prev => ({ ...prev, images: '' }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.restaurantName.trim()) {
      newErrors.restaurantName = 'שם המסעדה הוא שדה חובה';
    }
    if (!formData.itemType) {
      newErrors.itemType = 'סוג הפריט הוא שדה חובה';
    }
    if (!formData.itemName.trim()) {
      newErrors.itemName = 'שם הפריט הוא שדה חובה';
    }
    if (formData.images.length === 0) {
      newErrors.images = 'יש להעלות לפחות תמונה אחת';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const file of formData.images) {
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
      const fileName = `${Date.now()}-${sanitizedFileName}`;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('אנא תקן את השגיאות בטופס');
      return;
    }

    setIsSubmitting(true);
    toast.info('מעלה פרטי פריט ותמונות...');

    try {
      // Upload images first
      console.log('[Submit] Starting image upload...');
      const uploadedImageUrls = await uploadImages();
      console.log('[Submit] Images uploaded:', uploadedImageUrls);
      
      // Prepare parameters for the RPC call
      const rpcParams = {
        p_restaurant_name: formData.restaurantName.trim(),
        p_item_type: formData.itemType,
        p_item_name: formData.itemName.trim(),
        p_description: formData.description.trim() || null,
        p_category: formData.itemType !== 'cocktail' ? (formData.category.trim() || null) : null,
        p_ingredients: formData.itemType === 'cocktail' ? 
          (formData.ingredients.trim() ? formData.ingredients.split(',').map(i => i.trim()) : null) : null,
        p_reference_image_urls: uploadedImageUrls
      };

      console.log('[Submit] Calling RPC with params:', rpcParams);

      // Call the RPC function
      const { data: submissionData, error: submissionError } = await supabase.rpc(
        'public_submit_item_by_restaurant_name',
        rpcParams
      );

      if (submissionError) {
        console.error('Error submitting item via RPC:', submissionError);
        throw new Error(`שגיאה בהגשה: ${submissionError.message}`);
      }

      console.log('[Submit] RPC response:', submissionData);
      
      if (submissionData && submissionData.success) {
        toast.success(submissionData.message || 'הפריט הוגש בהצלחה!');
        // Reset form
        setFormData({
          restaurantName: '',
          itemType: '',
          itemName: '',
          description: '',
          category: '',
          ingredients: '',
          images: []
        });
        // Reset file input
        const fileInput = document.getElementById('images') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error('שגיאה לא ידועה בהגשה');
      }

    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(`שגיאה בהגשה: ${error.message || 'אירעה שגיאה לא צפויה'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">העלאת פריט חדש למסעדה</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Restaurant Name */}
              <div>
                <Label htmlFor="restaurantName">שם המסעדה *</Label>
                <Input
                  id="restaurantName"
                  value={formData.restaurantName}
                  onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                  placeholder="הזן את שם המסעדה"
                  className={errors.restaurantName ? 'border-red-500' : ''}
                />
                {errors.restaurantName && (
                  <p className="text-red-500 text-sm mt-1">{errors.restaurantName}</p>
                )}
              </div>

              {/* Item Type */}
              <div>
                <Label htmlFor="itemType">סוג הפריט *</Label>
                <Select 
                  value={formData.itemType} 
                  onValueChange={(value) => handleInputChange('itemType', value)}
                >
                  <SelectTrigger className={errors.itemType ? 'border-red-500' : ''}>
                    <SelectValue placeholder="בחר סוג פריט" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dish">מנה</SelectItem>
                    <SelectItem value="cocktail">קוקטייל</SelectItem>
                    <SelectItem value="drink">משקה</SelectItem>
                  </SelectContent>
                </Select>
                {errors.itemType && (
                  <p className="text-red-500 text-sm mt-1">{errors.itemType}</p>
                )}
              </div>

              {/* Item Name */}
              <div>
                <Label htmlFor="itemName">שם הפריט *</Label>
                <Input
                  id="itemName"
                  value={formData.itemName}
                  onChange={(e) => handleInputChange('itemName', e.target.value)}
                  placeholder="הזן את שם הפריט"
                  className={errors.itemName ? 'border-red-500' : ''}
                />
                {errors.itemName && (
                  <p className="text-red-500 text-sm mt-1">{errors.itemName}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">תיאור הפריט</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="תאר את הפריט (אופציונלי)"
                  rows={3}
                />
              </div>

              {/* Category (for dishes and drinks) */}
              {formData.itemType && formData.itemType !== 'cocktail' && (
                <div>
                  <Label htmlFor="category">קטגוריה</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder={`קטגורית ${formData.itemType === 'dish' ? 'המנה' : 'המשקה'} (אופציונלי)`}
                  />
                </div>
              )}

              {/* Ingredients (for cocktails) */}
              {formData.itemType === 'cocktail' && (
                <div>
                  <Label htmlFor="ingredients">מרכיבים</Label>
                  <Input
                    id="ingredients"
                    value={formData.ingredients}
                    onChange={(e) => handleInputChange('ingredients', e.target.value)}
                    placeholder="הזן מרכיבים מופרדים בפסיק (אופציונלי)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    לדוגמה: וודקה, מיץ קרנברי, מיץ ליים
                  </p>
                </div>
              )}

              {/* Image Upload */}
              <div>
                <Label htmlFor="images">תמונות הפריט *</Label>
                <div className="mt-2">
                  <input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="images"
                    className={`border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition-colors flex flex-col items-center justify-center ${
                      errors.images ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">לחץ כדי לבחור תמונות</span>
                    <span className="text-xs text-gray-400 mt-1">עד 10 תמונות</span>
                  </label>
                </div>
                
                {/* Preview uploaded images */}
                {formData.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {formData.images.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`תצוגה מקדימה ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {errors.images && (
                  <p className="text-red-500 text-sm mt-1">{errors.images}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 text-lg"
              >
                {isSubmitting ? 'שולח...' : 'שלח פריט למסעדה'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicUploadForm;
