import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { IconInput } from '@/components/ui/icon-input';
import { IconTextarea } from '@/components/ui/icon-textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { StepProps } from '../FoodVisionUploadForm';
import { UploadCloud, Trash2, AlertTriangle, Sparkles, FileImage, ChevronDown, Plus, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useClientProfile } from '@/hooks/useClientProfile';
import { useLocation } from 'react-router-dom';

const CombinedUploadStep: React.FC<StepProps> = ({ errors: externalErrors, clearExternalErrors }) => {
  const { formData, updateFormData, addDish, updateDish, getDish, removeDish } = useNewItemForm();
  const location = useLocation();
  const { user } = useUnifiedAuth();
  const { clientProfile } = useClientProfile(user?.id);
  const errors = externalErrors || {};
  const [activeDishId, setActiveDishId] = useState('1');
  const [expandedDishes, setExpandedDishes] = useState<Set<string>>(new Set(['1']));
  const [qualityConfirmed, setQualityConfirmed] = useState(false);

  // Custom Style State Management
  const [showCustomStyle, setShowCustomStyle] = useState(false);

  // Custom Style Functions
  const handleCustomStyleToggle = () => {
    if (showCustomStyle) {
      setShowCustomStyle(false);
      updateFormData({ 
        customStyle: undefined 
      });
    } else {
      setShowCustomStyle(true);
      updateFormData({ 
        customStyle: {
          inspirationImages: [],
          brandingMaterials: [],
          instructions: ''
        }
      });
    }
  };

  const handleCustomStyleChange = (field: string, value: any) => {
    if (formData.customStyle) {
      updateFormData({
        customStyle: {
          ...formData.customStyle,
          [field]: value
        }
      });
    }
  };

  const handleFileUpload = (field: 'inspirationImages' | 'brandingMaterials', files: FileList | null) => {
    if (files && formData.customStyle) {
      const newFiles = Array.from(files);
      handleCustomStyleChange(field, [...formData.customStyle[field], ...newFiles]);
    }
  };

  const removeFile = (field: 'inspirationImages' | 'brandingMaterials', index: number) => {
    if (formData.customStyle) {
      const updatedFiles = [...formData.customStyle[field]];
      updatedFiles.splice(index, 1);
      handleCustomStyleChange(field, updatedFiles);
    }
  };

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

  // Load quality confirmation state from localStorage
  useEffect(() => {
    const savedQualityConfirmed = localStorage.getItem('imageQualityConfirmed');
    if (savedQualityConfirmed === 'true') {
      setQualityConfirmed(true);
    }
  }, []);

  // Prefill and hide contact details for customer upload flow
  const isCustomerUploadRoute = location.pathname.startsWith('/customer/upload');
  useEffect(() => {
    if (!isCustomerUploadRoute || !clientProfile) return;
    const updates: Record<string, any> = {};
    const profileRestaurant = clientProfile.restaurant_name || '';
    const profileContact = clientProfile.contact_name || '';
    if (!formData.restaurantName || formData.restaurantName !== profileRestaurant) {
      updates.restaurantName = profileRestaurant;
    }
    if (!formData.submitterName || formData.submitterName !== profileContact) {
      updates.submitterName = profileContact;
    }
    if (Object.keys(updates).length > 0) {
      updateFormData(updates);
    }
  }, [isCustomerUploadRoute, clientProfile, formData.restaurantName, formData.submitterName, updateFormData]);

  const handleAddAnotherDish = () => {
    const newDishId = addDish();
    
    // Immediately set the new dish as active and expanded
    setActiveDishId(newDishId);
    setExpandedDishes(new Set([newDishId]));
    
    // Reset quality confirmation state
    setQualityConfirmed(false);
    localStorage.setItem('imageQualityConfirmed', 'false');
    
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

  // Remove the old showAddButton logic as we're using the new toggle pattern

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

      {/* Important Information Section - Full Width */}
      <div className="bg-gradient-to-r from-[#8B1E3F]/10 to-[#F3752B]/10 border-2 border-[#8B1E3F]/20 rounded-xl p-4 sm:p-6 mb-6 -mx-10 md:-mx-14">
        <div className="flex items-center gap-3 mb-3 sm:mb-4">
          <div className="bg-[#F3752B] text-white rounded-full p-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-[#8B1E3F]">חשוב לדעת:</h3>
        </div>
        
        <div className="space-y-2 sm:space-y-3 text-gray-700 mb-4 sm:mb-6">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[#F3752B] rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-sm sm:text-base font-medium">מה שאתם מעלים = מה שאתם מקבלים (בעיצוב מקצועי)</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[#F3752B] rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-sm sm:text-base font-medium">אנחנו משפרים את התמונה של המנות שלכם, לא את המנות עצמן. המנה בתמונה שלכם = המנה בתוצאה הסופית.</p>
          </div>
        </div>

        {/* Mobile-Optimized Before/After Example */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 sm:p-8 shadow-lg border-2 border-gray-200">
          {/* Good Example */}
          <h4 className="text-xl sm:text-2xl font-bold text-center text-[#333333] mb-4 sm:mb-8">דוגמה טובה:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 mb-8">
            <div className="text-center">
              <div className="relative mb-3 sm:mb-4">
                <img 
                  src="/lovable-uploads/CleanShot 2025-06-22 at 21.29.33@2x.png" 
                  alt="תמונה לפני עיבוד - דוגמה טובה" 
                  className="w-full h-auto object-contain rounded-xl shadow-lg bg-white p-2"
                />
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-red-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                  לפני
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-700 font-semibold">התמונה המקורית שהעלה הלקוח</p>
            </div>
            <div className="text-center">
              <div className="relative mb-3 sm:mb-4">
                <img 
                  src="/lovable-uploads/בורגר.png" 
                  alt="תמונה אחרי עיבוד - דוגמה טובה" 
                  className="w-full h-auto object-contain rounded-xl shadow-lg bg-white p-2"
                />
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-green-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                  אחרי
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-700 font-semibold">התוצאה המקצועית שלנו</p>
            </div>
          </div>

          {/* Bad Example */}
          <h4 className="text-xl sm:text-2xl font-bold text-center text-[#333333] mb-4 sm:mb-8">דוגמה לא טובה:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            <div className="text-center">
              <div className="relative mb-3 sm:mb-4">
                <img 
                  src="/lovable-uploads/bad-example-before.jpeg" 
                  alt="תמונה לפני עיבוד - דוגמה לא טובה" 
                  className="w-full h-auto object-contain rounded-xl shadow-lg bg-white p-2"
                />
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-red-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                  לפני
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-700 font-semibold">התמונה המקורית שהעלה הלקוח</p>
            </div>
            <div className="text-center">
              <div className="relative mb-3 sm:mb-4">
                <img 
                  src="/lovable-uploads/bad-example-after.png" 
                  alt="תמונה אחרי עיבוד - דוגמה לא טובה" 
                  className="w-full h-auto object-contain rounded-xl shadow-lg bg-white p-2"
                />
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-green-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                  אחרי
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-700 font-semibold">התוצאה המקצועית שלנו</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dish Accordions */}
      {formData.dishes && formData.dishes.map((dish) => (
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

        {/* Quality Confirmation and Add Another Dish Toggle */}
        {formData.referenceImages.length > 0 && (
          <div className="space-y-6">
            {/* Quality Confirmation Checkbox */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
              <div className="flex items-start space-x-3 space-x-reverse">
                <Checkbox
                  id="qualityConfirmation"
                  checked={qualityConfirmed}
                  onCheckedChange={(checked) => {
                    const isChecked = checked === true;
                    setQualityConfirmed(isChecked);
                    // Store in localStorage for persistence
                    localStorage.setItem('imageQualityConfirmed', isChecked.toString());
                  }}
                />
                <div className="space-y-1">
                  <Label 
                    htmlFor="qualityConfirmation"
                    className="text-sm font-medium text-blue-800 cursor-pointer"
                  >
                    וידאתי שהתמונות ברורות ומובנות
                  </Label>
                  <p className="text-xs text-blue-600">
                    תמונות ברורות ומובנות מבטיחות תוצאות טובות יותר
                  </p>
                </div>
              </div>
            </div>

            {/* Add Another Dish Toggle Section */}
            {qualityConfirmed && (
              <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                <div className="text-center space-y-4">
                  <h4 className="text-lg font-semibold text-green-800">
                    רוצים להעלות מנה נוספת?
                  </h4>
                  <p className="text-green-700 text-sm">
                    תוכלו להעלות מנה נוספת עם תמונות ופרטים נפרדים
                  </p>
                  <Button
                    type="button"
                    onClick={handleAddAnotherDish}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    הוספת מנה נוספת
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

                </div>
            </div>
          )}
        </div>
      ))}

      {/* Custom Style Toggle - Prominent Position */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[#8B1E3F] to-[#F3752B] rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">סגנון מותאם אישית</h3>
              <p className="text-sm text-gray-600 mt-1">העלה תמונות השראה וחומרי מיתוג ליצירת סגנון ייחודי עבור המנות שלך</p>
            </div>
          </div>
          <Button
            variant={showCustomStyle ? "default" : "outline"}
            onClick={handleCustomStyleToggle}
            className={cn(
              "min-w-[140px] px-6 py-3 text-base font-medium transition-all duration-300 rounded-lg",
              showCustomStyle 
                ? "bg-[#8B1E3F] hover:bg-[#7A1B39] text-white shadow-lg transform scale-105" 
                : "border-2 border-[#8B1E3F] text-[#8B1E3F] hover:bg-[#8B1E3F] hover:text-white hover:shadow-md"
            )}
          >
            {showCustomStyle ? (
              <>
                <X className="h-5 w-5 ml-2" />
                סגור סגנון
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 ml-2" />
                הפעל סגנון
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Custom Style Section */}
      {showCustomStyle && (
        <div className="bg-white border-2 border-[#8B1E3F]/20 rounded-xl p-8 mb-6 shadow-lg">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-[#8B1E3F] mb-3 flex items-center">
              <Sparkles className="w-7 h-7 text-[#F3752B] ml-3" />
              עיצוב הסגנון שלך
            </h3>
            <p className="text-gray-600 text-lg">צור סגנון ייחודי המותאם במיוחד לעסק שלך ולאופי המנות</p>
          </div>

          <div className="space-y-8">
            {/* Inspiration Images */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <label className="block text-xl font-semibold text-[#333333] mb-4 flex items-center">
                <FileImage className="w-6 h-6 text-blue-600 ml-2" />
                תמונות השראה
              </label>
              <p className="text-gray-600 mb-4">העלה תמונות שמשקפות את הסגנון והאווירה הרצויים</p>
              
              <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center hover:border-[#F3752B] hover:bg-blue-25 transition-all duration-300">
                <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <p className="text-gray-700 mb-3 text-lg font-medium">גרור תמונות לכאן או לחץ לבחירה</p>
                <p className="text-sm text-gray-500 mb-4">תמונות השראה, דוגמאות מהרשת, סגנונות שאהבת</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload('inspirationImages', e.target.files)}
                  className="hidden"
                  id="inspiration-upload"
                />
                <label
                  htmlFor="inspiration-upload"
                  className="inline-block bg-[#F3752B] text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-[#e56b26] transition-colors font-medium text-base shadow-md hover:shadow-lg"
                >
                  בחר תמונות השראה
                </label>
              </div>
              
              {formData.customStyle?.inspirationImages && formData.customStyle.inspirationImages.length > 0 && (
                <div className="mt-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {formData.customStyle.inspirationImages.map((file, index) => (
                      <div key={index} className="relative group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`השראה ${index + 1}`}
                          className="w-full h-28 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile('inspirationImages', index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-base text-blue-700 font-medium bg-blue-100 rounded-lg p-3">
                    ✓ נבחרו {formData.customStyle.inspirationImages.length} תמונות השראה
                  </div>
                </div>
              )}
            </div>

            {/* Branding Materials */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <label className="block text-xl font-semibold text-[#333333] mb-4 flex items-center">
                <Upload className="w-6 h-6 text-purple-600 ml-2" />
                חומרי מיתוג
              </label>
              <p className="text-gray-600 mb-4">העלה את הלוגו, צבעי המותג ופרטי העיצוב של העסק</p>
              
              <div className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center hover:border-[#F3752B] hover:bg-purple-25 transition-all duration-300">
                <FileImage className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <p className="text-gray-700 mb-3 text-lg font-medium">העלה חומרי מיתוג</p>
                <p className="text-sm text-gray-500 mb-4">לוגו, צבעי המותג, פונטים, מדריך עיצוב</p>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload('brandingMaterials', e.target.files)}
                  className="hidden"
                  id="branding-upload"
                />
                <label
                  htmlFor="branding-upload"
                  className="inline-block bg-[#8B1E3F] text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-[#7A1B39] transition-colors font-medium text-base shadow-md hover:shadow-lg"
                >
                  בחר קבצי מיתוג
                </label>
              </div>
              
              {formData.customStyle?.brandingMaterials && formData.customStyle.brandingMaterials.length > 0 && (
                <div className="mt-6">
                  <div className="space-y-3">
                    {formData.customStyle.brandingMaterials.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-4 rounded-lg border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center border border-purple-200">
                            {file.type.includes('image') ? (
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <FileImage className="w-6 h-6 text-purple-600" />
                            )}
                          </div>
                          <div>
                            <span className="text-base font-medium text-gray-800 block">{file.name}</span>
                            <span className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile('brandingMaterials', index)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-base text-purple-700 font-medium bg-purple-100 rounded-lg p-3">
                    ✓ נבחרו {formData.customStyle.brandingMaterials.length} קבצי מיתוג
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
              <label className="block text-xl font-semibold text-[#333333] mb-4 flex items-center">
                <Sparkles className="w-6 h-6 text-green-600 ml-2" />
                הוראות מיוחדות וחזון עיצובי
              </label>
              <p className="text-gray-600 mb-4">תאר במילים את הסגנון, האווירה והתחושה שאתה רוצה להעביר</p>
              <textarea
                value={formData.customStyle?.instructions || ''}
                onChange={(e) => handleCustomStyleChange('instructions', e.target.value)}
                placeholder="לדוגמה: 'אני רוצה סגנון מינימליסטי ונקי עם צבעים חמים. החזון שלי הוא להעביר תחושה של בית ונוחות. אני אוהב רקעים פשוטים עם תאורה טבעית. חשוב לי שהמנות יבלטו על רקע לא עמוס...'"
                className="w-full p-6 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-[#F3752B] focus:border-[#F3752B] resize-none text-base leading-relaxed transition-all duration-200"
                rows={6}
              />
              <div className="mt-3 text-sm text-green-700 bg-green-100 rounded-lg p-3">
                💡 <strong>טיפ:</strong> ככל שתהיה יותר מפורט, כך נוכל ליצור בשבילך תוצאה מדויקת יותר
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Details Section - hidden for customer upload (prefilled from profile) */}
      {!isCustomerUploadRoute && (
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
      )}
    </div>
  );
};

export default CombinedUploadStep;
