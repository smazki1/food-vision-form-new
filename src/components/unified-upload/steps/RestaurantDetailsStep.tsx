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
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-center text-[#8B1E3F] mb-4">פרטי המסעדה</h2>
      
      {isAuthenticated && (
        <Alert className="bg-[#F3752B]/10 border-[#F3752B] text-[#8B1E3F] mb-4">
          <InfoIcon className="h-4 w-4 mr-2" />
          <AlertDescription className="text-right">
            הפרטים נטענים אוטומטית מהפרופיל שלך
          </AlertDescription>
        </Alert>
      )}
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-[#333333]">שם המסעדה *</label>
        <input
          type="text"
          className="w-full p-3 border rounded-md focus:ring-2 focus:ring-[#8B1E3F] focus:border-[#8B1E3F] transition-all"
          value={formData.restaurantName}
          onChange={(e) => onInputChange('restaurantName', e.target.value)}
          disabled={isLoadingUserData}
          placeholder="הזן את שם המסעדה"
        />
        {errors.restaurantName && (
          <p className="text-red-500 text-xs mt-1">{errors.restaurantName}</p>
        )}
      </div>

      {!isAuthenticated && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-[#333333]">אימייל *</label>
            <input
              type="email"
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-[#8B1E3F] focus:border-[#8B1E3F] transition-all"
              value={formData.contactEmail}
              onChange={(e) => onInputChange('contactEmail', e.target.value)}
              placeholder="הזן את כתובת האימייל"
            />
            {errors.contactEmail && (
              <p className="text-red-500 text-xs mt-1">{errors.contactEmail}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-[#333333]">מספר טלפון *</label>
            <input
              type="tel"
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-[#8B1E3F] focus:border-[#8B1E3F] transition-all"
              value={formData.contactPhone}
              onChange={(e) => onInputChange('contactPhone', e.target.value)}
              placeholder="הזן את מספר הטלפון"
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
