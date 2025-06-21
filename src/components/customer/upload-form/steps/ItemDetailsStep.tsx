import React, { useState, useRef, useEffect } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { IconInput } from '@/components/ui/icon-input';
import { IconTextarea } from '@/components/ui/icon-textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { StepProps } from '../FoodVisionUploadForm';
import { Sparkles, UtensilsCrossed, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const ItemDetailsStep: React.FC<StepProps> = ({ errors: externalErrors, clearExternalErrors }) => {
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
    <div className="space-y-8" dir="rtl">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-primary ml-2" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          פרטי העלאה
        </h2>
        <p className="text-gray-600 mb-8">
          הזינו את פרטי הפריט
        </p>
      </div>

      <div className="bg-primary/5 p-6 rounded-xl border border-primary/20">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <Sparkles className="w-6 h-6 text-primary ml-2" />
          פרטי הפריט
        </h3>
        
        <div className="space-y-6">
          <IconInput
            id="itemName"
            name="itemName"
            label="שם הפריט"
            value={formData.itemName}
            onChange={handleChange}
            placeholder="לדוגמה: פסטה קרבונרה, מוחיטו קלאסי"
            error={errors?.itemName}
            iconPosition="right"
            required
          />

          <div className="space-y-3 relative">
            <Label className="text-base font-medium text-gray-700 flex items-center">
              <UtensilsCrossed className="w-5 h-5 text-primary ml-2" />
              סוג הפריט <span className="text-red-600 ml-1">*</span>
            </Label>
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
                  "w-full px-4 py-3 text-base border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20",
                  errors?.itemType 
                    ? "border-red-500 bg-red-50" 
                    : "border-gray-200 focus:border-primary bg-white hover:border-gray-300"
                )}
              />
              <ChevronDown 
                className={cn(
                  "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform duration-200",
                  showSuggestions ? "rotate-180" : ""
                )}
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredSuggestions.length > 0 ? (
                    <div className="py-2">
                      {filteredSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-right px-4 py-2 text-base hover:bg-gray-50 focus:bg-gray-50 transition-colors duration-150"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 px-4 text-gray-500 text-center text-sm">
                      לא נמצאו הצעות מתאימות
                    </div>
                  )}
                </div>
              )}
            </div>
            {errors?.itemType && (
              <p className="text-xs text-red-500 mt-1">{errors.itemType}</p>
            )}
            <p className="text-xs text-gray-500">
              הזינו תיאור קצר של סוג הפריט (עד 50 תווים)
            </p>
          </div>

          <IconTextarea
            id="description"
            name="description"
            label="כתבו את המרכיבים המרכזיים שאסור לפספס במנה"
            value={formData.description}
            onChange={handleChange}
            placeholder="פרטו את המרכיבים העיקריים של הפריט"
            rows={3}
            error={errors?.description}
          />

          <IconTextarea
            id="specialNotes"
            name="specialNotes"
            label="הערות מיוחדות (אופציונלי)"
            value={formData.specialNotes}
            onChange={handleChange}
            placeholder="כל מידע נוסף שחשוב שנדע"
            rows={2}
            error={errors?.specialNotes}
          />
        </div>
      </div>
    </div>
  );
};

export default ItemDetailsStep;
