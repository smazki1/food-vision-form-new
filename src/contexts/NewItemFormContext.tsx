
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
  qualityConfirmed: boolean;
}

export interface NewItemFormData {
  // Contact Information
  restaurantName: string;
  submitterName: string;
  phone: string;
  email?: string;

  // Multiple Dishes
  dishes: DishData[];

  // Category and Style Selection
  selectedCategory?: string;
  selectedStyle?: string;
  customStyle?: {
    inspirationImages: File[];
    brandingMaterials: File[];
    instructions: string;
  };

  // Legacy fields for backward compatibility
  itemName: string;
  itemType: string;
  description: string;
  specialNotes: string;
  referenceImages: File[];
  brandingMaterials: File[];
  referenceExamples: File[];
  category?: string;
}

interface NewItemFormContextType {
  formData: NewItemFormData;
  updateFormData: (updates: Partial<NewItemFormData>) => void;
  resetFormData: () => void;
  addDish: () => string;
  removeDish: (dishId: string) => void;
  updateDish: (dishId: string, updates: Partial<DishData>) => void;
  getDish: (dishId: string) => DishData | undefined;
}

const NewItemFormContext = createContext<NewItemFormContextType | undefined>(undefined);

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
  customItemType: '',
  qualityConfirmed: false
});

const initialFormData: NewItemFormData = {
  restaurantName: '',
  submitterName: '',
  phone: '',
  email: '',
  dishes: [createInitialDish('1')],
  itemName: '',
  itemType: '',
  description: '',
  specialNotes: '',
  referenceImages: [],
  brandingMaterials: [],
  referenceExamples: []
};

export const NewItemFormProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [formData, setFormData] = useState<NewItemFormData>(initialFormData);

  const updateFormData = (updates: Partial<NewItemFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const resetFormData = () => {
    setFormData(initialFormData);
  };

  const addDish = (): string => {
    let newId: string = '';
    
    setFormData(prevData => {
      newId = (prevData.dishes.length + 1).toString();
      const newDish = createInitialDish(newId);
      
      return {
        ...prevData,
        dishes: [...prevData.dishes, newDish]
      };
    });
    
    return newId;
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

  return (
    <NewItemFormContext.Provider value={{
      formData,
      updateFormData,
      resetFormData,
      addDish,
      removeDish,
      updateDish,
      getDish
    }}>
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
