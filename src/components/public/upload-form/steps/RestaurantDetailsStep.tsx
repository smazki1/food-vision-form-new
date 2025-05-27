
import React, { useContext } from 'react';
import { IconInput } from '@/components/ui/icon-input';
import { NewItemFormContext } from '@/contexts/NewItemFormContext';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { Store } from 'lucide-react';

const RestaurantDetailsStep: React.FC<PublicStepProps> = ({ errors, clearExternalErrors }) => {
  const { formData, updateFormData } = useContext(NewItemFormContext);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updateFormData({ [e.target.name]: e.target.value });
    if (clearExternalErrors) clearExternalErrors();
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-800">פרטי המסעדה</h2>
        <p className="text-sm md:text-base text-muted-foreground mb-8">
          אנא הזינו את שם המסעדה שלכם. אם המסעדה כבר רשומה במערכת, הפריט יתווסף אליה אוטומטית.
        </p>
      </div>

      <div className="space-y-6">
        <IconInput
          id="restaurantName"
          name="restaurantName"
          label="שם המסעדה"
          value={formData.restaurantName || ''}
          onChange={handleChange}
          placeholder="לדוגמה: פיצה כרמל"
          error={errors?.restaurantName}
          icon={<Store />}
          iconPosition="right"
        />
      </div>
    </div>
  );
};

export default RestaurantDetailsStep;
