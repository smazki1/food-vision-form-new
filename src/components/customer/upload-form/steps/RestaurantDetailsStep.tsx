import React, { useContext } from 'react';
import { IconInput } from '@/components/ui/icon-input';
import { NewItemFormContext } from '@/contexts/NewItemFormContext';
import { StepProps } from '../FoodVisionUploadForm';
import { Store, User, Phone, Mail } from 'lucide-react';

const RestaurantDetailsStep: React.FC<StepProps> = ({ errors, clearExternalErrors }) => {
  const { formData, updateFormData } = useContext(NewItemFormContext);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updateFormData({ [e.target.name]: e.target.value });
    if (clearExternalErrors) clearExternalErrors();
  };
  
  // Ensure setExternalErrors is available before calling
  // This is a basic example; you might want more sophisticated error handling
  // For instance, validating on blur or integrating with a form library

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

        <IconInput
          id="contactName"
          name="contactName"
          label="שם איש קשר"
          value={formData.contactName || ''}
          onChange={handleChange}
          placeholder="לדוגמה: ישראל ישראלי"
          error={errors?.contactName}
          icon={<User />}
          iconPosition="right"
        />

        <IconInput
          id="phone"
          name="phone"
          type="tel"
          label="מספר טלפון"
          value={formData.phone || ''}
          onChange={handleChange}
          placeholder="לדוגמה: 050-1234567"
          error={errors?.phone}
          icon={<Phone />}
          iconPosition="right"
        />

        <IconInput
          id="email"
          name="email"
          type="email"
          label="כתובת אימייל"
          value={formData.email || ''}
          onChange={handleChange}
          placeholder="לדוגמה: user@example.com"
          error={errors?.email}
          icon={<Mail />}
          iconPosition="right"
        />
      </div>
    </div>
  );
};

export default RestaurantDetailsStep; 