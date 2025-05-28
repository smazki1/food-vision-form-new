
import React from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { Building2, User, UtensilsCrossed, FileText, Camera, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ReviewSubmitStep: React.FC<PublicStepProps> = ({ errors, onFinalSubmit }) => {
  const { formData } = useNewItemForm();

  const {
    restaurantName,
    submitterName,
    itemName,
    description,
    specialNotes,
    referenceImages
  } = formData;

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

        {/* Item Details */}
        <div className="border-t border-gray-200 pt-6 space-y-4">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <UtensilsCrossed className="w-6 h-6 text-[#F3752B]" />
            <span className="font-semibold text-lg text-[#333333]">שם המנה:</span>
          </div>
          <p className="text-lg text-gray-700 mr-9">{itemName}</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <FileText className="w-6 h-6 text-[#F3752B]" />
            <span className="font-semibold text-lg text-[#333333]">תיאור המנה:</span>
          </div>
          <p className="text-lg text-gray-700 mr-9 leading-relaxed">{description}</p>
        </div>

        {specialNotes && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <FileText className="w-6 h-6 text-emerald-500" />
              <span className="font-semibold text-lg text-[#333333]">הערות מיוחדות:</span>
            </div>
            <p className="text-lg text-gray-700 mr-9 leading-relaxed">{specialNotes}</p>
          </div>
        )}

        {/* Images Count */}
        <div className="border-t border-gray-200 pt-6 space-y-4">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Camera className="w-6 h-6 text-[#F3752B]" />
            <span className="font-semibold text-lg text-[#333333]">מספר תמונות:</span>
          </div>
          <p className="text-lg text-gray-700 mr-9">{referenceImages.length} תמונות</p>
        </div>
      </div>

      {/* Info Message */}
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xl text-gray-600 font-medium">
          הגשה זו תנצל מנה אחת מהחבילה שלך.
        </p>
      </div>

      {/* Submit Section */}
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => window.history.back()}
            className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            חזור
          </button>
          
          <button
            onClick={onFinalSubmit}
            disabled={!onFinalSubmit}
            className={cn(
              "px-12 py-4 rounded-xl font-bold text-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl flex items-center space-x-3 rtl:space-x-reverse",
              "bg-[#8B1E3F] hover:bg-[#721832] text-white focus:ring-4 focus:ring-[#8B1E3F]/20"
            )}
          >
            <CheckCircle className="w-6 h-6" />
            <span>שלח בקשה</span>
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
