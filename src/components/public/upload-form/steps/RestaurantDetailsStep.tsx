
import React from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { IconInput } from '@/components/ui/icon-input';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { Building2, User } from 'lucide-react';

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
    <div className="space-y-8" dir="rtl">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          פרטי מסעדה
        </h2>
        <p className="text-gray-600 text-lg mb-8">
          מלאו את הפרטים הנדרשים להעלאת הפריט
        </p>
      </div>

      <div className="bg-emerald-50 p-8 rounded-xl border border-emerald-200">
        <div className="space-y-8">
          <IconInput
            id="restaurantName"
            name="restaurantName"
            label="שם המסעדה"
            value={formData.restaurantName}
            onChange={handleChange}
            placeholder="הזינו את שם המסעדה"
            error={errors?.restaurantName}
            iconPosition="right"
            required
            icon={<Building2 className="w-5 h-5 text-emerald-500" />}
          />

          <IconInput
            id="submitterName"
            name="submitterName"
            label="שם המגיש"
            value={formData.submitterName || ''}
            onChange={handleChange}
            placeholder="הזינו את שם המגיש"
            error={errors?.submitterName}
            iconPosition="right"
            required
            icon={<User className="w-5 h-5 text-emerald-500" />}
          />
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetailsStep;
