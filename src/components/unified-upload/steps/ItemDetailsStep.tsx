
import React from 'react';

interface ItemDetailsStepProps {
  formData: {
    itemName: string;
    itemType: 'dish' | 'cocktail' | 'drink';
    description: string;
    specialNotes: string;
  };
  errors: Record<string, string>;
  onInputChange: (field: string, value: string) => void;
}

const ItemDetailsStep: React.FC<ItemDetailsStepProps> = ({
  formData,
  errors,
  onInputChange
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">פרטי הפריט</h2>
      
      <div>
        <label className="block text-sm font-medium mb-1">שם הפריט *</label>
        <input
          type="text"
          className="w-full p-3 border rounded-md"
          value={formData.itemName}
          onChange={(e) => onInputChange('itemName', e.target.value)}
          placeholder="הזן את שם הפריט"
        />
        {errors.itemName && (
          <p className="text-red-500 text-xs mt-1">{errors.itemName}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">סוג הפריט</label>
        <select
          className="w-full p-3 border rounded-md"
          value={formData.itemType}
          onChange={(e) => onInputChange('itemType', e.target.value)}
        >
          <option value="dish">מנה</option>
          <option value="cocktail">קוקטייל</option>
          <option value="drink">משקה</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">תיאור</label>
        <textarea
          className="w-full p-3 border rounded-md"
          rows={3}
          value={formData.description}
          onChange={(e) => onInputChange('description', e.target.value)}
          placeholder="תאר את הפריט (רכיבים, טעמים, סגנון וכו')"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">הערות מיוחדות</label>
        <textarea
          className="w-full p-3 border rounded-md"
          rows={2}
          value={formData.specialNotes}
          onChange={(e) => onInputChange('specialNotes', e.target.value)}
          placeholder="הערות נוספות לצוות העיצוב"
        />
      </div>
    </div>
  );
};

export default ItemDetailsStep;
