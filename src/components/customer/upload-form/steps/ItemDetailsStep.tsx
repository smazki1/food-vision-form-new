import React, { useEffect } from 'react';
import { useNewItemForm, ItemType } from '@/contexts/NewItemFormContext';
import { IconInput } from '@/components/ui/icon-input';
import { Label } from '@/components/ui/label';
import { IconTextarea } from '@/components/ui/icon-textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepProps } from '../FoodVisionUploadForm';
import { cn } from '@/lib/utils';

const ItemDetailsStep: React.FC<StepProps> = ({ errors: externalErrors, clearExternalErrors }) => {
  const { formData, updateFormData } = useNewItemForm();
  const errors = externalErrors || {};

  useEffect(() => {
    return () => {
      if (clearExternalErrors) clearExternalErrors();
    };
  }, [clearExternalErrors]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
    if (errors && errors[name] && clearExternalErrors) {
      clearExternalErrors();
    }
  };

  const handleSelectChange = (value: ItemType) => {
    updateFormData({ itemType: value });
    if (errors.itemType && clearExternalErrors) {
      clearExternalErrors();
    }
  };
  
  return (
    <div className="space-y-6" dir="rtl">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">פרטי המנה / מוצר</h2>
      </div>
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

          <div className="space-y-2">
          <Label htmlFor="itemType" className="font-medium text-gray-700">
            סוג הפריט <span className="text-red-600 ml-1">*</span>
            </Label>
            <Select 
              name="itemType" 
              value={formData.itemType}
              onValueChange={handleSelectChange}
            >
              <SelectTrigger 
                id="itemType" 
              className={cn(
                "w-full h-12 px-4 py-3 rounded-md border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-colors duration-150 ease-in-out bg-background",
                errors?.itemType ? "border-red-500 focus:border-red-500 focus:ring-red-500/50 text-red-700 placeholder-red-400" : "border-gray-300"
              )}
              aria-invalid={!!errors?.itemType}
              >
              <SelectValue placeholder="בחרו סוג פריט" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dish">מנה</SelectItem>
                <SelectItem value="cocktail">קוקטייל</SelectItem>
                <SelectItem value="drink">משקה</SelectItem>
              </SelectContent>
            </Select>
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
          placeholder="פרטו את המרכיבים העיקריים של הפריט (לדוגמה: רוטב עגבניות, בזיליקום, פרמזן)"
          rows={4}
          error={errors?.description}
            />

        <IconTextarea
              id="specialNotes"
              name="specialNotes"
          label="הערות מיוחדות (אופציונלי)"
              value={formData.specialNotes}
              onChange={handleChange}
          placeholder="לצילום או עיבוד (לדוגמה: ללא גלוטן, דגש על צבעוניות)"
          rows={4}
          error={errors?.specialNotes}
            />
          </div>
    </div>
  );
};

export default ItemDetailsStep; 