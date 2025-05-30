import React from 'react';
import { NewItemFormData } from '@/contexts/NewItemFormContext';

// Define the specific fields from NewItemFormData this component will use
// This helps in making the component more self-contained regarding its data needs
// and ensures type safety when onInputChange is called.
export type ClientItemDetailsFormData = Pick<
  NewItemFormData, 
  'itemName' | 'itemType' | 'description' | 'specialNotes'
>;

interface ClientItemDetailsStepProps {
  formData: ClientItemDetailsFormData;
  errors: Record<string, string>;
  onInputChange: (field: keyof ClientItemDetailsFormData, value: string) => void;
}

const ClientItemDetailsStep: React.FC<ClientItemDetailsStepProps> = ({
  formData,
  errors,
  onInputChange
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">פרטי הפריט</h2>
      
      <div>
        <label htmlFor="itemName" className="block text-sm font-medium mb-1">שם הפריט *</label>
        <input
          id="itemName"
          type="text"
          className="w-full p-3 border rounded-md"
          value={formData.itemName || ''}
          onChange={(e) => onInputChange('itemName', e.target.value)}
          placeholder="הזן את שם הפריט"
        />
        {errors.itemName && (
          <p className="text-red-500 text-xs mt-1">{errors.itemName}</p>
        )}
      </div>

      <div>
        <label htmlFor="itemType" className="block text-sm font-medium mb-1">סוג הפריט</label>
        <select
          id="itemType"
          className="w-full p-3 border rounded-md"
          value={formData.itemType || 'dish'} // Default to 'dish' if not set
          onChange={(e) => onInputChange('itemType', e.target.value as NewItemFormData['itemType'])}
        >
          <option value="dish">מנה</option>
          <option value="cocktail">קוקטייל</option>
          <option value="drink">משקה</option>
        </select>
         {errors.itemType && (
          <p className="text-red-500 text-xs mt-1">{errors.itemType}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">תיאור</label>
        <textarea
          id="description"
          className="w-full p-3 border rounded-md"
          rows={3}
          value={formData.description || ''}
          onChange={(e) => onInputChange('description', e.target.value)}
          placeholder="תאר את הפריט (רכיבים, טעמים, סגנון וכו')"
        />
         {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description}</p>
        )}
      </div>

      <div>
        <label htmlFor="specialNotes" className="block text-sm font-medium mb-1">הערות מיוחדות</label>
        <textarea
          id="specialNotes"
          className="w-full p-3 border rounded-md"
          rows={2}
          value={formData.specialNotes || ''}
          onChange={(e) => onInputChange('specialNotes', e.target.value)}
          placeholder="הערות נוספות לצוות העיצוב"
        />
        {errors.specialNotes && (
          <p className="text-red-500 text-xs mt-1">{errors.specialNotes}</p>
        )}
      </div>
    </div>
  );
};

export default ClientItemDetailsStep; 