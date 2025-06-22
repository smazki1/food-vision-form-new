
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
    <div className="space-y-12">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#F3752B] to-[#FF8B47] rounded-full mb-6 shadow-lg">
          <Upload className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-[#333333] mb-4">העלאת מנות</h1>
        <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
          העלו את המנות שלכם וקבלו תמונות מקצועיות מדהימות תוך 48 שעות
        </p>
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
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 shadow-lg border-2 border-gray-200">
          <h4 className="text-2xl font-bold text-center text-[#333333] mb-8">דוגמה לפני ואחרי:</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="relative mb-4">
                <img 
                  src="/lovable-uploads/IMG_D76A6032ABB8-1.jpeg" 
                  alt="תמונה לפני עיבוד" 
                  className="w-full h-auto object-contain rounded-xl shadow-lg bg-white p-2"
                />
                <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  לפני
                </div>
              </div>
              <p className="text-base text-gray-700 font-semibold">התמונה המקורית שהעלה הלקוח</p>
            </div>
            <div className="text-center">
              <div className="relative mb-4">
                <img 
                  src="/lovable-uploads/26889960-2 (2).jpg" 
                  alt="תמונה אחרי עיבוד" 
                  className="w-full h-auto object-contain rounded-xl shadow-lg bg-white p-2"
                />
                <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  אחרי
                </div>
              </div>
              <p className="text-base text-gray-700 font-semibold">התוצאה המקצועית שלנו</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dishes Section */}
      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-3xl font-bold text-[#333333] mb-4">המנות שלכם</h3>
          <p className="text-gray-600 text-lg mb-6">הוסיפו את המנות שברצונכם לעצב</p>
          <Button
            type="button"
            onClick={addDish}
            size="lg"
            className="bg-gradient-to-r from-[#F3752B] to-[#FF8B47] hover:from-[#E56B26] hover:to-[#F3752B] text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <Plus className="w-5 h-5 mr-2" />
            הוסף מנה חדשה
          </Button>
        </div>

        {formData.dishes.length === 0 && (
          <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg mb-6">עדיין לא הוספתם מנות</p>
            <Button
              type="button"
              onClick={addDish}
              size="lg"
              className="bg-gradient-to-r from-[#F3752B] to-[#FF8B47] hover:from-[#E56B26] hover:to-[#F3752B] text-white font-semibold px-8 py-4 rounded-xl"
            >
              הוסף מנה ראשונה
            </Button>
          </div>
        )}

        {formData.dishes.map((dish, index) => (
          <div key={dish.id} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-8 space-y-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#8B1E3F] to-[#A52A44] rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {index + 1}
                </div>
                <h4 className="text-2xl font-bold text-[#333333]">מנה {index + 1}</h4>
              </div>
              {formData.dishes.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeDish(dish.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-2 border-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 rounded-xl"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-3">שם המנה *</label>
                <input
                  type="text"
                  value={dish.itemName}
                  onChange={(e) => handleDishChange(dish.id, 'itemName', e.target.value)}
                  className={cn(
                    "w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-[#F3752B]/20 focus:border-[#F3752B] transition-all duration-300 text-lg",
                    errors[`dish-${index}-name`] ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                  )}
                  placeholder="לדוגמה: המבורגר טרופי"
                />
                {errors[`dish-${index}-name`] && <p className="text-red-500 text-sm mt-2 font-medium">{errors[`dish-${index}-name`]}</p>}
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-700 mb-3">סוג המנה *</label>
                <select
                  value={dish.itemType}
                  onChange={(e) => handleDishChange(dish.id, 'itemType', e.target.value)}
                  className={cn(
                    "w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-[#F3752B]/20 focus:border-[#F3752B] transition-all duration-300 text-lg",
                    errors[`dish-${index}-type`] ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                  )}
                >
                  <option value="">בחר סוג מנה</option>
                  <option value="מנה עיקרית">מנה עיקרית</option>
                  <option value="מנה ראשונה">מנה ראשונה</option>
                  <option value="קינוח">קינוח</option>
                  <option value="שתיה">שתיה</option>
                  <option value="אחר">אחר</option>
                </select>
                {errors[`dish-${index}-type`] && <p className="text-red-500 text-sm mt-2 font-medium">{errors[`dish-${index}-type`]}</p>}
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-700 mb-3">תיאור המנה *</label>
              <textarea
                value={dish.description}
                onChange={(e) => handleDishChange(dish.id, 'description', e.target.value)}
                rows={4}
                className={cn(
                  "w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-[#F3752B]/20 focus:border-[#F3752B] transition-all duration-300 text-lg resize-none",
                  errors[`dish-${index}-description`] ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                )}
                placeholder="כתבו את המרכיבים המרכזיים שאסור לפספס במנה - לדוגמה: בשר בקר, גבינה צהובה, עגבניות, חסה..."
              />
              {errors[`dish-${index}-description`] && <p className="text-red-500 text-sm mt-2 font-medium">{errors[`dish-${index}-description`]}</p>}
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-700 mb-3">הערות מיוחדות</label>
              <textarea
                value={dish.specialNotes || ''}
                onChange={(e) => handleDishChange(dish.id, 'specialNotes', e.target.value)}
                rows={3}
                className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-[#F3752B]/20 focus:border-[#F3752B] transition-all duration-300 text-lg resize-none hover:border-gray-400"
                placeholder="הערות נוספות, בקשות מיוחדות או כל דבר אחר שחשוב לכם..."
              />
            </div>

            {/* Image Upload */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200">
              <label className="block text-base font-semibold text-gray-700 mb-4">תמונות של המנה * (5-12 תמונות)</label>
              <div 
                className="border-3 border-dashed border-blue-300 rounded-2xl p-8 text-center bg-white/70 hover:bg-white/90 transition-all duration-300 cursor-pointer group"
                onClick={() => document.getElementById(`file-upload-${dish.id}`)?.click()}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#F3752B] to-[#FF8B47] rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <p className="text-gray-700 text-lg font-medium mb-2">גררו תמונות לכאן או לחצו לבחירה</p>
                <p className="text-gray-500 text-sm">תמונות ב-JPG, PNG עד 10MB כל אחת</p>
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
                  className="mt-4 bg-gradient-to-r from-[#F3752B] to-[#FF8B47] hover:from-[#E56B26] hover:to-[#F3752B] text-white font-semibold px-6 py-3 rounded-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById(`file-upload-${dish.id}`)?.click();
                  }}
                >
                  בחרו תמונות
                </Button>
              </div>
              {errors[`dish-${index}-images`] && <p className="text-red-500 text-sm mt-3 font-medium">{errors[`dish-${index}-images`]}</p>}

              {dish.referenceImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {dish.referenceImages.map((file, imageIndex) => (
                    <div key={imageIndex} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`תצוגה מקדימה ${imageIndex + 1}`}
                        className="w-full h-24 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-shadow duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(dish.id, imageIndex)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg transition-all duration-300 hover:scale-110"
                      >
                        <X className="h-4 w-4" />
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

      {/* Contact Information - Enhanced */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl border-2 border-purple-200 shadow-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#8B1E3F] to-[#A52A44] rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-3xl font-bold text-[#333333] mb-2">פרטי התקשרות</h3>
          <p className="text-gray-600 text-lg">כדי שנוכל ליצור איתכם קשר ולשלוח את התמונות המוכנות</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-3">שם העסק *</label>
            <input
              type="text"
              value={formData.restaurantName}
              onChange={(e) => handleContactChange('restaurantName', e.target.value)}
              className={cn(
                "w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-[#F3752B]/20 focus:border-[#F3752B] transition-all duration-300 text-lg bg-white",
                errors.restaurantName ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
              )}
              placeholder="לדוגמה: מסעדת הבית של דוד"
            />
            {errors.restaurantName && <p className="text-red-500 text-sm mt-2 font-medium">{errors.restaurantName}</p>}
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-700 mb-3">שם איש קשר *</label>
            <input
              type="text"
              value={formData.submitterName}
              onChange={(e) => handleContactChange('submitterName', e.target.value)}
              className={cn(
                "w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-[#F3752B]/20 focus:border-[#F3752B] transition-all duration-300 text-lg bg-white",
                errors.submitterName ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
              )}
              placeholder="שם מלא"
            />
            {errors.submitterName && <p className="text-red-500 text-sm mt-2 font-medium">{errors.submitterName}</p>}
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-700 mb-3">טלפון *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleContactChange('phone', e.target.value)}
              className={cn(
                "w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-[#F3752B]/20 focus:border-[#F3752B] transition-all duration-300 text-lg bg-white",
                errors.phone ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
              )}
              placeholder="050-1234567"
            />
            {errors.phone && <p className="text-red-500 text-sm mt-2 font-medium">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-700 mb-3">אימייל *</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleContactChange('email', e.target.value)}
              className={cn(
                "w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-[#F3752B]/20 focus:border-[#F3752B] transition-all duration-300 text-lg bg-white",
                errors.email ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
              )}
              placeholder="your-email@example.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-2 font-medium">{errors.email}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadDetailsStep;
