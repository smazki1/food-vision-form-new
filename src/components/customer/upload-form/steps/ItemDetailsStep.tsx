import React, { useState, useRef, useEffect } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { IconInput } from '@/components/ui/icon-input';
import { IconTextarea } from '@/components/ui/icon-textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { StepProps } from '../FoodVisionUploadForm';
import { Sparkles, UtensilsCrossed, ChevronDown, Info, ArrowLeft, ArrowRight, Mail, Phone, Users, Building2, AlertCircle } from 'lucide-react';
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
          הזינו את פרטי הפריט ופרטי הקשר
        </p>
      </div>

      {/* Important Information Section */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-6 border-2 border-blue-100 shadow-lg">
        <div className="flex items-center justify-center mb-4">
          <Info className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-center text-gray-800 mb-6">
          חשוב לדעת לפני שמתחילים
        </h3>
        
        {/* Before/After Example */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="text-center">
            <div className="bg-white rounded-xl p-4 shadow-md mb-3">
              <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                <span className="text-gray-500 text-sm">תמונה לפני עיבוד</span>
              </div>
              <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                לפני
              </span>
            </div>
            <p className="text-sm text-gray-600">
              התמונה שאתם מעלים
            </p>
          </div>
          
          <div className="flex items-center justify-center md:hidden">
            <ArrowLeft className="w-6 h-6 text-blue-500" />
          </div>
          <div className="hidden md:flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-blue-500" />
          </div>
          
          <div className="text-center">
            <div className="bg-white rounded-xl p-4 shadow-md mb-3">
              <div className="w-full h-32 bg-gradient-to-br from-orange-200 to-yellow-200 rounded-lg flex items-center justify-center mb-2">
                <span className="text-gray-700 text-sm">תמונה מעוצבת מקצועית</span>
              </div>
              <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                אחרי
              </span>
            </div>
            <p className="text-sm text-gray-600">
              התוצאה המקצועית שלכם
            </p>
          </div>
        </div>

        {/* Key Points */}
        <div className="space-y-3 text-right">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-gray-700">
              <strong>מה שאתם מעלים = מה שאתם מקבלים:</strong> אנחנו משפרים ומעצבים את התמונות שלכם באופן מקצועי
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-gray-700">
              <strong>אנחנו לא משנים את המנות עצמן:</strong> אנחנו מעצבים את התמונות, לא את האוכל
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-gray-700">
              <strong>תמונות איכותיות = תוצאות מעולות:</strong> ככל שהתמונות המקוריות יותר טובות, כך התוצאה תהיה יותר מרשימה
            </p>
          </div>
        </div>
      </div>

      {/* Item Details Section */}
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

      {/* Contact Details Section */}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <Users className="w-6 h-6 text-primary ml-2" />
          פרטי קשר
        </h3>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="restaurantName" className="text-base font-medium text-gray-700 flex items-center">
              <Building2 className="w-5 h-5 text-primary ml-2" />
              שם המסעדה / העסק <span className="text-red-600 ml-1">*</span>
            </Label>
            <Input
              id="restaurantName"
              type="text"
              placeholder="לדוגמה: מסעדת השף הקטן"
              value={formData.restaurantName || ''}
              onChange={(e) => updateFormData({ restaurantName: e.target.value })}
              className={cn(
                "h-12 text-base border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20",
                errors?.restaurantName 
                  ? "border-red-500 bg-red-50" 
                  : "border-gray-200 focus:border-primary bg-white hover:border-gray-300"
              )}
            />
            {errors?.restaurantName && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errors.restaurantName}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="submitterName" className="text-base font-medium text-gray-700 flex items-center">
              <Users className="w-5 h-5 text-primary ml-2" />
              שם איש הקשר <span className="text-red-600 ml-1">*</span>
            </Label>
            <Input
              id="submitterName"
              type="text"
              placeholder="השם שלכם"
              value={formData.submitterName || ''}
              onChange={(e) => updateFormData({ submitterName: e.target.value })}
              className={cn(
                "h-12 text-base border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20",
                errors?.submitterName 
                  ? "border-red-500 bg-red-50" 
                  : "border-gray-200 focus:border-primary bg-white hover:border-gray-300"
              )}
            />
            {errors?.submitterName && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errors.submitterName}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-medium text-gray-700 flex items-center">
              <Mail className="w-5 h-5 text-primary ml-2" />
              כתובת אימייל <span className="text-red-600 ml-1">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email || ''}
              onChange={(e) => updateFormData({ email: e.target.value })}
              className={cn(
                "h-12 text-base border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20",
                errors?.email 
                  ? "border-red-500 bg-red-50" 
                  : "border-gray-200 focus:border-primary bg-white hover:border-gray-300"
              )}
            />
            {errors?.email && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errors.email}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-base font-medium text-gray-700 flex items-center">
              <Phone className="w-5 h-5 text-primary ml-2" />
              מספר טלפון <span className="text-red-600 ml-1">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="050-1234567"
              value={formData.phone || ''}
              onChange={(e) => updateFormData({ phone: e.target.value })}
              className={cn(
                "h-12 text-base border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20",
                errors?.phone 
                  ? "border-red-500 bg-red-50" 
                  : "border-gray-200 focus:border-primary bg-white hover:border-gray-300"
              )}
            />
            {errors?.phone && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errors.phone}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailsStep;
