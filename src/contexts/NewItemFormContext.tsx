
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface DishData {
  id: number;
  itemName: string;
  itemType: string;
  description: string;
  specialNotes?: string;
  referenceImages: File[];
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
  addDish: () => void;
  removeDish: (dishId: number) => void;
  updateDish: (dishId: number, updates: Partial<DishData>) => void;
}

const NewItemFormContext = createContext<NewItemFormContextType | undefined>(undefined);

const initialFormData: NewItemFormData = {
  restaurantName: '',
  submitterName: '',
  phone: '',
  email: '',
  dishes: [],
  itemName: '',
  itemType: '',
  description: '',
  specialNotes: '',
  referenceImages: [],
  brandingMaterials: [],
  referenceExamples: []
};

let nextDishId = 1;

export const NewItemFormProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [formData, setFormData] = useState<NewItemFormData>(initialFormData);

  const updateFormData = (updates: Partial<NewItemFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const resetFormData = () => {
    setFormData(initialFormData);
    nextDishId = 1;
  };

  const addDish = () => {
    const newDish: DishData = {
      id: nextDishId++,
      itemName: '',
      itemType: '',
      description: '',
      specialNotes: '',
      referenceImages: []
    };
    setFormData(prev => ({
      ...prev,
      dishes: [...prev.dishes, newDish]
    }));
  };

  const removeDish = (dishId: number) => {
    setFormData(prev => ({
      ...prev,
      dishes: prev.dishes.filter(dish => dish.id !== dishId)
    }));
  };

  const updateDish = (dishId: number, updates: Partial<DishData>) => {
    setFormData(prev => ({
      ...prev,
      dishes: prev.dishes.map(dish => 
        dish.id === dishId ? { ...dish, ...updates } : dish
      )
    }));
  };

  return (
    <NewItemFormContext.Provider value={{
      formData,
      updateFormData,
      resetFormData,
      addDish,
      removeDish,
      updateDish
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
