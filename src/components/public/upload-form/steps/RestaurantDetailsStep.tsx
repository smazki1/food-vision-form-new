
import React from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { Building2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const RestaurantDetailsStep: React.FC<PublicStepProps> = ({ errors: externalErrors, clearExternalErrors }) => {
  const { formData, updateFormData } = useNewItemForm();
  const errors = externalErrors || {};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
    if (errors && errors[name] && clearExternalErrors) {
      clearExternalErrors();
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-[#333333] mb-4">
          פרטי מסעדה
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          בואו נתחיל עם הפרטים הבסיסיים של המסעדה שלכם
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-8 max-w-2xl mx-auto">
        {/* Restaurant Name */}
        <div className="space-y-3">
          <label htmlFor="restaurantName" className="block text-lg font-semibold text-[#333333] flex items-center">
            <Building2 className="w-6 h-6 text-[#F3752B] ml-3" />
            שם המסעדה / שם העסק
            <span className="text-red-500 mr-1">*</span>
          </label>
          <input
            id="restaurantName"
            name="restaurantName"
            type="text"
            value={formData.restaurantName}
            onChange={handleChange}
            placeholder="הזינו את שם המסעדה או העסק"
            className={cn(
              "w-full px-6 py-4 text-lg border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#F3752B]/20",
              errors?.restaurantName 
                ? "border-red-500 bg-red-50" 
                : "border-gray-200 focus:border-[#F3752B] bg-white hover:border-gray-300"
            )}
          />
          {errors?.restaurantName && (
            <p className="text-red-500 text-sm mt-2 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full ml-2"></span>
              {errors.restaurantName}
            </p>
          )}
        </div>

        {/* Submitter Name */}
        <div className="space-y-3">
          <label htmlFor="submitterName" className="block text-lg font-semibold text-[#333333] flex items-center">
            <User className="w-6 h-6 text-[#F3752B] ml-3" />
            שם המגיש
            <span className="text-red-500 mr-1">*</span>
          </label>
          <input
            id="submitterName"
            name="submitterName"
            type="text"
            value={formData.submitterName || ''}
            onChange={handleChange}
            placeholder="הזינו את שם איש הקשר"
            className={cn(
              "w-full px-6 py-4 text-lg border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#F3752B]/20",
              errors?.submitterName 
                ? "border-red-500 bg-red-50" 
                : "border-gray-200 focus:border-[#F3752B] bg-white hover:border-gray-300"
            )}
          />
          {errors?.submitterName && (
            <p className="text-red-500 text-sm mt-2 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full ml-2"></span>
              {errors.submitterName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetailsStep;
