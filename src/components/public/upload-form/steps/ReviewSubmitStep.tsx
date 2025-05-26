
import React from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Store, Sparkles, ImageIcon } from 'lucide-react';

interface ReviewSubmitStepProps {
  errors: Record<string, string>;
  onNext: () => void;
  isSubmitting: boolean;
}

const ReviewSubmitStep: React.FC<ReviewSubmitStepProps> = ({ 
  errors, 
  onNext, 
  isSubmitting 
}) => {
  const { formData } = useNewItemForm();

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'dish': return 'מנה';
      case 'cocktail': return 'קוקטייל';
      case 'drink': return 'משקה';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          סקירה ואישור
        </h2>
        <p className="text-gray-600">
          בדקו את הפרטים לפני השליחה
        </p>
      </div>

      <div className="space-y-6">
        {/* Restaurant Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Store className="w-5 h-5 text-orange-500 ml-2" />
              פרטי המסעדה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">שם המסעדה:</span>
                <span className="text-gray-700">{formData.restaurantName}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Item Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Sparkles className="w-5 h-5 text-orange-500 ml-2" />
              פרטי הפריט
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">שם הפריט:</span>
                <span className="text-gray-700">{formData.itemName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">סוג הפריט:</span>
                <Badge variant="secondary">
                  {getItemTypeLabel(formData.itemType)}
                </Badge>
              </div>
              {formData.description && (
                <div>
                  <span className="font-medium">מרכיבים עיקריים:</span>
                  <p className="text-gray-700 mt-1">{formData.description}</p>
                </div>
              )}
              {formData.specialNotes && (
                <div>
                  <span className="font-medium">הערות מיוחדות:</span>
                  <p className="text-gray-700 mt-1">{formData.specialNotes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <ImageIcon className="w-5 h-5 text-orange-500 ml-2" />
              תמונות ({formData.referenceImages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {formData.referenceImages.map((file, index) => (
                <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`תמונה ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">יש לתקן את השגיאות הבאות:</h4>
            <ul className="list-disc list-inside space-y-1">
              {Object.values(errors).map((error, index) => (
                <li key={index} className="text-red-600 text-sm">{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={onNext}
            disabled={isSubmitting || Object.keys(errors).length > 0}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
            size="lg"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                שולח...
              </div>
            ) : (
              'שלח פריט'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReviewSubmitStep;
