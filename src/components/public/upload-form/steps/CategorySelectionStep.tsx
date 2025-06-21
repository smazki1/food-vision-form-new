
import React from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { cn } from '@/lib/utils';

interface CategorySelectionStepProps {
  errors: Record<string, string>;
  clearErrors: () => void;
}

const categories = [
  {
    id: 'delivery',
    title: '🚗 אפליקציות משלוח',
    subtitle: 'Wolt, 10bis - הכי פופולרי',
    description: 'תמונות מותאמות לאפליקציות הזמנה והמשלוח'
  },
  {
    id: 'social',
    title: '📱 רשתות חברתיות',
    subtitle: 'Instagram, Facebook, TikTok',
    description: 'תמונות מותאמות לפרסום ברשתות חברתיות'
  },
  {
    id: 'menu',
    title: '🍽️ תפריטים ומסכי הזמנה',
    subtitle: 'תפריטים דיגיטליים ופיזיים',
    description: 'תמונות מותאמות לתפריטים ומסכי הזמנה'
  },
  {
    id: 'marketing',
    title: '🎯 פרסום ושיווק',
    subtitle: 'מודעות ועלונים',
    description: 'תמונות מותאמות לחומרי פרסום ושיווק'
  },
  {
    id: 'all',
    title: '🎨 כל הסגנונות',
    subtitle: 'מציג את כל 12 הסגנונות הזמינים',
    description: 'גישה לכל הסגנונות הזמינים במערכת'
  }
];

const CategorySelectionStep: React.FC<CategorySelectionStepProps> = ({ errors, clearErrors }) => {
  const { formData, updateFormData } = useNewItemForm();

  const handleCategorySelect = (categoryId: string) => {
    updateFormData({ selectedCategory: categoryId });
    if (errors.selectedCategory) clearErrors();
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#333333] mb-4">בחירת קטגוריה</h1>
        <p className="text-gray-600">איך תשתמשו בתמונות? זה יעזור לנו לבחור את הסגנון המתאים</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            onClick={() => handleCategorySelect(category.id)}
            className={cn(
              "p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg",
              formData.selectedCategory === category.id
                ? "border-[#F3752B] bg-orange-50"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <h3 className="text-xl font-semibold text-[#333333] mb-2">{category.title}</h3>
            <p className="text-[#F3752B] font-medium mb-2">{category.subtitle}</p>
            <p className="text-gray-600 text-sm">{category.description}</p>
          </div>
        ))}
      </div>

      {errors.selectedCategory && (
        <p className="text-red-500 text-sm text-center">{errors.selectedCategory}</p>
      )}
    </div>
  );
};

export default CategorySelectionStep;
