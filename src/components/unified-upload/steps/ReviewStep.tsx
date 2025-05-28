import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface ReviewStepProps {
  formData: {
    restaurantName: string;
    contactEmail: string;
    contactPhone: string;
    itemName: string;
    itemType: 'dish' | 'cocktail' | 'drink';
    description: string;
    specialNotes: string;
    referenceImages: File[];
  };
  imagePreviews: string[];
  isAuthenticated: boolean;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  formData,
  imagePreviews,
  isAuthenticated
}) => {
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
      <h2 className="text-xl font-semibold text-center text-[#8B1E3F] mb-4">סקירה ואישור</h2>
      <p className="text-center text-gray-600 mb-4">אנא אשר את הפרטים לפני השליחה</p>
      
      <Card className="border-[#8B1E3F]/20 shadow-sm">
        <CardContent className="p-4">
          <h3 className="font-medium mb-3 text-[#8B1E3F] text-center">פרטי המסעדה</h3>
          <div className="text-center">
            <p className="mb-2"><span className="font-semibold">שם המסעדה:</span> {formData.restaurantName}</p>
            {!isAuthenticated && (
              <>
                <p className="mb-2"><span className="font-semibold">אימייל:</span> {formData.contactEmail}</p>
                <p className="mb-2"><span className="font-semibold">טלפון:</span> {formData.contactPhone}</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#8B1E3F]/20 shadow-sm">
        <CardContent className="p-4">
          <h3 className="font-medium mb-3 text-[#8B1E3F] text-center">פרטי הפריט</h3>
          <div className="text-center">
            <p className="mb-2"><span className="font-semibold">שם הפריט:</span> {formData.itemName}</p>
            <p className="mb-2"><span className="font-semibold">סוג:</span> {getItemTypeLabel(formData.itemType)}</p>
            {formData.description && <p className="mb-2"><span className="font-semibold">תיאור:</span> {formData.description}</p>}
            {formData.specialNotes && <p className="mb-2"><span className="font-semibold">הערות:</span> {formData.specialNotes}</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#8B1E3F]/20 shadow-sm">
        <CardContent className="p-4">
          <h3 className="font-medium mb-3 text-[#8B1E3F] text-center">תמונות ({formData.referenceImages.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {imagePreviews.map((preview, index) => (
              <img
                key={index}
                src={preview}
                alt={`תמונה ${index + 1}`}
                className="w-full h-20 object-cover rounded shadow-sm"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewStep;
