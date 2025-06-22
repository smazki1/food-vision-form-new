
import React from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { StepProps as GlobalStepProps } from '../FoodVisionUploadForm';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, CheckCircle, Image as ImageIcon, Building2, Sparkles as ItemIcon, AlertTriangle } from 'lucide-react';
import { useClientAuth } from '@/hooks/useClientAuth';
import { useClientPackage } from '@/hooks/useClientPackage';
import { cn } from '@/lib/utils'; 
import { Button } from '@/components/ui/button';

// Extend the global StepProps for this specific step
interface ReviewSubmitStepProps extends GlobalStepProps {
  onFinalSubmit?: () => void; // New prop for handling submission from this step
}

interface ReviewItemProps {
  label: string;
  value?: string | null;
  isMissing?: boolean;
}

const ReviewItem: React.FC<ReviewItemProps> = ({ label, value, isMissing }) => {
  if (!value && !isMissing) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 px-1 rounded-lg hover:bg-gray-50/50 transition-colors duration-200">
      <dt className="text-sm font-semibold text-gray-600 sm:w-1/3 mb-1 sm:mb-0">{label}</dt>
      <dd className={cn(
        "text-sm sm:w-2/3 font-medium transition-colors duration-200",
        isMissing && !value ? "text-red-500 italic" : "text-gray-800"
      )}>
        {value || (isMissing ? "לא סופק" : "-")}
      </dd>
    </div>
  );
};

