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
    description: 'תמונות מותאמות לאפליקציות הזמנה והמשלוח',
    gradient: 'from-blue-50 to-blue-100',
    hoverGradient: 'hover:from-blue-100 hover:to-blue-200',
    borderColor: 'border-blue-200'
  },
  {
    id: 'social',
    title: '📱 רשתות חברתיות',
    subtitle: 'Instagram, Facebook, TikTok',
    description: 'תמונות מותאמות לפרסום ברשתות חברתיות',
    gradient: 'from-purple-50 to-purple-100',
    hoverGradient: 'hover:from-purple-100 hover:to-purple-200',
    borderColor: 'border-purple-200'
  },
  {
    id: 'menu',
    title: '🍽️ תפריטים ומסכי הזמנה',
    subtitle: 'תפריטים דיגיטליים ופיזיים',
    description: 'תמונות מותאמות לתפריטים ומסכי הזמנה',
    gradient: 'from-green-50 to-green-100',
    hoverGradient: 'hover:from-green-100 hover:to-green-200',
    borderColor: 'border-green-200'
  },
  {
    id: 'marketing',
    title: '🎯 פרסום ושיווק',
    subtitle: 'קמפיינים ופרסומות',
    description: 'תמונות מותאמות לחומרי פרסום ושיווק',
    gradient: 'from-red-50 to-red-100',
    hoverGradient: 'hover:from-red-100 hover:to-red-200',
    borderColor: 'border-red-200'
  },
  {
    id: 'all',
    title: '🎨 כל הסגנונות',
    subtitle: 'מציג את כל 16 הסגנונות הזמינים',
    description: 'גישה לכל הסגנונות הזמינים במערכת',
    gradient: 'from-yellow-50 to-yellow-100',
    hoverGradient: 'hover:from-yellow-100 hover:to-yellow-200',
    borderColor: 'border-yellow-200'
  }
];

const CategorySelectionStep: React.FC<CategorySelectionStepProps> = ({ errors, clearErrors }) => {
  const { formData, updateFormData } = useNewItemForm();

  const handleCategorySelect = (categoryId: string) => {
    updateFormData({ selectedCategory: categoryId });
    if (errors.selectedCategory) clearErrors();
  };

  return (
    <div className="space-y-12">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#8B1E3F] to-[#A52A44] rounded-full mb-6 shadow-lg">
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-[#333333] mb-4">בחירת קטגוריה</h1>
        <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
          איך תשתמשו בתמונות? זה יעזור לנו לבחור את הסגנון המתאים ביותר עבורכם
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {categories.map((category) => (
          <div
            key={category.id}
            onClick={() => handleCategorySelect(category.id)}
            className={cn(
              "group p-8 border-3 rounded-2xl cursor-pointer transition-all duration-300 shadow-md hover:shadow-2xl transform hover:scale-105",
              formData.selectedCategory === category.id
                ? "border-[#F3752B] bg-gradient-to-br from-orange-50 to-orange-100 shadow-xl scale-105 ring-4 ring-[#F3752B]/20"
                : `${category.borderColor} bg-gradient-to-br ${category.gradient} ${category.hoverGradient} hover:border-[#F3752B]/70 hover:shadow-xl`
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-[#333333]">{category.title}</h3>
              <div className={cn(
                "w-6 h-6 rounded-full border-3 transition-all duration-300 shadow-sm",
                formData.selectedCategory === category.id
                  ? "border-[#F3752B] bg-[#F3752B] shadow-md"
                  : "border-gray-400 bg-white group-hover:border-[#F3752B] group-hover:shadow-md"
              )}>
                {formData.selectedCategory === category.id && (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
            <p className="text-[#F3752B] font-bold text-lg mb-3">{category.subtitle}</p>
            <p className="text-gray-600 text-base leading-relaxed">{category.description}</p>
          </div>
        ))}
      </div>

      {errors.selectedCategory && (
        <div className="text-center p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <p className="text-red-600 text-lg font-medium">{errors.selectedCategory}</p>
        </div>
      )}
    </div>
  );
};

export default CategorySelectionStep;
