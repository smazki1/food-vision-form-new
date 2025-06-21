import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { IconInput } from '@/components/ui/icon-input';
import { IconTextarea } from '@/components/ui/icon-textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { StepProps } from '../FoodVisionUploadForm';
import { UploadCloud, Trash2, AlertTriangle, Sparkles, FileImage, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const CombinedUploadStep: React.FC<StepProps> = ({ errors: externalErrors, clearExternalErrors }) => {
  const { formData, updateFormData, addDish, updateDish, getDish, removeDish } = useNewItemForm();
  const errors = externalErrors || {};
  const [activeDishId, setActiveDishId] = useState('1');
  const [expandedDishes, setExpandedDishes] = useState<Set<string>>(new Set(['1']));

    // Update current dish data when formData changes
  useEffect(() => {
    if (activeDishId) {
      updateDish(activeDishId, {
        itemName: formData.itemName,
        itemType: formData.itemType,
        description: formData.description,
        specialNotes: formData.specialNotes,
        referenceImages: formData.referenceImages
      });
    }
  }, [formData.itemName, formData.itemType, formData.description, formData.specialNotes, formData.referenceImages, activeDishId, updateDish]);

  // Ensure new dishes are properly expanded
  useEffect(() => {
    if (activeDishId && !expandedDishes.has(activeDishId)) {
      setExpandedDishes(new Set([activeDishId]));
    }
  }, [activeDishId, expandedDishes]);

  const handleAddAnotherDish = () => {
    const newDishId = addDish();
    
    // Immediately set the new dish as active and expanded
    setActiveDishId(newDishId);
    setExpandedDishes(new Set([newDishId]));
    
    // Update form with empty data for new dish
    updateFormData({
      itemName: '',
      itemType: '',
      description: '',
      specialNotes: '',
      referenceImages: []
    });
  };

  const handleDishToggle = (dishId: string) => {
    const isExpanded = expandedDishes.has(dishId);
    
    if (isExpanded) {
      // Collapse this dish
      const newExpanded = new Set(expandedDishes);
      newExpanded.delete(dishId);
      setExpandedDishes(newExpanded);
    } else {
      // Expand this dish and collapse others
      setExpandedDishes(new Set([dishId]));
      setActiveDishId(dishId);
      
      // Load dish data into form
      const dishData = getDish(dishId);
      if (dishData) {
        updateFormData({
          itemName: dishData.itemName,
          itemType: dishData.itemType,
          description: dishData.description,
          specialNotes: dishData.specialNotes,
          referenceImages: dishData.referenceImages
        });
      }
    }
  };

  const handleRemoveDish = (dishId: string) => {
    removeDish(dishId);
    
    // If we're removing the active dish, switch to another dish
    if (dishId === activeDishId) {
      const remainingDishes = formData.dishes.filter(d => d.id !== dishId);
      if (remainingDishes.length > 0) {
        const newActiveDish = remainingDishes[0];
        setActiveDishId(newActiveDish.id);
        setExpandedDishes(new Set([newActiveDish.id]));
        
        // Load the new active dish data
        updateFormData({
          itemName: newActiveDish.itemName,
          itemType: newActiveDish.itemType,
          description: newActiveDish.description,
          specialNotes: newActiveDish.specialNotes,
          referenceImages: newActiveDish.referenceImages
        });
      }
    }
  };

  const showAddButton = formData.referenceImages.length > 0;

  const inputRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  // Basic item type suggestions
  const itemTypeSuggestions = [
    'מנה', 'משקה', 'קינוח', 'אחר'
  ];

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    const newFiles = [...formData.referenceImages];
    acceptedFiles.forEach(file => {
      if (!newFiles.find(f => f.name === file.name) && newFiles.length < 10) {
        newFiles.push(file);
      }
    });
    updateFormData({ referenceImages: newFiles });

    if (fileRejections.length > 0) {
      console.warn("File rejections:", fileRejections);
    }
  }, [formData.referenceImages, updateFormData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxSize: 20 * 1024 * 1024,
    maxFiles: 10,
  });

  const removeImage = (index: number) => {
    const newFiles = [...formData.referenceImages];
    newFiles.splice(index, 1);
    updateFormData({ referenceImages: newFiles });
  };

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
    
    if (errors.itemType && clearExternalErrors) {
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

  const handleSuggestionClick = (suggestion: string) => {
    updateFormData({ itemType: suggestion });
    setShowSuggestions(false);
    if (errors.itemType && clearExternalErrors) {
      clearExternalErrors();
    }
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
    <div className="space-y-4" dir="rtl">

      {/* Dish Accordions */}
      {formData.dishes.map((dish) => (
        <div key={dish.id} className="border border-gray-200 rounded-xl overflow-hidden">
          {/* Dish Header */}
          <button
            type="button"
            onClick={() => handleDishToggle(dish.id)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ChevronDown 
                className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                  expandedDishes.has(dish.id) ? 'rotate-180' : ''
                }`} 
              />
              <span className="font-medium text-gray-800">
                מנה {dish.id}: {dish.itemName || 'מנה חדשה'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {dish.referenceImages.length} תמונות
              </span>
              {parseInt(dish.id) > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveDish(dish.id);
                  }}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  הסר
                </Button>
              )}
            </div>
          </button>

          {/* Dish Content */}
          {expandedDishes.has(dish.id) && dish.id === activeDishId && (
            <div className="p-6 space-y-6">
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
          {errors?.itemName && (
            <p className="text-xs text-red-500 mt-1">{errors.itemName}</p>
          )}

          <div className="space-y-3 relative">
            <Label className="text-base font-medium text-gray-700">
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
                placeholder="לדוגמה: מנה, משקה, קינוח, אחר..."
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

      {/* Image Upload Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
          <FileImage className="w-6 h-6 text-primary ml-2" />
          העלאת תמונות
        </h3>

        {/* Important Information Section */}
        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 mb-6">
          <h4 className="text-lg font-medium text-yellow-800 mb-4 flex items-center">
            חשוב לדעת:
          </h4>
          <div className="space-y-3 text-yellow-700">
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 font-bold">•</span>
              <p className="text-sm"><strong>מה שאתם מעלים = מה שאתם מקבלים (בעיצוב מקצועי)</strong></p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 font-bold">•</span>
              <p className="text-sm">אנחנו משפרים את התמונה של המנות שלכם, לא את המנות עצמן. המנה בתמונה שלכם = המנה בתוצאה הסופית.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 font-bold">•</span>
              <p className="text-sm">לתוצאה הטובה ביותר, וודאו שהמנה בתמונה נראית כמו שאתם רוצים להציג ללקוחות - אנחנו נדאג לתאורה מקצועית, רקע מושלם ועיצוב מדהים.</p>
            </div>
          </div>
        </div>
        
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 md:p-12 text-center cursor-pointer transition-all duration-200 ease-in-out",
            "flex flex-col items-center justify-center min-h-[200px] md:min-h-[250px]",
            isDragActive ? 'border-primary bg-primary/10 ring-2 ring-primary/50' : 'border-gray-300 hover:border-primary/70 hover:bg-gray-50/50'
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud className={cn("h-12 w-12 md:h-16 md:w-16 mb-4", isDragActive ? "text-primary" : "text-gray-400")} />
          <p className="text-base md:text-lg font-medium text-gray-700 mb-1">
            {isDragActive ? 'שחררו כאן את הקבצים' : 'גררו לכאן תמונות או לחצו לבחירה'}
          </p>
          <p className="text-xs md:text-sm text-muted-foreground">
            תומך ב-JPG, PNG, WEBP (מקסימום 20MB לתמונה, עד 10 תמונות)
          </p>
        </div>

        {errors?.referenceImages && (
          <div className="flex items-center text-sm text-red-600 mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertTriangle className="h-4 w-4 mr-2 shrink-0" />
            <span>{errors.referenceImages}</span>
          </div>
        )}

        {formData.referenceImages.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-700">תמונות שהועלו ({formData.referenceImages.length}/10)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {formData.referenceImages.map((file, index) => (
                <div key={index}
                     className="relative group aspect-square bg-gray-100 rounded-lg shadow-sm overflow-hidden border border-gray-200">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`תצוגה מקדימה ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onLoad={() => URL.revokeObjectURL(file.name)}
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={(e) => { e.preventDefault(); removeImage(index); }}
                      aria-label="הסרת תמונה"
                      className="rounded-full h-9 w-9 md:h-10 md:w-10"
                    >
                      <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add Another Dish Button */}
      {showAddButton && (
        <div className="text-center">
          <Button
            type="button"
            onClick={handleAddAnotherDish}
            className="bg-[#F3752B] hover:bg-[#F3752B]/90 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            הוספת מנה נוספת
          </Button>
        </div>
      )}

      {/* Contact Details Section */}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <Sparkles className="w-6 h-6 text-primary ml-2" />
          פרטי יצירת קשר
        </h3>
        
        <div className="space-y-6">
          <IconInput
            id="restaurantName"
            name="restaurantName"
            label="שם המסעדה / העסק"
            value={formData.restaurantName}
            onChange={handleChange}
            placeholder="לדוגמה: מסעדת השף הקטן"
            error={errors?.restaurantName}
            iconPosition="right"
            required
          />

          <IconInput
            id="submitterName"
            name="submitterName"
            label="שם איש הקשר"
            value={formData.submitterName}
            onChange={handleChange}
            placeholder="שם מלא של המגיש"
            error={errors?.submitterName}
            iconPosition="right"
            required
          />
        </div>
      </div>
    </div>
  );
};

export default CombinedUploadStep;
