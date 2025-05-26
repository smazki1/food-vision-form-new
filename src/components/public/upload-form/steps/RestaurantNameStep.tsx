import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { PublicStepProps } from '../PublicFoodVisionUploadForm'; // Adjust path as needed

const RestaurantNameStep: React.FC<PublicStepProps> = ({ errors, clearExternalErrors, setExternalErrors }) => {
  const { formData, updateFormData } = useNewItemForm();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ restaurantName: e.target.value });
    if (errors?.restaurantName && clearExternalErrors) {
      clearExternalErrors();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="restaurantName">שם המסעדה</Label>
        <Input
          id="restaurantName"
          type="text"
          value={formData.restaurantName || ''}
          onChange={handleChange}
          placeholder="לדוגמה: מסעדת השלום"
          className={errors?.restaurantName ? 'border-red-500' : ''}
          required
        />
        {errors?.restaurantName && (
          <p className="text-sm text-red-500 mt-1">{errors.restaurantName}</p>
        )}
      </div>
      <p className="text-xs text-gray-500">
        אנא הזינו את שם המסעדה המדויק כפי שהוא רשום אצלנו. אם אינכם בטוחים, אנא צרו קשר.
      </p>
    </div>
  );
};

export default RestaurantNameStep; 