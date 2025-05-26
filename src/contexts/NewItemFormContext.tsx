
import React, { createContext, useState, useContext, ReactNode } from 'react';

export type ItemType = 'dish' | 'cocktail' | 'drink' | '';

export interface NewItemFormData {
  itemName: string;
  itemType: ItemType;
  description?: string;
  specialNotes?: string;
  referenceImages: File[]; 
  // Restaurant details - only restaurant name needed for public form
  restaurantName?: string;
}

interface NewItemFormContextType {
  formData: NewItemFormData;
  updateFormData: (data: Partial<NewItemFormData>) => void;
  resetFormData: () => void;
}

const defaultFormData: NewItemFormData = {
  itemName: '',
  itemType: '',
  description: '',
  specialNotes: '',
  referenceImages: [],
  restaurantName: '',
};

export const NewItemFormContext = createContext<NewItemFormContextType | undefined>(undefined);

export const NewItemFormProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [formData, setFormData] = useState<NewItemFormData>(defaultFormData);

  const updateFormData = (data: Partial<NewItemFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const resetFormData = () => {
    setFormData(defaultFormData);
  };

  return (
    <NewItemFormContext.Provider value={{ formData, updateFormData, resetFormData }}>
      {children}
    </NewItemFormContext.Provider>
  );
};

export const useNewItemForm = () => {
  const context = useContext(NewItemFormContext);
  if (context === undefined) {
    throw new Error('useNewItemForm must be used within a NewItemFormProvider');
  }
  return context;
};
