import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface NewItemFormData {
  restaurantName: string;
  submitterName: string;
  contactEmail?: string;
  contactPhone?: string;
  itemName: string;
  itemType: string;
  description: string;
  specialNotes: string;
  referenceImages: File[];
  brandingMaterials: File[];
  referenceExamples: File[];
  itemsQuantityRange: string;
  estimatedImagesNeeded: string;
  primaryImageUsage: string;
  isNewBusiness?: boolean;
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
  contactEmail: '',
  contactPhone: '',
  itemName: '',
  itemType: '',
  description: '',
  specialNotes: '',
  referenceImages: [],
  brandingMaterials: [],
  referenceExamples: [],
  itemsQuantityRange: '',
  estimatedImagesNeeded: '',
  primaryImageUsage: ''
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
