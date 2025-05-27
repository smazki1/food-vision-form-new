
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from 'lucide-react';

interface FormData {
  restaurantName: string;
  contactEmail: string;
  contactPhone: string;
  itemName: string;
  itemType: 'dish' | 'cocktail' | 'drink';
  description: string;
  specialNotes: string;
  referenceImages: File[];
}

const STEPS = [
  { id: 1, name: 'פרטי מסעדה' },
  { id: 2, name: 'פרטי פריט' },
  { id: 3, name: 'העלאת תמונות' },
  { id: 4, name: 'סקירה ואישור' }
];

const UnifiedUploadForm: React.FC = () => {
  const { isAuthenticated, user, clientId, role } = useUnifiedAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    restaurantName: '',
    contactEmail: '',
    contactPhone: '',
    itemName: '',
    itemType: 'dish',
    description: '',
    specialNotes: '',
    referenceImages: []
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load user data if authenticated
  useEffect(() => {
    const loadUserData = async () => {
      if (isAuthenticated && user?.id && clientId) {
        setIsLoadingUserData(true);
        try {
          const { data, error } = await supabase
            .from('clients')
            .select('restaurant_name, email, phone')
            .eq('client_id', clientId)
            .maybeSingle();

          if (data && !error) {
            setFormData(prev => ({
              ...prev,
              restaurantName: data.restaurant_name || '',
              contactEmail: data.email || user.email || '',
              contactPhone: data.phone || ''
            }));
          }
        } catch (err) {
          console.error('Error loading user data:', err);
        } finally {
          setIsLoadingUserData(false);
        }
      }
    };

    loadUserData();
  }, [isAuthenticated, user, clientId]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const totalFiles = formData.referenceImages.length + newFiles.length;

    if (totalFiles > 10) {
      toast.error('ניתן להעלות עד 10 תמונות');
      return;
    }

    // Create previews
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setFormData(prev => ({
      ...prev,
      referenceImages: [...prev.referenceImages, ...newFiles]
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      referenceImages: prev.referenceImages.filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.restaurantName.trim()) {
          newErrors.restaurantName = 'שם המסעדה הוא שדה חובה';
        }
        if (!isAuthenticated) {
          if (!formData.contactEmail.trim()) {
            newErrors.contactEmail = 'אימייל הוא שדה חובה';
          }
          if (!formData.contactPhone.trim()) {
            newErrors.contactPhone = 'מספר טלפון הוא שדה חובה';
          }
        }
        break;
      case 2:
        if (!formData.itemName.trim()) {
          newErrors.itemName = 'שם הפריט הוא שדה חובה';
        }
        break;
      case 3:
        if (formData.referenceImages.length === 0) {
          newErrors.referenceImages = 'יש להעלות לפחות תמונה אחת';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    try {
      // Upload images
      const uploadedImageUrls: string[] = [];
      
      for (const file of formData.referenceImages) {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${isAuthenticated ? 'authenticated' : 'public'}/uploads/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('food-vision-images')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`שגיאה בהעלאת תמונה: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('food-vision-images')
          .getPublicUrl(filePath);

        uploadedImageUrls.push(publicUrl);
      }

      // Prepare submission data
      const submissionData = {
        item_name_at_submission: formData.itemName,
        item_type: formData.itemType,
        submission_status: 'ממתינה לעיבוד' as const,
        original_image_urls: uploadedImageUrls,
        client_id: isAuthenticated ? clientId : null,
        contact_info: !isAuthenticated ? {
          restaurant_name: formData.restaurantName,
          email: formData.contactEmail,
          phone: formData.contactPhone
        } : null
      };

      // Insert submission
      const { error: submitError } = await supabase
        .from('customer_submissions')
        .insert(submissionData);

      if (submitError) {
        throw new Error(`שגיאה בשמירת ההגשה: ${submitError.message}`);
      }

      toast.success('הטופס נשלח בהצלחה!');
      
      // Reset form
      setFormData({
        restaurantName: isAuthenticated ? formData.restaurantName : '',
        contactEmail: isAuthenticated ? formData.contactEmail : '',
        contactPhone: isAuthenticated ? formData.contactPhone : '',
        itemName: '',
        itemType: 'dish',
        description: '',
        specialNotes: '',
        referenceImages: []
      });
      setImagePreviews([]);
      setCurrentStep(1);
      setErrors({});
      
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || 'אירעה שגיאה בעת שליחת הטופס');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">פרטי המסעדה</h2>
            
            {isAuthenticated && (
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  הפרטים נטענים אוטומטיט מהפרופיל שלך
                </AlertDescription>
              </Alert>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1">שם המסעדה *</label>
              <input
                type="text"
                className="w-full p-3 border rounded-md"
                value={formData.restaurantName}
                onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                disabled={isLoadingUserData}
              />
              {errors.restaurantName && (
                <p className="text-red-500 text-xs mt-1">{errors.restaurantName}</p>
              )}
            </div>

            {!isAuthenticated && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">אימייל *</label>
                  <input
                    type="email"
                    className="w-full p-3 border rounded-md"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  />
                  {errors.contactEmail && (
                    <p className="text-red-500 text-xs mt-1">{errors.contactEmail}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">מספר טלפון *</label>
                  <input
                    type="tel"
                    className="w-full p-3 border rounded-md"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  />
                  {errors.contactPhone && (
                    <p className="text-red-500 text-xs mt-1">{errors.contactPhone}</p>
                  )}
                </div>
              </>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">פרטי הפריט</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">שם הפריט *</label>
              <input
                type="text"
                className="w-full p-3 border rounded-md"
                value={formData.itemName}
                onChange={(e) => handleInputChange('itemName', e.target.value)}
                placeholder="הזן את שם הפריט"
              />
              {errors.itemName && (
                <p className="text-red-500 text-xs mt-1">{errors.itemName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">סוג הפריט</label>
              <select
                className="w-full p-3 border rounded-md"
                value={formData.itemType}
                onChange={(e) => handleInputChange('itemType', e.target.value as 'dish' | 'cocktail' | 'drink')}
              >
                <option value="dish">מנה</option>
                <option value="cocktail">קוקטייל</option>
                <option value="drink">משקה</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">תיאור</label>
              <textarea
                className="w-full p-3 border rounded-md"
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="תאר את הפריט (רכיבים, טעמים, סגנון וכו')"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">הערות מיוחדות</label>
              <textarea
                className="w-full p-3 border rounded-md"
                rows={2}
                value={formData.specialNotes}
                onChange={(e) => handleInputChange('specialNotes', e.target.value)}
                placeholder="הערות נוספות לצוות העיצוב"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">העלאת תמונות</h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">גרור תמונות לכאן או לחץ לבחירה</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files)}
                className="hidden"
                id="file-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                בחר תמונות
              </Button>
              <p className="text-xs text-gray-500 mt-2">עד 10 תמונות, כל תמונה עד 10MB</p>
            </div>

            {errors.referenceImages && (
              <p className="text-red-500 text-xs">{errors.referenceImages}</p>
            )}

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`תצוגה מקדימה ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">סקירה ואישור</h2>
            
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">פרטי המסעדה</h3>
                <p><strong>שם המסעדה:</strong> {formData.restaurantName}</p>
                {!isAuthenticated && (
                  <>
                    <p><strong>אימייל:</strong> {formData.contactEmail}</p>
                    <p><strong>טלפון:</strong> {formData.contactPhone}</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">פרטי הפריט</h3>
                <p><strong>שם הפריט:</strong> {formData.itemName}</p>
                <p><strong>סוג:</strong> {formData.itemType === 'dish' ? 'מנה' : formData.itemType === 'cocktail' ? 'קוקטייל' : 'משקה'}</p>
                {formData.description && <p><strong>תיאור:</strong> {formData.description}</p>}
                {formData.specialNotes && <p><strong>הערות:</strong> {formData.specialNotes}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">תמונות ({formData.referenceImages.length})</h3>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <img
                      key={index}
                      src={preview}
                      alt={`תמונה ${index + 1}`}
                      className="w-full h-20 object-cover rounded"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Progress Header */}
      <div className="p-4 bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep >= step.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {step.id}
                </div>
                <span className={`mr-2 text-sm ${currentStep >= step.id ? 'text-primary font-medium' : 'text-gray-500'}`}>
                  {step.name}
                </span>
                {index < STEPS.length - 1 && (
                  <ChevronLeft className="h-4 w-4 text-gray-400 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <main className="flex-grow p-4 md:p-6">
        <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-lg">
          {isLoadingUserData ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            renderStepContent()
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || isSubmitting}
            >
              <ChevronRight className="ml-2 h-4 w-4" />
              הקודם
            </Button>

            {currentStep < 4 ? (
              <Button onClick={handleNext} disabled={isSubmitting}>
                הבא
                <ChevronLeft className="mr-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? 'שולח...' : 'שלח הגשה'}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UnifiedUploadForm;
