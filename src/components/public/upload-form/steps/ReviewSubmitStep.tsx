import React from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { Building2, User, UtensilsCrossed, FileText, Camera, CheckCircle, Loader2, Palette, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ReviewSubmitStepProps extends PublicStepProps {
  isSubmitting?: boolean;
}

const ReviewSubmitStep: React.FC<ReviewSubmitStepProps> = ({ errors, onFinalSubmit, onBack, isSubmitting = false }) => {
  const { formData } = useNewItemForm();

  const {
    restaurantName,
    submitterName,
    dishes
  } = formData;

  // Calculate aggregated statistics
  const totalDishes = dishes.length;
  const totalImages = dishes.reduce((sum, dish) => sum + dish.referenceImages.length, 0);
  const totalBrandingFiles = dishes.reduce((sum, dish) => sum + dish.brandingMaterials.length, 0);
  const totalReferenceFiles = dishes.reduce((sum, dish) => sum + dish.referenceExamples.length, 0);
  
  // Group dishes by type for summary
  const dishesbyType = dishes.reduce((acc, dish) => {
    const type = dish.itemType || 'לא צוין';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-[#333333] mb-4">
          סקירה ואישור
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          בדקו את כל הפרטים לפני השליחה הסופית
        </p>
      </div>

      {/* Summary Box */}
      <div className="max-w-3xl mx-auto bg-gray-50 rounded-2xl p-8 space-y-6">
        <h2 className="text-2xl font-bold text-[#333333] mb-6 text-center">סיכום הפרטים</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Restaurant Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <Building2 className="w-6 h-6 text-[#F3752B]" />
              <span className="font-semibold text-lg text-[#333333]">שם מסעדה:</span>
            </div>
            <p className="text-lg text-gray-700 mr-9">{restaurantName}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <User className="w-6 h-6 text-[#F3752B]" />
              <span className="font-semibold text-lg text-[#333333]">איש קשר:</span>
            </div>
            <p className="text-lg text-gray-700 mr-9">{submitterName}</p>
          </div>
        </div>

        {/* Aggregated Statistics */}
        <div className="border-t border-gray-200 pt-6 space-y-6">
          <h3 className="text-xl font-bold text-[#333333] text-center">סיכום הגשה</h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse mb-2">
                <UtensilsCrossed className="w-5 h-5 text-[#F3752B]" />
                <span className="font-semibold text-gray-700">מנות</span>
              </div>
              <p className="text-2xl font-bold text-[#333333]">{totalDishes}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse mb-2">
                <Camera className="w-5 h-5 text-[#F3752B]" />
                <span className="font-semibold text-gray-700">תמונות</span>
              </div>
              <p className="text-2xl font-bold text-[#333333]">{totalImages}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse mb-2">
                <FileText className="w-5 h-5 text-[#F3752B]" />
                <span className="font-semibold text-gray-700">קבצים נוספים</span>
              </div>
              <p className="text-2xl font-bold text-[#333333]">{totalBrandingFiles + totalReferenceFiles}</p>
            </div>
          </div>
        </div>

        {/* Dishes Breakdown */}
        <div className="border-t border-gray-200 pt-6 space-y-4">
          <h3 className="text-xl font-bold text-[#333333] text-center">פירוט המנות</h3>
          
          <div className="space-y-3">
            {Object.entries(dishesbyType).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200">
                <span className="font-medium text-gray-700">{type}</span>
                <span className="font-bold text-[#333333]">{count} מנות</span>
              </div>
            ))}
          </div>
        </div>

        {/* Individual Dishes List */}
        <div className="border-t border-gray-200 pt-6 space-y-4">
          <h3 className="text-xl font-bold text-[#333333] text-center">רשימת המנות</h3>
          
          <div className="space-y-3">
            {dishes.map((dish, index) => (
              <div key={dish.id} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-lg text-[#333333]">
                      {dish.itemName || `מנה ${index + 1}`}
                    </h4>
                    <p className="text-sm text-gray-600">{dish.itemType}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {dish.referenceImages.length} תמונות
                  </div>
                </div>
                
                {dish.description && (
                  <p className="text-sm text-gray-700 mb-2">{dish.description}</p>
                )}
                
                {dish.specialNotes && (
                  <p className="text-xs text-gray-600 italic">הערות: {dish.specialNotes}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Files Summary */}
        {(totalBrandingFiles > 0 || totalReferenceFiles > 0) && (
          <div className="border-t border-gray-200 pt-6 space-y-6">
            <h3 className="text-xl font-bold text-[#333333] text-center">קבצים נוספים</h3>
            
            {totalBrandingFiles > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Palette className="w-6 h-6 text-purple-500" />
                  <span className="font-semibold text-lg text-[#333333]">חומרי מיתוג:</span>
                </div>
                <p className="text-lg text-gray-700 mr-9">{totalBrandingFiles} קבצים</p>
              </div>
            )}

            {totalReferenceFiles > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Eye className="w-6 h-6 text-green-500" />
                  <span className="font-semibold text-lg text-[#333333]">דוגמאות להתייחסות:</span>
                </div>
                <p className="text-lg text-gray-700 mr-9">{totalReferenceFiles} קבצים</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Message */}
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xl text-gray-600 font-medium">
          הגשה זו תנצל {totalDishes} {totalDishes === 1 ? 'מנה' : 'מנות'} מהחבילה שלך.
        </p>
        <p className="text-lg text-gray-500 mt-2">
          סה"כ {totalImages} תמונות ו-{totalBrandingFiles + totalReferenceFiles} קבצים נוספים
        </p>
      </div>

      {/* Submit Section */}
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            disabled={isSubmitting}
            className={cn(
              "px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
              isSubmitting && "opacity-50 cursor-not-allowed"
            )}
          >
            חזור
          </button>
          
          <button
            onClick={onFinalSubmit}
            disabled={!onFinalSubmit || isSubmitting}
            className={cn(
              "px-12 py-4 rounded-xl font-bold text-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl flex items-center space-x-3 rtl:space-x-reverse",
              "bg-[#8B1E3F] hover:bg-[#721832] text-white focus:ring-4 focus:ring-[#8B1E3F]/20",
              (isSubmitting || !onFinalSubmit) && "opacity-75 cursor-not-allowed hover:bg-[#8B1E3F] hover:transform-none hover:shadow-xl"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>שולח בקשה...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6" />
                <span>שלח בקשה</span>
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {(errors?.finalCheck || errors?.submit) && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-600 text-center">
            {errors.finalCheck || errors.submit}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSubmitStep;
