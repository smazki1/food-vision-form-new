
import React from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { IconInput } from '@/components/ui/icon-input';
import { IconTextarea } from '@/components/ui/icon-textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { StepProps } from '../FoodVisionUploadForm';
import { Sparkles } from 'lucide-react';

const ItemDetailsStep: React.FC<StepProps> = ({ errors: externalErrors, clearExternalErrors }) => {
  const { formData, updateFormData } = useNewItemForm();
  const errors = externalErrors || {};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
    if (errors && errors[name] && clearExternalErrors) {
      clearExternalErrors();
    }
  };

  const handleItemTypeChange = (itemType: 'dish' | 'cocktail' | 'drink') => {
    updateFormData({ itemType });
    if (errors.itemType && clearExternalErrors) {
      clearExternalErrors();
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-primary ml-2" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          פרטי העלאה
        </h2>
        <p className="text-gray-600 mb-8">
          הזינו את פרטי הפריט
        </p>
      </div>

      <div className="bg-primary/5 p-6 rounded-xl border border-primary/20">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <Sparkles className="w-6 h-6 text-primary ml-2" />
          פרטי הפריט
        </h3>
        
        <div className="space-y-6">
          <IconInput
            id="itemName"
            name="itemName"
            label="שם הפריט"
            value={formData.itemName}
            onChange={handleChange}
            placeholder="לדוגמה: פסטה קרבונרה, מוחיטו קלאסי"
            error={errors?.itemName}
            iconPosition="right"
            required
          />

          <div className="space-y-3">
            <Label className="text-base font-medium text-gray-700">
              סוג הפריט <span className="text-red-600 ml-1">*</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: 'dish', label: 'מנה/מוצר', icon: '🍽️' },
                { value: 'drink', label: 'שתיה', icon: '🥤' },
                { value: 'cocktail', label: 'קוקטייל', icon: '🍸' }
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Checkbox
                    id={option.value}
                    checked={formData.itemType === option.value}
                    onCheckedChange={() => handleItemTypeChange(option.value as 'dish' | 'cocktail' | 'drink')}
                    className="h-5 w-5 rounded border-gray-400 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label
                    htmlFor={option.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                  >
                    <span className="text-lg">{option.icon}</span>
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
            {errors?.itemType && (
              <p className="text-xs text-red-500 mt-1">{errors.itemType}</p>
            )}
          </div>

          <IconTextarea
            id="description"
            name="description"
            label="מרכיבים עיקריים (אופציונלי)"
            value={formData.description}
            onChange={handleChange}
            placeholder="פרטו את המרכיבים העיקריים של הפריט"
            rows={3}
            error={errors?.description}
          />

          <IconTextarea
            id="specialNotes"
            name="specialNotes"
            label="הערות מיוחדות (אופציונלי)"
            value={formData.specialNotes}
            onChange={handleChange}
            placeholder="כל מידע נוסף שחשוב שנדע"
            rows={2}
            error={errors?.specialNotes}
          />
        </div>
      </div>
    </div>
  );
};

export default ItemDetailsStep;
