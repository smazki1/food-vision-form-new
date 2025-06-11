import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNewItemForm, DishData } from '@/contexts/NewItemFormContext';
import { IconInput } from '@/components/ui/icon-input';
import { IconTextarea } from '@/components/ui/icon-textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { UploadCloud, Trash2, AlertTriangle, UtensilsCrossed, FileImage, Lightbulb, CheckCircle, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const CombinedUploadStep: React.FC<PublicStepProps> = ({ errors: externalErrors, clearExternalErrors }) => {
  const { formData, updateFormData, addDish, removeDish, updateDish, getDish } = useNewItemForm();
  const errors = externalErrors || {};
  const [qualityChecked, setQualityChecked] = useState(false);
  
  // Use dishes from context
  const dishes = formData.dishes;
  
  const [expandedDishes, setExpandedDishes] = useState<Set<string>>(new Set(['1']));
  const [activeDishId, setActiveDishId] = useState<string>('1');

  // Get current active dish
  const currentDish = getDish(activeDishId) || dishes[0];

  // Update legacy form data when current dish changes (for backward compatibility)
  React.useEffect(() => {
    if (currentDish) {
      updateFormData({
        itemType: currentDish.itemType,
        itemName: currentDish.itemName,
        description: currentDish.description,
        specialNotes: currentDish.specialNotes,
        referenceImages: currentDish.referenceImages,
        brandingMaterials: currentDish.brandingMaterials,
        referenceExamples: currentDish.referenceExamples
      });
    }
  }, [currentDish, updateFormData]);

  const updateCurrentDish = (updates: Partial<DishData>) => {
    updateDish(activeDishId, updates);
  };

  const addNewDish = () => {
    const newDishId = addDish();
    
    // Collapse current dish and expand new one
    setExpandedDishes(new Set([newDishId]));
    setActiveDishId(newDishId);
  };

  const removeDishHandler = (dishId: string) => {
    if (dishes.length <= 1) return; // Keep at least one dish
    
    removeDish(dishId);
    setExpandedDishes(prev => {
      const newSet = new Set(prev);
      newSet.delete(dishId);
      return newSet;
    });
    
    // Switch to first remaining dish if removing active dish
    if (dishId === activeDishId) {
      const remainingDish = dishes.find(d => d.id !== dishId);
      if (remainingDish) {
        setActiveDishId(remainingDish.id);
        setExpandedDishes(new Set([remainingDish.id]));
      }
    }
  };

  const toggleDish = (dishId: string) => {
    setExpandedDishes(prev => {
      const newSet = new Set<string>();
      if (prev.has(dishId)) {
        // Collapsing - don't add to set
      } else {
        // Expanding - add only this dish (accordion behavior)
        newSet.add(dishId);
        setActiveDishId(dishId);
      }
      return newSet;
    });
  };

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    const newFiles = [...currentDish.referenceImages];
    acceptedFiles.forEach(file => {
      if (!newFiles.find(f => f.name === file.name) && newFiles.length < 10) {
        newFiles.push(file);
      }
    });
    
    updateCurrentDish({ referenceImages: newFiles });

    if (fileRejections.length > 0) {
      console.warn("File rejections:", fileRejections);
    }
  }, [currentDish.referenceImages]);

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
    const newFiles = [...currentDish.referenceImages];
    newFiles.splice(index, 1);
    updateCurrentDish({ referenceImages: newFiles });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateCurrentDish({ [name]: value });
    
    if (errors && errors[name] && clearExternalErrors) {
      clearExternalErrors();
    }
  };

  // Handle item type selection for multiple dishes
  const handleItemTypeSelect = (type: string) => {
    if (type === 'other') {
      updateCurrentDish({ 
        isCustomItemType: true, 
        itemType: currentDish.customItemType || ''
      });
    } else {
      updateCurrentDish({ 
        isCustomItemType: false, 
        itemType: type,
        customItemType: ''
      });
    }
    
    if (errors?.itemType && clearExternalErrors) {
      clearExternalErrors();
    }
  };

  const handleCustomItemTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateCurrentDish({ 
      customItemType: value,
      itemType: value
    });
    
    if (errors?.itemType && clearExternalErrors) {
      clearExternalErrors();
    }
  };

  const getDishTitle = (dish: DishData) => {
    if (dish.itemName) return dish.itemName;
    if (dish.itemType) return dish.itemType;
    return `מנה ${dish.id}`;
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center">
          <UtensilsCrossed className="w-8 h-8 text-primary ml-3" />
          העלאת מנות ומוצרים
        </h2>
        <p className="text-gray-600 text-lg">
          מלאו את פרטי המנות שלכם והעלו תמונות איכותיות
        </p>
      </div>

      {/* Multiple Dishes Section */}
      <div className="space-y-4">
        {dishes.map((dish, index) => (
          <div key={dish.id} className="border border-gray-200 rounded-lg">
            {/* Dish Header - Always Visible */}
            <div 
              className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleDish(dish.id)}
            >
              <div className="flex items-center gap-3">
                <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </span>
                <h3 className="font-semibold text-gray-800">
                  {getDishTitle(dish)}
                </h3>
              </div>
              
              <div className="flex items-center gap-2">
                {dishes.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDishHandler(dish.id);
                    }}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
                
                {expandedDishes.has(dish.id) ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </div>

            {/* Dish Content - Expandable */}
            {expandedDishes.has(dish.id) && dish.id === activeDishId && (
              <div className="p-6 space-y-6">
                {/* Item Type Selection */}
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-700">
                    סוג הפריט <span className="text-red-500">*</span>
                  </label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'dish', label: 'מנה', icon: '🍽️' },
                      { value: 'drink', label: 'שתיה', icon: '🥤' },
                      { value: 'cocktail', label: 'קוקטייל', icon: '🍸' },
                      { value: 'other', label: 'אחר', icon: '🔖' }
                    ].map(option => (
                      <div key={option.value} className="relative">
                        <Checkbox
                          id={`${dish.id}-${option.value}`}
                          checked={
                            option.value === 'other' 
                              ? currentDish.isCustomItemType
                              : currentDish.itemType === option.value && !currentDish.isCustomItemType
                          }
                          onCheckedChange={() => handleItemTypeSelect(option.value)}
                          className="sr-only"
                        />
                        <Label
                          htmlFor={`${dish.id}-${option.value}`}
                          className={cn(
                            "flex items-center justify-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:border-primary/50 hover:bg-primary/5",
                            (option.value === 'other' ? currentDish.isCustomItemType : currentDish.itemType === option.value && !currentDish.isCustomItemType)
                              ? "border-primary bg-primary/10 text-primary font-semibold"
                              : "border-gray-200 bg-white text-gray-700"
                          )}
                        >
                          <span className="text-2xl">{option.icon}</span>
                          <span className="text-lg">{option.label}</span>
                        </Label>
                      </div>
                    ))}
                  </div>

                  {/* Custom Item Type Input */}
                  {currentDish.isCustomItemType && (
                    <div className="mt-4">
                      <input
                        type="text"
                        value={currentDish.customItemType}
                        onChange={handleCustomItemTypeChange}
                        placeholder="לדוגמה: קינוח, חטיף, ממתק"
                        className="w-full px-4 py-3 text-base border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 border-gray-200 focus:border-primary bg-white hover:border-gray-300"
                      />
                    </div>
                  )}

                  {errors?.itemType && (
                    <p className="text-xs text-red-500 mt-1">{errors.itemType}</p>
                  )}
                </div>

                {/* Item Name */}
                <IconInput
                  id={`itemName-${dish.id}`}
                  name="itemName"
                  label="שם הפריט"
                  value={currentDish.itemName}
                  onChange={handleChange}
                  placeholder="לדוגמה: סטייק אנטריקוט, קפה אספרסו"
                  required
                  error={errors?.itemName}
                />

                {/* Description */}
                <IconTextarea
                  id={`description-${dish.id}`}
                  name="description"
                  label="מרכיבים עיקריים (אופציונלי)"
                  value={currentDish.description}
                  onChange={handleChange}
                  placeholder="פרטו את המרכיבים העיקריים של הפריט"
                  rows={3}
                  error={errors?.description}
                />

                {/* Special Notes */}
                <IconTextarea
                  id={`specialNotes-${dish.id}`}
                  name="specialNotes"
                  label="הערות מיוחדות (אופציונלי)"
                  value={currentDish.specialNotes}
                  onChange={handleChange}
                  placeholder="כל מידע נוסף שחשוב שנדע"
                  rows={2}
                  error={errors?.specialNotes}
                />

                {/* Image Upload Section */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                    <FileImage className="w-6 h-6 text-primary ml-2" />
                    העלאת תמונות
                  </h3>

                  {/* Photography Tips */}
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-6">
                    <h4 className="text-lg font-medium text-blue-800 mb-4 flex items-center">
                      💡 טיפים לצילום מושלם
                    </h4>
                    <div className="space-y-3 text-blue-700">
                      {[
                        "וודאו שהתמונה ברורה ומוארת היטב - אור טבעי הוא הטוב ביותר",
                        "מרכזו את המנה בפוקוס ובמרכז התמונה",
                        "השתמשו ברקע נקי ופשוט שלא יסיח את הדעת מהמנה",
                        "צלמו מכמה זוויות שונות להצגה מגוונת של המנה",
                        "ודאו שהצבעים חיים ומושכים - זה מה שמושך לקוחות!"
                      ].map((tip, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <span className="text-blue-500 font-bold">•</span>
                          <p className="text-sm">{tip}</p>
                        </div>
                      ))}
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

                  {currentDish.referenceImages.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-700">תמונות שהועלו ({currentDish.referenceImages.length}/10)</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {currentDish.referenceImages.map((file, index) => (
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
        
        {/* Add Another Dish Button - Only for registered businesses (non-leads) */}
        {!formData.isLead && (
          <Button
            onClick={addNewDish}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            הוספת מנה נוספת
          </Button>
        )}
      </div>
    </div>
  );
};

export default CombinedUploadStep;
