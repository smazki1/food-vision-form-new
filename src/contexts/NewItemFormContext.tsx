
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface NewItemFormData {
  restaurantName: string;
  submitterName?: string;
  itemName: string;
  itemType: 'dish' | 'cocktail' | 'drink';
  description: string;
  specialNotes: string;
  referenceImages: File[];
}

interface NewItemFormContextType {
  formData: NewItemFormData;
  updateFormData: (updates: Partial<NewItemFormData>) => void;
  resetFormData: () => void;
}

const NewItemFormContext = createContext<NewItemFormContextType | undefined>(undefined);

export const useNewItemForm = (): NewItemFormContextType => {
  const context = useContext(NewItemFormContext);
  if (context === undefined) {
    throw new Error('useNewItemForm must be used within a NewItemFormProvider');
  }
  return context;
};

interface NewItemFormProviderProps {
  children: ReactNode;
}

const initialFormData: NewItemFormData = {
  restaurantName: '',
  submitterName: '',
  itemName: '',
  itemType: 'dish',
  description: '',
  specialNotes: '',
  referenceImages: []
};

export const NewItemFormProvider: React.FC<NewItemFormProviderProps> = ({ children }) => {
  const [formData, setFormData] = useState<NewItemFormData>(initialFormData);

  const updateFormData = (updates: Partial<NewItemFormData>) => {
    setFormData(prevData => ({ ...prevData, ...updates }));
  };

  const resetFormData = () => {
    setFormData(initialFormData);
  };

  const value: NewItemFormContextType = {
    formData,
    updateFormData,
    resetFormData
  };

  return (
    <NewItemFormContext.Provider value={value}>
      {children}
    </NewItemFormContext.Provider>
  );
};
