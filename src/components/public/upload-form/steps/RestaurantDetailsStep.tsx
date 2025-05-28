
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
        <div className="flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8 text-emerald-500 ml-2" />
          <User className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          פרטי מסעדה
        </h2>
        <p className="text-gray-600 mb-8">
          מלאו את הפרטים הנדרשים להעלאת הפריט
        </p>
      </div>

      <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200">
        <div className="space-y-6">
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
