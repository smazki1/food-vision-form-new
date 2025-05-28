
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from 'lucide-react';

interface RestaurantDetailsStepProps {
  formData: {
    restaurantName: string;
    contactEmail: string;
    contactPhone: string;
  };
  errors: Record<string, string>;
  isAuthenticated: boolean;
  isLoadingUserData: boolean;
  onInputChange: (field: string, value: string) => void;
}

const RestaurantDetailsStep: React.FC<RestaurantDetailsStepProps> = ({
  formData,
  errors,
  isAuthenticated,
  isLoadingUserData,
  onInputChange
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">פרטי המסעדה</h2>
      
      {isAuthenticated && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            הפרטים נטענים אוטומטיט מהפרופיל שלך
          </AlertDescription>
        </Alert>
      )}
      
      <div>
        <label className="block text-sm font-medium mb-1">שם המסעדה *</label>
        <input
          type="text"
          className="w-full p-3 border rounded-md"
          value={formData.restaurantName}
          onChange={(e) => onInputChange('restaurantName', e.target.value)}
          disabled={isLoadingUserData}
        />
        {errors.restaurantName && (
          <p className="text-red-500 text-xs mt-1">{errors.restaurantName}</p>
        )}
      </div>

      {!isAuthenticated && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">אימייל *</label>
            <input
              type="email"
              className="w-full p-3 border rounded-md"
              value={formData.contactEmail}
              onChange={(e) => onInputChange('contactEmail', e.target.value)}
            />
            {errors.contactEmail && (
              <p className="text-red-500 text-xs mt-1">{errors.contactEmail}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">מספר טלפון *</label>
            <input
              type="tel"
              className="w-full p-3 border rounded-md"
              value={formData.contactPhone}
              onChange={(e) => onInputChange('contactPhone', e.target.value)}
            />
            {errors.contactPhone && (
              <p className="text-red-500 text-xs mt-1">{errors.contactPhone}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RestaurantDetailsStep;
