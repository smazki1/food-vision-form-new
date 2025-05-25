import React, { useContext } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NewItemFormContext } from '@/contexts/NewItemFormContext';
import { StepProps } from '../FoodVisionUploadForm'; // Assuming StepProps is exported

const RestaurantDetailsStep: React.FC<StepProps> = ({ errors, clearExternalErrors, setExternalErrors }) => {
  const { formData, updateFormData } = useContext(NewItemFormContext);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updateFormData({ [e.target.name]: e.target.value });
    if (clearExternalErrors) clearExternalErrors(); // Clear errors on change
  };
  
  // Ensure setExternalErrors is available before calling
  // This is a basic example; you might want more sophisticated error handling
  // For instance, validating on blur or integrating with a form library

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-semibold mb-1">פרטי המסעדה שלך</h2>
        <p className="text-sm text-muted-foreground mb-6">
          מידע זה יעזור לנו להתאים לך את השירות בצורה הטובה ביותר.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="restaurantName">שם המסעדה</Label>
          <Input
            id="restaurantName"
            name="restaurantName"
            value={formData.restaurantName || ''}
            onChange={handleChange}
            placeholder="לדוגמה: פיצה כרמל"
            className={errors?.restaurantName ? 'border-red-500' : ''}
          />
          {errors?.restaurantName && <p className="text-xs text-red-500 mt-1">{errors.restaurantName}</p>}
        </div>

        <div>
          <Label htmlFor="contactName">שם איש קשר</Label>
          <Input
            id="contactName"
            name="contactName"
            value={formData.contactName || ''}
            onChange={handleChange}
            placeholder="לדוגמה: ישראל ישראלי"
            className={errors?.contactName ? 'border-red-500' : ''}
          />
          {errors?.contactName && <p className="text-xs text-red-500 mt-1">{errors.contactName}</p>}
        </div>

        <div>
          <Label htmlFor="phone">מספר טלפון</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone || ''}
            onChange={handleChange}
            placeholder="לדוגמה: 050-1234567"
            className={errors?.phone ? 'border-red-500' : ''}
          />
          {errors?.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
        </div>

        <div>
          <Label htmlFor="email">כתובת אימייל</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={handleChange}
            placeholder="לדוגמה: user@example.com"
            className={errors?.email ? 'border-red-500' : ''}
          />
          {errors?.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetailsStep; 