
import { useState } from 'react';

export interface PublicUploadFormData {
  restaurantName: string;
  itemType: 'dish' | 'cocktail' | 'drink' | '';
  itemName: string;
  description: string;
  category: string;
  ingredients: string;
  images: File[];
}

export const usePublicUploadForm = () => {
  const [formData, setFormData] = useState<PublicUploadFormData>({
    restaurantName: '',
    itemType: '',
    itemName: '',
    description: '',
    category: '',
    ingredients: '',
    images: []
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof PublicUploadFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.restaurantName.trim()) {
      newErrors.restaurantName = 'שם המסעדה הוא שדה חובה';
    }
    if (!formData.itemType) {
      newErrors.itemType = 'סוג הפריט הוא שדה חובה';
    }
    if (!formData.itemName.trim()) {
      newErrors.itemName = 'שם הפריט הוא שדה חובה';
    }
    if (formData.images.length === 0) {
      newErrors.images = 'יש להעלות לפחות תמונה אחת';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      restaurantName: '',
      itemType: '',
      itemName: '',
      description: '',
      category: '',
      ingredients: '',
      images: []
    });
    setErrors({});
  };

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    handleInputChange,
    validateForm,
    resetForm
  };
};