const ReviewSubmitStep: React.FC<ReviewSubmitStepProps> = ({ errors, onFinalSubmit }) => {
  const { formData } = useNewItemForm();
  const { clientId } = useClientAuth();
  const { remainingDishes, packageName } = useClientPackage();

  const { 
    restaurantName,
    itemName, itemType, description, specialNotes, referenceImages 
  } = formData;

  // Function to display item type - handles any string value gracefully
  const getItemTypeDisplay = (type: string | undefined): string => {
    if (!type) return '';
    
    // Check for known types first, then return the actual value for custom types
    switch (type.toLowerCase()) {
      case 'dish': return 'מנה';
      case 'cocktail': return 'קוקטייל';
      case 'drink': return 'משקה';
      default: return type; // Return the actual value for custom types like "צמיד"
    }
  };

  // For customer upload form, we don't need to check package limits
  // Users can submit even if remainingDishes is 0 since they can purchase more dishes
  const canSubmit = true;

  return (
    <div className="space-y-8 animate-fade-in" dir="rtl">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#8B1E3F] to-[#7A1B37] rounded-full mb-4 shadow-lg">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-[#8B1E3F]">סקירה ואישור סופי</h2>
        <p className="text-base text-gray-600 max-w-lg mx-auto leading-relaxed">
          אנא בדקו את כל הפרטים שהזנתם לפני ההגשה הסופית. ודאו שהכל תקין ומדויק.
        </p>
      </div>

      {/* Restaurant Details Section */}
      {!clientId && restaurantName && (
        <section className="space-y-4 animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center mb-4 justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-[#F3752B] to-[#E6661F] rounded-full flex items-center justify-center ml-4 shadow-md">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#8B1E3F]">פרטי המסעדה</h3>
          </div>
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <dl className="space-y-1">
              <ReviewItem label="שם המסעדה" value={restaurantName} isMissing={!restaurantName} />
            </dl>
          </div>
        </section>
      )}

      {/* All Dishes Section */}
      <section className="space-y-4 animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center mb-4 justify-center">
          <div className="w-10 h-10 bg-gradient-to-br from-[#F3752B] to-[#E6661F] rounded-full flex items-center justify-center ml-4 shadow-md">
            <ItemIcon className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-[#8B1E3F]">
            כל המנות שהועלו
            <span className="inline-flex items-center justify-center w-8 h-8 bg-[#8B1E3F] text-white text-sm font-bold rounded-full mr-2">
              {formData.dishes.length}
            </span>
          </h3>
        </div>
        
        {formData.dishes.map((dish, dishIndex) => (
          <div key={dish.id} className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300 mb-6">
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h4 className="text-lg font-bold text-[#8B1E3F] mb-2">מנה {dish.id}</h4>
            </div>
            
            {/* Dish Details */}
            <dl className="space-y-1 mb-6">
              <ReviewItem label="שם הפריט" value={dish.itemName} isMissing={!dish.itemName} />
              <ReviewItem label="סוג הפריט" value={getItemTypeDisplay(dish.itemType)} isMissing={!dish.itemType} />
              <ReviewItem label="תיאור/מרכיבים" value={dish.description} />
              <ReviewItem label="הערות מיוחדות" value={dish.specialNotes} />
            </dl>

            {/* Dish Images */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-[#8B1E3F]" />
                <span className="font-medium text-[#8B1E3F]">
                  תמונות ({dish.referenceImages.length})
                </span>
              </div>
              
              {dish.referenceImages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"> 
                  {dish.referenceImages.map((file, index) => (
                <div key={index} className="group relative bg-gray-50 rounded-xl shadow-sm overflow-hidden border-2 border-gray-100 aspect-video hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"> 
                  <img 
                    src={URL.createObjectURL(file)} 
                        alt={`מנה ${dish.id} - תמונה ${index + 1}`} 
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                    onLoad={() => URL.revokeObjectURL(file.name)}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs p-3">
                    <div className="truncate font-medium">{file.name}</div>
                  </div>
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-bold px-2 py-1 rounded-full">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          ) : (
                <div className="text-center py-8">
                  <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">לא הועלו תמונות למנה זו</p>
            </div>
          )}
        </div>
          </div>
        ))}
      </section>

      {/* Submission Info Alert */}
      <div className="animate-slide-in-right" style={{ animationDelay: '0.4s' }}>
        <Alert 
          variant="default"
          className="p-6 rounded-2xl border-2 shadow-lg transition-all duration-300 hover:shadow-xl bg-blue-50 border-blue-200 text-blue-800"
        >
          <InfoIcon className="h-6 w-6" />
          <AlertDescription className="text-base font-medium ml-3"> 
            הגשה זו תישלח לעיבוד מיידי.
            {remainingDishes !== undefined && remainingDishes > 0 && (
                  <div className="mt-2 text-sm opacity-80">
                נותרו לכם {remainingDishes} מנות נוספות בחבילה
                  </div>
            )}
          </AlertDescription>
        </Alert>
      </div>

      {/* Final Confirmation Button */}
      {onFinalSubmit && (
        <div className="animate-scale-in" style={{ animationDelay: '0.5s' }}>
          <Button
            onClick={onFinalSubmit}
            disabled={!canSubmit || (errors && Object.keys(errors).length > 0 && !errors.finalCheck && !errors.submit)}
            className={cn(
              "w-full text-xl font-bold py-6 px-8 rounded-2xl shadow-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]",
              "flex items-center justify-center gap-x-3",
              "relative overflow-hidden group",
              canSubmit 
                ? "bg-gradient-to-r from-[#8B1E3F] to-[#7A1B37] hover:from-[#7A1B37] hover:to-[#6B1830] text-white shadow-[#8B1E3F]/25" 
                : "bg-gray-300 hover:bg-gray-300 text-gray-500 cursor-not-allowed shadow-gray-300/25",
              (errors && (errors.finalCheck || errors.submit)) && "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/25"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <CheckCircle className="h-7 w-7 shrink-0" />
            <span className="leading-tight relative z-10">✓ בדקנו הכל - הגישו עכשיו!</span>
          </Button>
        </div>
      )}
      
      {/* Display any submission errors */}
      {errors?.finalCheck && (
        <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center text-red-700 justify-center shadow-lg animate-fade-in">
          <AlertTriangle className="h-5 w-5 ml-3 shrink-0" /> 
          <span className="font-medium">{errors.finalCheck}</span>
        </div>
      )}
      {errors?.submit && (
        <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center text-red-700 justify-center shadow-lg animate-fade-in">
          <AlertTriangle className="h-5 w-5 ml-3 shrink-0" /> 
          <span className="font-medium">{errors.submit}</span>
        </div>
      )}
    </div>
  );
};

export default ReviewSubmitStep;
