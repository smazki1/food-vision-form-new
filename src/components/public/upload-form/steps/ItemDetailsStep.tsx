
import React, { useState, useRef, useEffect } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const ItemDetailsStep: React.FC<PublicStepProps> = ({ errors: externalErrors, clearExternalErrors }) => {
  const { formData, updateFormData } = useNewItemForm();
  const errors = externalErrors || {};
  
  // State for autocomplete
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Popular item type suggestions
  const itemTypeSuggestions = [
    'מנה', 'שתיה', 'קוקטייל', 'צמיד', 'שרשרת', 'כוסות', 'צלחות', 
    'תכשיטים', 'קאפקייק', 'עוגיות', 'לחם', 'פיצה', 'סלט', 'מרק',
    'קינוח', 'רוטב', 'דגים', 'בשר', 'עוף', 'ממתקים'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
    if (errors && errors[name] && clearExternalErrors) {
      clearExternalErrors();
    }
  };

  const handleItemTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Update form data
    updateFormData({ itemType: value });
    
    // Filter suggestions
    if (value.trim()) {
      const filtered = itemTypeSuggestions.filter(suggestion =>
        suggestion.includes(value) || value.includes(suggestion)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredSuggestions(itemTypeSuggestions);
      setShowSuggestions(true);
    }
    
    if (errors && errors.itemType && clearExternalErrors) {
      clearExternalErrors();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    updateFormData({ itemType: suggestion });
    setShowSuggestions(false);
    if (errors && errors.itemType && clearExternalErrors) {
      clearExternalErrors();
    }
  };

  const handleInputFocus = () => {
    setFilteredSuggestions(itemTypeSuggestions);
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking
    setTimeout(() => setShowSuggestions(false), 150);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          <label htmlFor="itemName" className="block text-lg font-semibold text-[#333333]">
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

        {/* Item Type Selection - Free text with autocomplete */}
        <div className="space-y-4 relative">
          <label htmlFor="itemType" className="block text-lg font-semibold text-[#333333]">
            סוג הפריט
            <span className="text-red-500 mr-1">*</span>
          </label>
          <div className="relative" ref={inputRef}>
            <input
              id="itemType"
              name="itemType"
              type="text"
              value={formData.itemType || ''}
              onChange={handleItemTypeChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="לדוגמה: מנה, שתיה, צמיד, כוסות..."
              maxLength={50}
              className={cn(
                "w-full px-6 py-4 text-lg border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#F3752B]/20",
                errors?.itemType 
                  ? "border-red-500 bg-red-50" 
                  : "border-gray-200 focus:border-[#F3752B] bg-white hover:border-gray-300"
              )}
            />
            <ChevronDown 
              className={cn(
                "absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform duration-200",
                showSuggestions ? "rotate-180" : ""
              )}
            />
            
            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredSuggestions.length > 0 ? (
                  <div className="py-2">
                    {filteredSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-right px-4 py-2 text-lg hover:bg-gray-50 focus:bg-gray-50 transition-colors duration-150"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 px-4 text-gray-500 text-center">
                    לא נמצאו הצעות מתאימות
                  </div>
                )}
              </div>
            )}
          </div>
          {errors?.itemType && (
            <p className="text-red-500 text-sm mt-2 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full ml-2"></span>
              {errors.itemType}
            </p>
          )}
          <p className="text-sm text-gray-500">
            הזינו תיאור קצר של סוג הפריט (עד 50 תווים)
          </p>
        </div>

        {/* Description - simplified without visual examples */}
        <div className="space-y-3">
          <label htmlFor="description" className="block text-lg font-semibold text-[#333333]">
            ספרו בקצרה מה מרכיבי המנה העיקריים
            <span className="text-red-500 mr-1">*</span>
          </label>
          
          <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            placeholder="פסטה קרבונרה עם חזה עוף מוזהב, פרמז'ן מגורר, ביצה טרייה וצ'ילי גרוס. מוגש עם פרוסת לחם שום"
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
          <label htmlFor="specialNotes" className="block text-lg font-semibold text-[#333333]">
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
