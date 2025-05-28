import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import RestaurantDetailsStep from './steps/RestaurantDetailsStep';
import ItemDetailsStep from './steps/ItemDetailsStep';
import ImageUploadStep from './steps/ImageUploadStep';
import ReviewStep from './steps/ReviewStep';
import { useUnifiedFormSubmission } from './hooks/useUnifiedFormSubmission';
import { useFormValidation } from './hooks/useFormValidation';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const { isSubmitting, submitForm } = useUnifiedFormSubmission();
  const { errors, validateStep, clearErrors } = useFormValidation();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
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
    clearErrors();
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

  const handleNext = () => {
    if (validateStep(currentStep, formData, isAuthenticated)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    clearErrors();
  };

  const handleSubmit = async () => {
    if (!validateStep(4, formData, isAuthenticated)) return;

    const success = await submitForm(formData, isAuthenticated, clientId);
    
    if (success) {
      setShowSuccessDialog(true);
      
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
      clearErrors();
    }
  };
  
  const handleNewSubmission = () => {
    setShowSuccessDialog(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <RestaurantDetailsStep
            formData={formData}
            errors={errors}
            isAuthenticated={isAuthenticated}
            isLoadingUserData={isLoadingUserData}
            onInputChange={handleInputChange}
          />
        );
      case 2:
        return (
          <ItemDetailsStep
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
          />
        );
      case 3:
        return (
          <ImageUploadStep
            formData={formData}
            imagePreviews={imagePreviews}
            errors={errors}
            onImageUpload={handleImageUpload}
            onRemoveImage={removeImage}
          />
        );
      case 4:
        return (
          <ReviewStep
            formData={formData}
            imagePreviews={imagePreviews}
            isAuthenticated={isAuthenticated}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div dir="rtl" className="flex flex-col min-h-screen bg-gray-100">
      {/* Progress Header */}
      <div className="p-4 bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep >= step.id ? 'bg-[#8B1E3F] text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {step.id}
                </div>
                <span className={`mt-1 text-sm ${currentStep >= step.id ? 'text-[#8B1E3F] font-medium' : 'text-gray-500'}`}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <main className="flex-grow p-4 md:p-6">
        <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-lg">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#8B1E3F]">העלאת פריט חדש</h1>
            <p className="text-gray-600">אנא מלא את הפרטים הבאים כדי להעלות פריט חדש</p>
          </div>
          
          {isLoadingUserData ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#8B1E3F]"></div>
            </div>
          ) : (
            renderStepContent()
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-center gap-4">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isSubmitting}
                className="min-w-[120px] border-[#8B1E3F] text-[#8B1E3F] hover:bg-[#8B1E3F]/10"
              >
                הקודם
              </Button>
            )}

            {currentStep < 4 ? (
              <Button 
                onClick={handleNext} 
                disabled={isSubmitting}
                className="min-w-[120px] bg-[#F3752B] hover:bg-[#F3752B]/90 text-white"
              >
                הבא
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="min-w-[120px] bg-[#8B1E3F] hover:bg-[#8B1E3F]/90 text-white"
              >
                {isSubmitting ? 'שולח...' : 'שלח הגשה'}
              </Button>
            )}
          </div>
        </div>
      </main>
      
      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="bg-white p-6 rounded-lg max-w-md mx-auto text-center">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#8B1E3F]">ההגשה נשלחה בהצלחה!</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">תודה שהעלית פריט חדש. הצוות שלנו יטפל בבקשתך בהקדם.</p>
          </div>
          <DialogFooter className="flex justify-center">
            <Button 
              onClick={handleNewSubmission} 
              className="bg-[#F3752B] hover:bg-[#F3752B]/90 text-white"
            >
              העלאה נוספת
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnifiedUploadForm;
