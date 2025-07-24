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
    <div className="space-y-8 sm:space-y-12">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#F3752B] to-[#FF8B47] rounded-full mb-4 sm:mb-6 shadow-lg">
          <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-[#333333] mb-3 sm:mb-4 px-2">העלאת מנות</h1>
        <p className="text-gray-600 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed px-4">
          העלו את המנות שלכם וקבלו תמונות מקצועיות מדהימות תוך 48 שעות
        </p>
      </div>

      {/* Mobile-Optimized Important Information Box */}
      <div className="bg-gradient-to-r from-[#8B1E3F]/10 to-[#F3752B]/10 border-2 border-[#8B1E3F]/20 rounded-xl p-4 sm:p-6">
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

      {/* Mobile-Optimized Dishes Section */}
      <div className="space-y-6 sm:space-y-8">
        <div className="text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-[#333333] mb-3 sm:mb-4">המנות שלכם</h3>
          <p className="text-gray-600 text-base sm:text-lg mb-4 sm:mb-6 px-4">הוסיפו את המנות שברצונכם לעצב</p>
          <Button
            type="button"
            onClick={addDish}
            size="lg"
            className="bg-gradient-to-r from-[#F3752B] to-[#FF8B47] hover:from-[#E56B26] hover:to-[#F3752B] text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            הוסף מנה חדשה
          </Button>
        </div>

        {formData.dishes.length === 0 && (
          <div className="text-center py-8 sm:py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full mb-3 sm:mb-4">
              <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-base sm:text-lg mb-4 sm:mb-6 px-4">עדיין לא הוספתם/ן מנות</p>
            <Button
              type="button"
              onClick={addDish}
              size="lg"
              className="bg-gradient-to-r from-[#F3752B] to-[#FF8B47] hover:from-[#E56B26] hover:to-[#F3752B] text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base"
            >
              הוסף מנה ראשונה
            </Button>
          </div>
        )}

        {formData.dishes.map((dish, index) => (
          <div key={dish.id} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-4 sm:p-8 space-y-4 sm:space-y-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#8B1E3F] to-[#A52A44] rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg">
                  {index + 1}
                </div>
                <h4 className="text-xl sm:text-2xl font-bold text-[#333333]">מנה {index + 1}</h4>
              </div>
              {formData.dishes.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeDish(dish.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-2 border-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 rounded-xl p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-3">שם המנה *</label>
                <input
                  type="text"
                  value={dish.itemName}
                  onChange={(e) => handleDishChange(dish.id, 'itemName', e.target.value)}
                  className={cn(
                    "w-full px-4 sm:px-5 py-3 sm:py-4 border-2 rounded-xl focus:ring-4 focus:ring-[#F3752B]/20 focus:border-[#F3752B] transition-all duration-300 text-base sm:text-lg",
                    errors[`dish-${index}-name`] ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                  )}
                  placeholder="לדוגמה: המבורגר טרופי"
                />
                {errors[`dish-${index}-name`] && <p className="text-red-500 text-sm mt-2 font-medium">{errors[`dish-${index}-name`]}</p>}
              </div>

              <div>
                <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-3">סוג המנה *</label>
                <select
                  value={dish.itemType}
                  onChange={(e) => handleDishChange(dish.id, 'itemType', e.target.value)}
                  className={cn(
                    "w-full px-4 sm:px-5 py-3 sm:py-4 border-2 rounded-xl focus:ring-4 focus:ring-[#F3752B]/20 focus:border-[#F3752B] transition-all duration-300 text-base sm:text-lg",
                    errors[`dish-${index}-type`] ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                  )}
                >
                  <option value="">בחר סוג מנה</option>
                  <option value="מנה עיקרית">מנה עיקרית</option>
                  <option value="מנה ראשונה">מנה ראשונה</option>
                  <option value="קינוח">קינוח</option>
                  <option value="משקה">משקה</option>
                  <option value="סלט">סלט</option>
                  <option value="מאפה">מאפה</option>
                  <option value="פיצה">פיצה</option>
                  <option value="המבורגר">המבורגר</option>
                  <option value="סנדוויץ'">סנדוויץ'</option>
                  <option value="אחר">אחר</option>
                </select>
                {errors[`dish-${index}-type`] && <p className="text-red-500 text-sm mt-2 font-medium">{errors[`dish-${index}-type`]}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-3">תיאור המנה *</label>
              <textarea
                value={dish.description}
                onChange={(e) => handleDishChange(dish.id, 'description', e.target.value)}
                rows={3}
                className={cn(
                  "w-full px-4 sm:px-5 py-3 sm:py-4 border-2 rounded-xl focus:ring-4 focus:ring-[#F3752B]/20 focus:border-[#F3752B] transition-all duration-300 text-base sm:text-lg resize-none",
                  errors[`dish-${index}-description`] ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                )}
                placeholder="תארו את המנה - מה יש בה, איך היא מוגשת, מה מיוחד בה..."
              />
              {errors[`dish-${index}-description`] && <p className="text-red-500 text-sm mt-2 font-medium">{errors[`dish-${index}-description`]}</p>}
            </div>

            {/* Mobile-Optimized Image Upload Section */}
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-3 sm:mb-4">תמונות המנה (בין 5-12 תמונות)</label>
              
              <div className="space-y-4">
                {/* Upload Button */}
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(dish.id, e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-3 border-dashed border-blue-300 rounded-2xl p-6 sm:p-12 text-center hover:from-blue-100 hover:to-blue-200 hover:border-blue-400 transition-all duration-300 cursor-pointer group">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <h4 className="text-base sm:text-xl font-bold text-blue-700 mb-2">לחצו להעלאת תמונות</h4>
                    <p className="text-blue-600 text-sm sm:text-base mb-2">או גררו תמונות לכאן</p>
                    <p className="text-blue-500 text-xs sm:text-sm">JPG, PNG או HEIC עד 10MB לכל תמונה</p>
                  </div>
                </div>

                {/* Mobile-Optimized Image Preview Grid */}
                {dish.referenceImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {dish.referenceImages.map((file, imageIndex) => (
                      <div key={imageIndex} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-lg">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`תמונה ${imageIndex + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(dish.id, imageIndex)}
                          className="absolute -top-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300 z-10"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {errors[`dish-${index}-images`] && <p className="text-red-500 text-sm font-medium">{errors[`dish-${index}-images`]}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Contact Information Section - Moved to bottom */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-6 sm:p-8 shadow-lg border border-purple-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#333333]">פרטי איש קשר</h3>
            <p className="text-purple-600 text-sm sm:text-base">נשמח להכיר</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
              שם מלא *
            </label>
            <input
              type="text"
              value={formData.submitterName}
              onChange={(e) => handleContactChange('submitterName', e.target.value)}
              className={cn(
                "w-full px-4 sm:px-5 py-3 sm:py-4 text-base sm:text-lg border-2 rounded-xl transition-all duration-200 touch-manipulation",
                "focus:ring-4 focus:ring-purple-200 focus:border-purple-500 focus:outline-none",
                "bg-white/80 backdrop-blur-sm",
                errors.submitterName ? "border-red-500" : "border-purple-200 hover:border-purple-300"
              )}
              placeholder="הכניסו את שמכם/ן המלא"
            />
            {errors.submitterName && (
              <p className="text-red-500 text-sm mt-1">{errors.submitterName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
              טלפון *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleContactChange('phone', e.target.value)}
              className={cn(
                "w-full px-4 sm:px-5 py-3 sm:py-4 text-base sm:text-lg border-2 rounded-xl transition-all duration-200 touch-manipulation",
                "focus:ring-4 focus:ring-purple-200 focus:border-purple-500 focus:outline-none",
                "bg-white/80 backdrop-blur-sm",
                errors.phone ? "border-red-500" : "border-purple-200 hover:border-purple-300"
              )}
              placeholder="05X-XXXXXXX"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
              מייל *
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleContactChange('email', e.target.value)}
              className={cn(
                "w-full px-4 sm:px-5 py-3 sm:py-4 text-base sm:text-lg border-2 rounded-xl transition-all duration-200 touch-manipulation",
                "focus:ring-4 focus:ring-purple-200 focus:border-purple-500 focus:outline-none",
                "bg-white/80 backdrop-blur-sm",
                errors.email ? "border-red-500" : "border-purple-200 hover:border-purple-300"
              )}
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
              שם העסק *
            </label>
            <input
              type="text"
              value={formData.restaurantName}
              onChange={(e) => handleContactChange('restaurantName', e.target.value)}
              className="w-full px-4 sm:px-5 py-3 sm:py-4 text-base sm:text-lg border-2 border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 focus:outline-none transition-all duration-200 bg-white/80 backdrop-blur-sm hover:border-purple-300 touch-manipulation"
              placeholder="שם המסעדה או העסק"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadDetailsStep;

