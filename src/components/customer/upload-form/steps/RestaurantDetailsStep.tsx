
import React from 'react';
import { IconInput } from '@/components/ui/icon-input';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { StepProps } from '../FoodVisionUploadForm';
import { Store } from 'lucide-react';

const RestaurantDetailsStep: React.FC<StepProps> = ({ errors, clearExternalErrors }) => {
  const { formData, updateFormData } = useNewItemForm();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updateFormData({ [e.target.name]: e.target.value });
    if (clearExternalErrors) clearExternalErrors();
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-800">פרטי המסעדה שלכם/ן</h2>
        <p className="text-sm md:text-base text-muted-foreground mb-8">
          מידע זה יעזור לנו להתאים לכם/ן את השירות בצורה הטובה ביותר ולשייך את ההגשות לחשבונכם/ן.
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
