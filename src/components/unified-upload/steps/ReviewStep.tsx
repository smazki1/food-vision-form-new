
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
          <p><strong>סוג:</strong> {getItemTypeLabel(formData.itemType)}</p>
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
};

export default ReviewStep;
