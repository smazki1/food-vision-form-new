import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useClientAuth } from '@/hooks/useClientAuth';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ClientRestaurantDetailsStep from './steps/ClientRestaurantDetailsStep';
import ClientItemDetailsStep, { ClientItemDetailsFormData } from './steps/ClientItemDetailsStep';
import ClientImageUploadStep from './steps/ClientImageUploadStep';
import ClientAdditionalDetailsStep from './steps/ClientAdditionalDetailsStep';
import ClientReviewStep from './steps/ClientReviewStep';
import { useClientUnifiedFormSubmission } from './hooks/useClientUnifiedFormSubmission';
import { useClientFormValidation } from './hooks/useClientFormValidation';
import { useNewItemForm, NewItemFormData } from '@/contexts/NewItemFormContext';

const STEPS = [
  { id: 1, name: 'פרטי מסעדה' },
  { id: 2, name: 'פרטי פריט' },
  { id: 3, name: 'העלאת תמונות' },
  { id: 4, name: 'פרטים נוספים' },
  { id: 5, name: 'סקירה ואישור' }
];

const ClientUnifiedUploadForm: React.FC = () => {
  const { 
    isAuthenticated, 
    clientId, 
    restaurantName: clientRestaurantName,
    contactName: clientContactName,
    clientRecordStatus,
    authenticating
  } = useClientAuth();

  const { formData, updateFormData, resetFormData: resetNewItemFormData } = useNewItemForm();

  const [currentStep, setCurrentStep] = useState(1);
  const { isSubmittingClient, submitClientForm } = useClientUnifiedFormSubmission();
  const { clientErrors, validateClientStep, clearClientErrors } = useClientFormValidation();
  
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    if (!authenticating && isAuthenticated && clientRecordStatus === 'found') {
      const updates: Partial<NewItemFormData> = {};
      if (clientRestaurantName && formData.restaurantName !== clientRestaurantName) {
        updates.restaurantName = clientRestaurantName;
      }
      if (clientContactName && formData.submitterName !== clientContactName) {
        updates.submitterName = clientContactName;
      }
      if (Object.keys(updates).length > 0) {
        updateFormData(updates);
      }
      if (clientRestaurantName && (updates.restaurantName || formData.restaurantName) && currentStep === 1) {
        setCurrentStep(2);
      }
    }
  }, [
    authenticating, 
    isAuthenticated, 
    clientRecordStatus, 
    clientRestaurantName, 
    clientContactName, 
    updateFormData, 
    formData.restaurantName,
    formData.submitterName,
    currentStep
  ]);

  useEffect(() => {
    if (isSubmittingClient) return;

    if (isAuthenticated && clientRestaurantName) {
      if (formData.restaurantName && currentStep === 1) {
        setCurrentStep(2);
      } else if (!formData.restaurantName && currentStep !== 1) {
        // This case might indicate a reset, go back to step 1 to allow data repopulation
        // setCurrentStep(1); // Let the main effect handle this.
      }
    } else if (!isAuthenticated && currentStep !== 1) {
      setCurrentStep(1);
    }
  }, [isAuthenticated, clientRestaurantName, formData.restaurantName, currentStep, isSubmittingClient]);

  const handleInputChange = useCallback((field: keyof NewItemFormData, value: string | NewItemFormData['itemType']) => {
    updateFormData({ [field as string]: value });
    clearClientErrors();
  }, [updateFormData, clearClientErrors]);

  const handleImageUpload = useCallback((files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    const currentFiles = formData.referenceImages || [];
    const totalFiles = currentFiles.length + newFiles.length;

    if (totalFiles > 10) {
      toast.error('ניתן להעלות עד 10 תמונות');
      return;
    }

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    updateFormData({ referenceImages: [...currentFiles, ...newFiles] });
    clearClientErrors();
  }, [formData.referenceImages, updateFormData, clearClientErrors]);

  const removeItemImage = useCallback((index: number) => {
    const currentFiles = formData.referenceImages || [];
    updateFormData({
      referenceImages: currentFiles.filter((_, i) => i !== index)
    });
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    clearClientErrors();
  }, [formData.referenceImages, updateFormData, clearClientErrors]);

  const handleBrandingMaterialsChange = useCallback((files: File[]) => {
    updateFormData({ brandingMaterials: files });
    clearClientErrors();
  }, [updateFormData, clearClientErrors]);

  const handleReferenceExamplesChange = useCallback((files: File[]) => {
    updateFormData({ referenceExamples: files });
    clearClientErrors();
  }, [updateFormData, clearClientErrors]);

  const handleNext = () => {
    if (validateClientStep(currentStep, formData)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    clearClientErrors();
  };

  const handleSubmit = async () => {
    if (!validateClientStep(STEPS.length, formData)) return;

    if (!clientId) {
      toast.error("שגיאה: לא זוהה מזהה לקוח. נסו לרענן את הדף.");
      return;
    }

    const success = await submitClientForm(formData, clientId);
    
    if (success) {
      resetNewItemFormData();
      setImagePreviews([]);
      setCurrentStep(1);
      clearClientErrors();
    }
  };

  const renderStepContent = () => {
    if (currentStep === 1 && isAuthenticated && clientRecordStatus === 'found' && formData.restaurantName && clientRestaurantName) {
      return null;
    }

    switch (currentStep) {
      case 1:
        return (
          <ClientRestaurantDetailsStep
            formData={formData}
            errors={clientErrors}
            isLoadingAuth={authenticating}
            onInputChange={handleInputChange as (field: keyof Pick<NewItemFormData, 'restaurantName' | 'submitterName'>, value: string) => void}
          />
        );
      case 2:
        return (
          <ClientItemDetailsStep
            formData={formData}
            errors={clientErrors}
            onInputChange={handleInputChange as (field: keyof ClientItemDetailsFormData, value: string) => void}
          />
        );
      case 3:
        return (
          <ClientImageUploadStep
            formData={formData}
            imagePreviews={imagePreviews}
            errors={clientErrors}
            onImageUpload={handleImageUpload}
            onRemoveImage={removeItemImage}
          />
        );
      case 4:
        return (
          <ClientAdditionalDetailsStep
            formData={formData}
            errors={clientErrors}
            onBrandingMaterialsChange={handleBrandingMaterialsChange}
            onReferenceExamplesChange={handleReferenceExamplesChange}
          />
        );
      case 5:
        return (
          <ClientReviewStep
            formData={formData}
            imagePreviews={imagePreviews}
          />
        );
      default:
        return null;
    }
  };

  if (authenticating) {
    return <div className="flex justify-center items-center h-screen">טוען נתוני משתמש...</div>;
  }

  if (!isAuthenticated && clientRecordStatus !== 'loading') {
    return <div className="flex justify-center items-center h-screen">נדרשת התחברות או שפרופיל הלקוח לא זוהה.</div>;
  }
  if (isAuthenticated && clientRecordStatus === 'not-found') {
    return <div className="flex justify-center items-center h-screen">פרופיל לקוח לא נמצא. אנא צור קשר עם התמיכה.</div>;
  }
  if (isAuthenticated && clientRecordStatus === 'error') {
    return <div className="flex justify-center items-center h-screen">שגיאה בטעינת נתוני לקוח. נסה לרענן.</div>;
  }

  const shouldHideStep1 = isAuthenticated && clientRecordStatus === 'found' && formData.restaurantName && clientRestaurantName;
  const activeSteps = shouldHideStep1 ? STEPS.filter(s => s.id !== 1) : STEPS;
  const currentStepIndexInActive = activeSteps.findIndex(s => s.id === currentStep);
  const effectiveCurrentStepForProgressBar = currentStepIndexInActive !== -1 ? activeSteps[currentStepIndexInActive] : null;
  const isFirstActiveStep = effectiveCurrentStepForProgressBar ? effectiveCurrentStepForProgressBar.id === activeSteps[0]?.id : currentStep === 1;

  return (
    <div dir="rtl" className="flex flex-col items-center min-h-screen bg-gray-100 py-8">
      {/* Progress Header */}
      <div className="w-full p-4 bg-[#8B1E3F] shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            {activeSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${(effectiveCurrentStepForProgressBar && step.id <= effectiveCurrentStepForProgressBar.id) ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {step.id}
                </div>
                <span className={`mr-2 text-sm ${(effectiveCurrentStepForProgressBar && step.id <= effectiveCurrentStepForProgressBar.id) ? 'text-primary font-medium' : 'text-gray-500'}`}>
                  {step.name}
                </span>
                {index < activeSteps.length - 1 && (
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
          {renderStepContent()}

          {/* Navigation */}
          <div className="mt-8 flex justify-center gap-4 w-full">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstActiveStep || isSubmittingClient}
              className="min-w-[120px] md:min-w-[140px] py-2 md:py-3 rounded-full border-[#8B1E3F] text-[#8B1E3F] hover:bg-[#8B1E3F]/10"
            >
              הקודם
            </Button>

            {currentStep < STEPS[STEPS.length-1].id ? (
              <Button 
                onClick={handleNext} 
                disabled={isSubmittingClient}
                className="min-w-[120px] md:min-w-[140px] py-2 md:py-3 rounded-full bg-[#8B1E3F] text-white hover:bg-[#7A1A37]"
              >
                הבא
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmittingClient}
                className="min-w-[120px] md:min-w-[140px] py-2 md:py-3 rounded-full bg-green-600 text-white hover:bg-green-700"
              >
                {isSubmittingClient ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    שולח...
                  </>
                ) : (
                  'שלח הגשה'
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientUnifiedUploadForm; 