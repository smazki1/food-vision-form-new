import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface DishData {
  id: string;
  itemType: string;
  itemName: string;
  description: string;
  specialNotes: string;
  referenceImages: File[];
  brandingMaterials: File[];
  referenceExamples: File[];
  isCustomItemType: boolean;
  customItemType: string;
}

export interface NewItemFormData {
  restaurantName: string;
  submitterName: string;
  contactEmail?: string;
  contactPhone?: string;
  // Legacy single dish fields (maintained for compatibility)
  itemName: string;
  itemType: string;
  description: string;
  specialNotes: string;
  referenceImages: File[];
  brandingMaterials: File[];
  referenceExamples: File[];
  // New multiple dishes support
  dishes: DishData[];
  itemsQuantityRange: string;
  estimatedImagesNeeded: string;
  primaryImageUsage: string;
  isNewBusiness?: boolean;
  // Business type detection for features
  isLead?: boolean; // true if this is a lead (first time), false if registered business
}

interface NewItemFormContextType {
  formData: NewItemFormData;
  updateFormData: (updates: Partial<NewItemFormData>) => void;
  resetFormData: () => void;
  // New methods for dishes management
  addDish: () => string; // Returns new dish ID
  removeDish: (dishId: string) => void;
  updateDish: (dishId: string, updates: Partial<DishData>) => void;
  getDish: (dishId: string) => DishData | undefined;
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

const createInitialDish = (id: string): DishData => ({
  id,
  itemType: '',
  itemName: '',
  description: '',
  specialNotes: '',
  referenceImages: [],
  brandingMaterials: [],
  referenceExamples: [],
  isCustomItemType: false,
  customItemType: ''
});

const initialFormData: NewItemFormData = {
  restaurantName: '',
  submitterName: '',
  contactEmail: '',
  contactPhone: '',
  // Legacy fields
  itemName: '',
  itemType: '',
  description: '',
  specialNotes: '',
  referenceImages: [],
  brandingMaterials: [],
  referenceExamples: [],
  // Multiple dishes
  dishes: [createInitialDish('1')],
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

  const addDish = (): string => {
    let newId: string;
    
    setFormData(prevData => {
      newId = (prevData.dishes.length + 1).toString();
      const newDish = createInitialDish(newId);
      
      return {
        ...prevData,
        dishes: [...prevData.dishes, newDish]
      };
    });
    
    return newId!;
  };

  const removeDish = (dishId: string) => {
    setFormData(prevData => ({
      ...prevData,
      dishes: prevData.dishes.filter(dish => dish.id !== dishId)
    }));
  };

  const updateDish = (dishId: string, updates: Partial<DishData>) => {
    setFormData(prevData => ({
      ...prevData,
      dishes: prevData.dishes.map(dish => 
        dish.id === dishId ? { ...dish, ...updates } : dish
      )
    }));
  };

  const getDish = (dishId: string): DishData | undefined => {
    return formData.dishes.find(dish => dish.id === dishId);
  };

  const value: NewItemFormContextType = {
    formData,
    updateFormData,
    resetFormData,
    addDish,
    removeDish,
    updateDish,
    getDish
  };

  return (
    <NewItemFormContext.Provider value={value}>
      {children}
    </NewItemFormContext.Provider>
  );
};
