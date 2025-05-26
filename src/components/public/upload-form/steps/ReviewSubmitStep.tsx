
import React from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { Building2, Sparkles, Image as ImageIcon, CheckCircle, ChevronLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ReviewSubmitStepProps {
  errors: Record<string, string>;
  onNext: () => void;
  isSubmitting: boolean;
}

const ReviewSubmitStep: React.FC<ReviewSubmitStepProps> = ({ errors, onNext, isSubmitting }) => {
  const { formData } = useNewItemForm();

  const itemTypeDisplay: Record<string, string> = {
    dish: "מנה",
    cocktail: "קוקטייל",
    drink: "משקה"
  };

  const ReviewItem: React.FC<{ label: string; value?: string | null; isMissing?: boolean }> = ({ 
    label, 
    value, 
    isMissing 
  }) => {
    if (!value && !isMissing) return null;
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3">
        <dt className="text-sm font-medium text-gray-500 sm:w-1/3">{label}</dt>
        <dd className={cn(
          "mt-1 text-sm sm:mt-0 sm:w-2/3", 
          isMissing && !value ? "text-red-500 italic" : "text-gray-900"
        )}>
          {value || (isMissing ? "לא סופק" : "-")}
        </dd>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          סקירה ואישור
        </h2>
        <p className="text-gray-600">
          אנא בדקו את כל הפרטים לפני השליחה הסופית
        </p>
      </div>

      {/* Restaurant Details Section */}
      <section className="space-y-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Building2 className="w-6 h-6 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">פרטי המסעדה</h3>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <dl className="divide-y divide-gray-200">
            <ReviewItem label="שם המסעדה" value={formData.restaurantName} isMissing={!formData.restaurantName} />
            <ReviewItem label="איש קשר" value={formData.contactName} />
            <ReviewItem label="טלפון" value={formData.phoneNumber} />
            <ReviewItem label="אימייל" value={formData.emailAddress} />
          </dl>
        </div>
      </section>

      <Separator />

      {/* Item Details Section */}
      <section className="space-y-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Sparkles className="w-6 h-6 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">פרטי הפריט</h3>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <dl className="divide-y divide-gray-200">
            <ReviewItem label="שם הפריט" value={formData.itemName} isMissing={!formData.itemName} />
            <ReviewItem 
              label="סוג הפריט" 
              value={formData.itemType ? itemTypeDisplay[formData.itemType] : undefined} 
              isMissing={!formData.itemType} 
            />
            <ReviewItem label="מרכיבים עיקריים" value={formData.description} />
            <ReviewItem label="הערות מיוחדות" value={formData.specialNotes} />
          </dl>
        </div>
      </section>

      <Separator />

      {/* Images Section */}
      <section className="space-y-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <ImageIcon className="w-6 h-6 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            תמונות שהועלו ({formData.referenceImages.length})
          </h3>
        </div>
        {formData.referenceImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {formData.referenceImages.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-2 truncate">
                    {file.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500">לא הועלו תמונות</p>
          </div>
        )}
      </section>

      <Separator />

      {/* Package Info Alert */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="w-4 h-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          הפריט יישלח לבדיקה ועיבוד. תקבלו עדכון על הסטטוס בהקדם.
        </AlertDescription>
      </Alert>

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          onClick={onNext}
          disabled={isSubmitting || Object.keys(errors).length > 0}
          className={cn(
            "w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl",
            "flex items-center justify-center space-x-3 space-x-reverse",
            "bg-orange-500 hover:bg-orange-600 text-white",
            isSubmitting && "bg-gray-400 cursor-not-allowed"
          )}
        >
          <CheckCircle className="w-6 h-6" />
          <span>{isSubmitting ? 'שולח...' : '✓ שלחו את הפריט'}</span>
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 text-red-500 ml-2" />
              <span className="text-sm text-red-700">אנא תקנו את השגיאות הבאות:</span>
            </div>
            <ul className="list-disc list-inside text-sm text-red-600 mt-2">
              {Object.entries(errors).map(([key, value]) => (
                <li key={key}>{value}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSubmitStep;
