
import React from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { IconInput } from '@/components/ui/icon-input';
import { IconTextarea } from '@/components/ui/icon-textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Sparkles, ChevronDown } from 'lucide-react';

interface ItemDetailsStepProps {
  errors: Record<string, string>;
}

const ItemDetailsStep: React.FC<ItemDetailsStepProps> = ({ errors }) => {
  const { formData, updateFormData } = useNewItemForm();

  const itemTypeOptions = [
    { value: 'dish', label: 'מנה' },
    { value: 'cocktail', label: 'קוקטייל' },
    { value: 'drink', label: 'משקה' }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          פרטי המנה / מוצר
        </h2>
        <p className="text-gray-600">
          אנא ספרו לנו על הפריט שברצונכם להעלות
        </p>
      </div>

      <div className="space-y-6">
        <IconInput
          id="itemName"
          name="itemName"
          label="שם הפריט"
          placeholder="לדוגמה: המבורגר בית, מוהיטו קלאסי"
          value={formData.itemName || ''}
          onChange={(e) => updateFormData({ itemName: e.target.value })}
          error={errors.itemName}
          required
        />

        <div className="space-y-2">
          <Label htmlFor="itemType" className="font-medium text-gray-700">
            סוג הפריט <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.itemType || ''}
            onValueChange={(value) => updateFormData({ itemType: value as 'dish' | 'cocktail' | 'drink' })}
          >
            <SelectTrigger 
              className={`w-full h-12 ${errors.itemType ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : ''}`}
              dir="rtl"
            >
              <SelectValue placeholder="בחרו סוג פריט" />
              <ChevronDown className="h-4 w-4 opacity-50 mr-2" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              {itemTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.itemType && (
            <p className="text-xs text-red-500 mt-1">{errors.itemType}</p>
          )}
        </div>

        <IconTextarea
          id="description"
          name="description"
          label="מרכיבים עיקריים"
          placeholder="רשמו את המרכיבים העיקריים של הפריט (אופציונלי)"
          value={formData.description || ''}
          onChange={(e) => updateFormData({ description: e.target.value })}
          className="min-h-[100px]"
        />

        <IconTextarea
          id="specialNotes"
          name="specialNotes"
          label="הערות מיוחדות"
          placeholder="כל מידע נוסף שחשוב שנדע (אופציונלי)"
          value={formData.specialNotes || ''}
          onChange={(e) => updateFormData({ specialNotes: e.target.value })}
          className="min-h-[80px]"
        />
      </div>
    </div>
  );
};

export default ItemDetailsStep;
