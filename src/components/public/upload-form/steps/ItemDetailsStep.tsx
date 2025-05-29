
import React from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { UtensilsCrossed, FileText, Coffee, Utensils, Wine } from 'lucide-react';
import { cn } from '@/lib/utils';

const ItemDetailsStep: React.FC<PublicStepProps> = ({ errors: externalErrors, clearExternalErrors }) => {
  const { formData, updateFormData } = useNewItemForm();
  const errors = externalErrors || {};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
    if (errors && errors[name] && clearExternalErrors) {
      clearExternalErrors();
    }
  };

  const handleItemTypeChange = (itemType: 'dish' | 'cocktail' | 'drink') => {
    updateFormData({ itemType });
    if (errors && errors.itemType && clearExternalErrors) {
      clearExternalErrors();
    }
  };

  const itemTypes = [
    { value: 'dish', label: 'מנה/מוצר', icon: Utensils },
    { value: 'drink', label: 'שתיה', icon: Coffee },
    { value: 'cocktail', label: 'קוקטייל', icon: Wine }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-[#333333] mb-4">
          פרטי המנה / מוצר
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          ספרו לנו על המנה שלכם כדי שנוכל ליצור עבורכם תמונה מושלמת
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-8 max-w-3xl mx-auto">
        {/* Item Name */}
        <div className="space-y-3">
          <label htmlFor="itemName" className="block text-lg font-semibold text-[#333333] flex items-center">
            <UtensilsCrossed className="w-6 h-6 text-[#F3752B] ml-3" />
            שם המנה / המוצר
            <span className="text-red-500 mr-1">*</span>
          </label>
          <input
            id="itemName"
            name="itemName"
            type="text"
            value={formData.itemName || ''}
            onChange={handleChange}
            placeholder="לדוגמה: פסטה קרבונרה, מוחיטו קלאסי"
            className={cn(
              "w-full px-6 py-4 text-lg border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#F3752B]/20",
              errors?.itemName 
                ? "border-red-500 bg-red-50" 
                : "border-gray-200 focus:border-[#F3752B] bg-white hover:border-gray-300"
            )}
          />
          {errors?.itemName && (
            <p className="text-red-500 text-sm mt-2 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full ml-2"></span>
              {errors.itemName}
            </p>
          )}
        </div>

        {/* Item Type Selection - Compact horizontal layout */}
        <div className="space-y-4">
          <label className="block text-lg font-semibold text-[#333333] flex items-center">
            <UtensilsCrossed className="w-6 h-6 text-[#F3752B] ml-3" />
            סוג הפריט
            <span className="text-red-500 mr-1">*</span>
          </label>
          <div className="flex flex-wrap gap-3 justify-center">
            {itemTypes.map((type) => {
              const IconComponent = type.icon;
              const isSelected = formData.itemType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleItemTypeChange(type.value as 'dish' | 'cocktail' | 'drink')}
                  className={cn(
                    "px-6 py-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md flex items-center gap-2 min-w-[120px] justify-center",
                    isSelected
                      ? "border-[#F3752B] bg-orange-50 text-[#F3752B] shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  )}
                >
                  <IconComponent className={cn("w-4 h-4", isSelected ? "text-[#F3752B]" : "text-gray-400")} />
                  <span className="font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>
          {errors?.itemType && (
            <p className="text-red-500 text-sm mt-2 flex items-center justify-center">
              <span className="w-2 h-2 bg-red-500 rounded-full ml-2"></span>
              {errors.itemType}
            </p>
          )}
        </div>

        {/* Description with improved guidance */}
        <div className="space-y-3">
          <label htmlFor="description" className="block text-lg font-semibold text-[#333333] flex items-center">
            <FileText className="w-6 h-6 text-[#F3752B] ml-3" />
            ספרו בקצרה מה מרכיבי המנה העיקריים
            <span className="text-red-500 mr-1">*</span>
          </label>
          <p className="text-sm text-gray-600 mb-3">
            לדוגמה: סלט קיסר עם חזה עוף, קרוטונים ורוטב קיסר ביתי
          </p>
          
          {/* Visual example */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-emerald-800 mb-2">דוגמה לתיאור טוב:</h4>
            <p className="text-emerald-700 text-sm italic">
              "פסטה קרבונרה עם בייקון פריך, פרמז'ן מגורר, ביצה טרייה וצ'ילי גרוס. מוגש עם פרוסת לחם שום"
            </p>
          </div>
          
          <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            placeholder="תארו את המרכיבים העיקריים שחשוב שיראו בתמונה..."
            rows={4}
            className={cn(
              "w-full px-6 py-4 text-lg border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#F3752B]/20 resize-none",
              errors?.description 
                ? "border-red-500 bg-red-50" 
                : "border-gray-200 focus:border-[#F3752B] bg-white hover:border-gray-300"
            )}
          />
          {errors?.description && (
            <p className="text-red-500 text-sm mt-2 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full ml-2"></span>
              {errors.description}
            </p>
          )}
        </div>

        {/* Special Notes */}
        <div className="space-y-3">
          <label htmlFor="specialNotes" className="block text-lg font-semibold text-[#333333] flex items-center">
            <FileText className="w-6 h-6 text-emerald-500 ml-3" />
            הערות מיוחדות
            <span className="text-sm text-gray-500 font-normal mr-2">(אופציונלי)</span>
          </label>
          <textarea
            id="specialNotes"
            name="specialNotes"
            value={formData.specialNotes || ''}
            onChange={handleChange}
            placeholder="לדוג': להציג את הסלט עם קרוטונים, בלי בצל, להבליט את הרוטב, עדיף צלחת לבנה"
            rows={3}
            className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#F3752B]/20 focus:border-[#F3752B] bg-white hover:border-gray-300 resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default ItemDetailsStep;
