
import React from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { IconInput } from '@/components/ui/icon-input';

const RestaurantNameStep: React.FC<PublicStepProps> = ({ errors, clearExternalErrors }) => {
  const { formData, updateFormData } = useNewItemForm();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
    if (errors && errors[name] && clearExternalErrors) {
      clearExternalErrors();
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">שם המסעדה</h2>
        <p className="text-gray-600 mt-2">אנא הזינו את שם המסעדה</p>
      </div>
      
      <div className="space-y-6">
        <IconInput
          id="restaurantName"
          name="restaurantName"
          label="שם המסעדה"
          value={formData.restaurantName || ''}
          onChange={handleChange}
          placeholder="לדוגמה: מסעדת השף הקטן"
          error={errors?.restaurantName}
          iconPosition="right"
          required
        />
      </div>
    </div>
  );
};

export default RestaurantNameStep;
