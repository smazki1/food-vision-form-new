
import React from 'react';
import { Store, User, Phone, Mail } from 'lucide-react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { IconInput } from '@/components/ui/icon-input';

interface RestaurantDetailsStepProps {
  errors: Record<string, string>;
}

const RestaurantDetailsStep: React.FC<RestaurantDetailsStepProps> = ({ errors }) => {
  const { formData, updateFormData } = useNewItemForm();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          פרטי המסעדה שלכם/ן
        </h2>
        <p className="text-gray-600">
          אנא מלאו את פרטי המסעדה כדי שנוכל לזהות אתכם במערכת
        </p>
      </div>

      <div className="space-y-6">
        <IconInput
          id="restaurantName"
          name="restaurantName"
          label="שם המסעדה"
          placeholder="הזינו את שם המסעדה"
          value={formData.restaurantName || ''}
          onChange={(e) => updateFormData({ restaurantName: e.target.value })}
          error={errors.restaurantName}
          icon={<Store />}
          iconPosition="right"
          required
        />

        <IconInput
          id="contactName"
          name="contactName"
          label="שם איש הקשר"
          placeholder="הזינו את שם איש הקשר"
          value={formData.contactName || ''}
          onChange={(e) => updateFormData({ contactName: e.target.value })}
          error={errors.contactName}
          icon={<User />}
          iconPosition="right"
          required
        />

        <IconInput
          id="phoneNumber"
          name="phoneNumber"
          label="מספר טלפון"
          type="tel"
          placeholder="05X-XXX-XXXX"
          value={formData.phoneNumber || ''}
          onChange={(e) => updateFormData({ phoneNumber: e.target.value })}
          error={errors.phoneNumber}
          icon={<Phone />}
          iconPosition="right"
          required
        />

        <IconInput
          id="emailAddress"
          name="emailAddress"
          label="כתובת אימייל"
          type="email"
          placeholder="example@restaurant.com"
          value={formData.emailAddress || ''}
          onChange={(e) => updateFormData({ emailAddress: e.target.value })}
          error={errors.emailAddress}
          icon={<Mail />}
          iconPosition="right"
          required
        />
      </div>
    </div>
  );
};

export default RestaurantDetailsStep;
