
import React, { useState } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { Button } from '@/components/ui/button';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { CheckCircle, Building2, User, UtensilsCrossed, FileImage, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ReviewSubmitStep: React.FC<PublicStepProps> = ({ onFinalSubmit }) => {
  const { formData } = useNewItemForm();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async () => {
    if (onFinalSubmit) {
      const success = await onFinalSubmit();
      if (success) {
        setShowSuccessModal(true);
      }
    }
  };

  const handleContinueUploading = () => {
    setShowSuccessModal(false);
    // Reset form and go back to first step
    window.location.reload();
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-500 ml-2" />
          <Send className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          סקירה ואישור
        </h2>
        <p className="text-gray-600 mb-8">
          בדקו את הפרטים לפני השליחה הסופית
        </p>
      </div>

      {/* Restaurant Details Review */}
      <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Building2 className="w-6 h-6 text-emerald-500 ml-2" />
          פרטי המסעדה
        </h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <Building2 className="w-5 h-5 text-emerald-500 ml-3" />
            <span className="text-gray-600 ml-2">שם המסעדה:</span>
            <span className="font-medium">{formData.restaurantName}</span>
          </div>
          <div className="flex items-center">
            <User className="w-5 h-5 text-emerald-500 ml-3" />
            <span className="text-gray-600 ml-2">שם המגיש:</span>
            <span className="font-medium">{formData.submitterName || 'לא צוין'}</span>
          </div>
        </div>
      </div>

      {/* Item Details Review */}
      <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <UtensilsCrossed className="w-6 h-6 text-emerald-500 ml-2" />
          פרטי הפריט
        </h3>
        <div className="space-y-3">
          <div>
            <span className="text-gray-600 ml-2">שם הפריט:</span>
            <span className="font-medium">{formData.itemName}</span>
          </div>
          <div>
            <span className="text-gray-600 ml-2">סוג הפריט:</span>
            <span className="font-medium">
              {formData.itemType === 'dish' ? 'מנה/מוצר' : 
               formData.itemType === 'drink' ? 'שתיה' : 'קוקטייל'}
            </span>
          </div>
          {formData.description && (
            <div>
              <span className="text-gray-600 ml-2">תיאור:</span>
              <p className="mt-1 text-sm text-gray-700">{formData.description}</p>
            </div>
          )}
          {formData.specialNotes && (
            <div>
              <span className="text-gray-600 ml-2">הערות מיוחדות:</span>
              <p className="mt-1 text-sm text-gray-700">{formData.specialNotes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Images Review */}
      <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <FileImage className="w-6 h-6 text-emerald-500 ml-2" />
          תמונות שהועלו ({formData.referenceImages.length})
        </h3>
        {formData.referenceImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {formData.referenceImages.map((file, index) => (
              <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`תמונה ${index + 1}`}
                  className="w-full h-full object-cover"
                  onLoad={() => URL.revokeObjectURL(file.name)}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">לא הועלו תמונות</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={handleSubmit}
          className="bg-[#8B1E3F] hover:bg-[#721832] text-white px-8 py-3 text-lg font-medium rounded-full min-w-[200px]"
        >
          <Send className="w-5 h-5 ml-2" />
          שלח בקשה
        </Button>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md mx-auto text-center" dir="rtl">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-emerald-500" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              תודה! הפרטים נשלחו בהצלחה
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              הבקשה שלכם התקבלה ותטופל בהקדם האפשרי.
              נשמח אם תרצו להעלות פריטים נוספים!
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            <Button
              onClick={handleContinueUploading}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-full"
            >
              העלאת פריט נוסף
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewSubmitStep;
