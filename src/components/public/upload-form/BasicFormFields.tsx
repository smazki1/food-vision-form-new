
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PublicUploadFormData } from '@/hooks/usePublicUploadForm';

interface BasicFormFieldsProps {
  formData: PublicUploadFormData;
  errors: Record<string, string>;
  onInputChange: (field: keyof PublicUploadFormData, value: string) => void;
}

const BasicFormFields: React.FC<BasicFormFieldsProps> = ({
  formData,
  errors,
  onInputChange
}) => {
  return (
    <>
      <div>
        <Label htmlFor="restaurantName">שם המסעדה *</Label>
        <Input
          id="restaurantName"
          value={formData.restaurantName}
          onChange={(e) => onInputChange('restaurantName', e.target.value)}
          placeholder="הזן את שם המסעדה"
          className={errors.restaurantName ? 'border-red-500' : ''}
        />
        {errors.restaurantName && (
          <p className="text-red-500 text-sm mt-1">{errors.restaurantName}</p>
        )}
      </div>

      <div>
        <Label htmlFor="itemType">סוג הפריט *</Label>
        <Select 
          value={formData.itemType} 
          onValueChange={(value) => onInputChange('itemType', value)}
        >
          <SelectTrigger className={errors.itemType ? 'border-red-500' : ''}>
            <SelectValue placeholder="בחר סוג פריט" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dish">מנה</SelectItem>
            <SelectItem value="cocktail">קוקטייל</SelectItem>
            <SelectItem value="drink">משקה</SelectItem>
          </SelectContent>
        </Select>
        {errors.itemType && (
          <p className="text-red-500 text-sm mt-1">{errors.itemType}</p>
        )}
      </div>

      <div>
        <Label htmlFor="itemName">שם הפריט *</Label>
        <Input
          id="itemName"
          value={formData.itemName}
          onChange={(e) => onInputChange('itemName', e.target.value)}
          placeholder="הזן את שם הפריט"
          className={errors.itemName ? 'border-red-500' : ''}
        />
        {errors.itemName && (
          <p className="text-red-500 text-sm mt-1">{errors.itemName}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">תיאור הפריט</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onInputChange('description', e.target.value)}
          placeholder="תאר את הפריט (אופציונלי)"
          rows={3}
        />
      </div>

      {formData.itemType && formData.itemType !== 'cocktail' && (
        <div>
          <Label htmlFor="category">קטגוריה</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => onInputChange('category', e.target.value)}
            placeholder={`קטגורית ${formData.itemType === 'dish' ? 'המנה' : 'המשקה'} (אופציונלי)`}
          />
        </div>
      )}

      {formData.itemType === 'cocktail' && (
        <div>
          <Label htmlFor="ingredients">מרכיבים</Label>
          <Input
            id="ingredients"
            value={formData.ingredients}
            onChange={(e) => onInputChange('ingredients', e.target.value)}
            placeholder="הזן מרכיבים מופרדים בפסיק (אופציונלי)"
          />
          <p className="text-xs text-gray-500 mt-1">
            לדוגמה: וודקה, מיץ קרנברי, מיץ ליים
          </p>
        </div>
      )}
    </>
  );
};

export default BasicFormFields;
