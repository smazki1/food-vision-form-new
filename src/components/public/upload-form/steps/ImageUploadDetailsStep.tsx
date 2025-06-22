
import React from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { Button } from '@/components/ui/button';
import { Upload, X, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadDetailsStepProps {
  errors: Record<string, string>;
  clearErrors: () => void;
}

const ImageUploadDetailsStep: React.FC<ImageUploadDetailsStepProps> = ({ errors, clearErrors }) => {
  const { formData, updateFormData, addDish, removeDish, updateDish } = useNewItemForm();

  const handleContactChange = (field: string, value: string) => {
    updateFormData({ [field]: value });
    if (errors[field]) clearErrors();
  };

  const handleImageUpload = (dishId: string, files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files);
    const dish = formData.dishes.find(d => d.id === dishId);
    if (dish) {
      const updatedImages = [...dish.referenceImages, ...newFiles];
      updateDish(dishId, { referenceImages: updatedImages.slice(0, 5) });
    }
  };

  const removeImage = (dishId: string, imageIndex: number) => {
    const dish = formData.dishes.find(d => d.id === dishId);
    if (dish) {
      const updatedImages = dish.referenceImages.filter((_, index) => index !== imageIndex);
      updateDish(dishId, { referenceImages: updatedImages });
    }
  };

  const handleDishChange = (dishId: string, field: string, value: string) => {
    updateDish(dishId, { [field]: value });
    if (errors[`dish-${dishId}-${field}`]) clearErrors();
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#333333] mb-4">העלאת מנות</h1>
        <p className="text-gray-600">העלו את המנות שלכם וקבלו תמונות מקצועיות</p>
      </div>

      {/* Important Information Box */}
      <div className="bg-gradient-to-r from-[#8B1E3F]/10 to-[#F3752B]/10 border-2 border-[#8B1E3F]/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-[#F3752B] text-white rounded-full p-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[#8B1E3F]">חשוב לדעת:</h3>
        </div>
        
        <div className="space-y-3 text-gray-700 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[#F3752B] rounded-full mt-2 flex-shrink-0"></div>
            <p className="font-medium">מה שאתם מעלים = מה שאתם מקבלים (בעיצוב מקצועי)</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[#F3752B] rounded-full mt-2 flex-shrink-0"></div>
            <p className="font-medium">אנחנו משפרים את התמונה של המנות שלכם, לא את המנות עצמן. המנה בתמונה שלכם = המנה בתוצאה הסופית.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[#F3752B] rounded-full mt-2 flex-shrink-0"></div>
            <p className="font-medium">לתוצאה הטובה ביותר, וודאו שהמנה בתמונה נראית כמו שאתם רוצים להציג ללקוחות - אנחנו נדאג לתאורה מקצועית, רקע מושלם ועיצוב מדהים.</p>
          </div>
          </div>

        {/* Before/After Example */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h4 className="text-lg font-semibold text-center text-[#333333] mb-4">דוגמה לפני ואחרי:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="relative mb-3">
                <img 
                  src="/lovable-uploads/IMG_D76A6032ABB8-1.jpeg" 
                  alt="תמונה לפני עיבוד" 
                  className="w-full h-48 object-cover rounded-lg shadow-md"
                />
                <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  לפני
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium">התמונה המקורית שהעלה הלקוח</p>
            </div>
            <div className="text-center">
              <div className="relative mb-3">
                <img 
                  src="/lovable-uploads/26889960-2 (2).jpg" 
                  alt="תמונה אחרי עיבוד" 
                  className="w-full h-48 object-cover rounded-lg shadow-md"
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  אחרי
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium">התוצאה המקצועית שלנו</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dishes Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-[#333333]">המנות שלכם</h3>
          <Button
            type="button"
            onClick={addDish}
            className="bg-[#F3752B] hover:bg-orange-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            הוסף מנה
          </Button>
        </div>

        {formData.dishes.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">עדיין לא הוספתם מנות</p>
            <Button
              type="button"
              onClick={addDish}
              className="bg-[#F3752B] hover:bg-orange-600 text-white"
            >
              הוסף מנה ראשונה
            </Button>
          </div>
        )}

        {formData.dishes.map((dish, index) => (
          <div key={dish.id} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold text-[#333333]">מנה {index + 1}</h4>
              {formData.dishes.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeDish(dish.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">שם המנה *</label>
                <input
                  type="text"
                  value={dish.itemName}
                  onChange={(e) => handleDishChange(dish.id, 'itemName', e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#F3752B] focus:border-transparent",
                    errors[`dish-${index}-name`] ? "border-red-500" : "border-gray-300"
                  )}
                  placeholder="שם המנה"
                />
                {errors[`dish-${index}-name`] && <p className="text-red-500 text-xs mt-1">{errors[`dish-${index}-name`]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">סוג המנה *</label>
                <select
                  value={dish.itemType}
                  onChange={(e) => handleDishChange(dish.id, 'itemType', e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#F3752B] focus:border-transparent",
                    errors[`dish-${index}-type`] ? "border-red-500" : "border-gray-300"
                  )}
                >
                  <option value="">בחר סוג מנה</option>
                  <option value="מנה עיקרית">מנה עיקרית</option>
                  <option value="מנה ראשונה">מנה ראשונה</option>
                  <option value="קינוח">קינוח</option>
                  <option value="שתיה">שתיה</option>
                  <option value="אחר">אחר</option>
                </select>
                {errors[`dish-${index}-type`] && <p className="text-red-500 text-xs mt-1">{errors[`dish-${index}-type`]}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">תיאור המנה *</label>
              <textarea
                value={dish.description}
                onChange={(e) => handleDishChange(dish.id, 'description', e.target.value)}
                rows={3}
                className={cn(
                  "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#F3752B] focus:border-transparent",
                  errors[`dish-${index}-description`] ? "border-red-500" : "border-gray-300"
                )}
                placeholder="תארו את המנה, מרכיבים עיקריים..."
              />
              {errors[`dish-${index}-description`] && <p className="text-red-500 text-xs mt-1">{errors[`dish-${index}-description`]}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">הערות מיוחדות</label>
              <textarea
                value={dish.specialNotes || ''}
                onChange={(e) => handleDishChange(dish.id, 'specialNotes', e.target.value)}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F3752B] focus:border-transparent"
                placeholder="הערות נוספות..."
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">תמונות המנה * (עד 5 תמונות)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">גרור תמונות לכאן או לחץ לבחירה</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(dish.id, e.target.files)}
                  className="hidden"
                  id={`file-upload-${dish.id}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById(`file-upload-${dish.id}`)?.click()}
                >
                  בחר תמונות
                </Button>
              </div>
              {errors[`dish-${index}-images`] && <p className="text-red-500 text-xs mt-1">{errors[`dish-${index}-images`]}</p>}

              {dish.referenceImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {dish.referenceImages.map((file, imageIndex) => (
                    <div key={imageIndex} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`תצוגה מקדימה ${imageIndex + 1}`}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(dish.id, imageIndex)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {errors.dishes && <p className="text-red-500 text-sm">{errors.dishes}</p>}
      </div>

      {/* Contact Information - Moved to bottom */}
      <div className="bg-gray-50 p-6 rounded-xl space-y-4">
        <h3 className="text-xl font-semibold text-[#333333] mb-4">פרטי התקשרות</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">שם העסק *</label>
            <input
              type="text"
              value={formData.restaurantName}
              onChange={(e) => handleContactChange('restaurantName', e.target.value)}
              className={cn(
                "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#F3752B] focus:border-transparent",
                errors.restaurantName ? "border-red-500" : "border-gray-300"
              )}
              placeholder="שם המסעדה או העסק"
            />
            {errors.restaurantName && <p className="text-red-500 text-xs mt-1">{errors.restaurantName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">שם איש קשר *</label>
            <input
              type="text"
              value={formData.submitterName}
              onChange={(e) => handleContactChange('submitterName', e.target.value)}
              className={cn(
                "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#F3752B] focus:border-transparent",
                errors.submitterName ? "border-red-500" : "border-gray-300"
              )}
              placeholder="שם מלא"
            />
            {errors.submitterName && <p className="text-red-500 text-xs mt-1">{errors.submitterName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">טלפון *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleContactChange('phone', e.target.value)}
              className={cn(
                "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#F3752B] focus:border-transparent",
                errors.phone ? "border-red-500" : "border-gray-300"
              )}
              placeholder="050-1234567"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">אימייל</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleContactChange('email', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F3752B] focus:border-transparent"
              placeholder="email@example.com"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadDetailsStep;
