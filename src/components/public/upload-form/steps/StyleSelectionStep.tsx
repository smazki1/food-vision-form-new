
import React from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { cn } from '@/lib/utils';
import { Upload } from 'lucide-react';

interface StyleSelectionStepProps {
  errors: Record<string, string>;
  clearErrors: () => void;
}

const stylesByCategory = {
  delivery: [
    { id: 'white-bg', name: 'רקע לבן', description: 'קלאסי ומומלץ', preview: '/api/placeholder/150/150' },
    { id: 'dark-bg', name: 'רקע כהה', description: 'פרימיום ואלגנטי', preview: '/api/placeholder/150/150' },
    { id: 'wood-bg', name: 'רקע עץ', description: 'חמים וביתי', preview: '/api/placeholder/150/150' },
    { id: 'colorful-bg', name: 'רקע צבעוני', description: 'מודרני ובולט', preview: '/api/placeholder/150/150' }
  ],
  social: [
    { id: 'instagram-square', name: 'Instagram מרובע', description: 'מותאם לפוסטים', preview: '/api/placeholder/150/150' },
    { id: 'story-vertical', name: 'Stories אנכי', description: 'מותאם לסטוריז', preview: '/api/placeholder/150/150' },
    { id: 'facebook-wide', name: 'Facebook רחב', description: 'מותאם לפייסבוק', preview: '/api/placeholder/150/150' },
    { id: 'tiktok-vertical', name: 'TikTok אנכי', description: 'מותאם לטיקטוק', preview: '/api/placeholder/150/150' }
  ],
  menu: [
    { id: 'menu-clean', name: 'תפריט נקי', description: 'מינימליסטי וברור', preview: '/api/placeholder/150/150' },
    { id: 'menu-elegant', name: 'תפריט אלגנטי', description: 'מעוצב ומקצועי', preview: '/api/placeholder/150/150' },
    { id: 'digital-screen', name: 'מסך דיגיטלי', description: 'מותאם למסכים', preview: '/api/placeholder/150/150' },
    { id: 'print-menu', name: 'תפריט מודפס', description: 'מותאם להדפסה', preview: '/api/placeholder/150/150' }
  ],
  marketing: [
    { id: 'ad-banner', name: 'באנר פרסומי', description: 'מותאם למודעות', preview: '/api/placeholder/150/150' },
    { id: 'flyer-style', name: 'סגנון עלון', description: 'מותאם לעלונים', preview: '/api/placeholder/150/150' },
    { id: 'poster-style', name: 'סגנון פוסטר', description: 'מותאם לפוסטרים', preview: '/api/placeholder/150/150' },
    { id: 'brochure-style', name: 'סגנון חוברת', description: 'מותאם לחוברות', preview: '/api/placeholder/150/150' }
  ],
  all: [
    { id: 'white-bg', name: 'רקע לבן', description: 'קלאסי ומומלץ', preview: '/api/placeholder/150/150' },
    { id: 'dark-bg', name: 'רקע כהה', description: 'פרימיום ואלגנטי', preview: '/api/placeholder/150/150' },
    { id: 'wood-bg', name: 'רקע עץ', description: 'חמים וביתי', preview: '/api/placeholder/150/150' },
    { id: 'colorful-bg', name: 'רקע צבעוני', description: 'מודרני ובולט', preview: '/api/placeholder/150/150' },
    { id: 'instagram-square', name: 'Instagram מרובע', description: 'מותאם לפוסטים', preview: '/api/placeholder/150/150' },
    { id: 'story-vertical', name: 'Stories אנכי', description: 'מותאם לסטוריז', preview: '/api/placeholder/150/150' },
    { id: 'menu-clean', name: 'תפריט נקי', description: 'מינימליסטי וברור', preview: '/api/placeholder/150/150' },
    { id: 'menu-elegant', name: 'תפריט אלגנטי', description: 'מעוצב ומקצועי', preview: '/api/placeholder/150/150' },
    { id: 'ad-banner', name: 'באנר פרסומי', description: 'מותאם למודעות', preview: '/api/placeholder/150/150' },
    { id: 'flyer-style', name: 'סגנון עלון', description: 'מותאם לעלונים', preview: '/api/placeholder/150/150' },
    { id: 'poster-style', name: 'סגנון פוסטר', description: 'מותאם לפוסטרים', preview: '/api/placeholder/150/150' },
    { id: 'brochure-style', name: 'סגנון חוברת', description: 'מותאם לחוברות', preview: '/api/placeholder/150/150' }
  ]
};

const StyleSelectionStep: React.FC<StyleSelectionStepProps> = ({ errors, clearErrors }) => {
  const { formData, updateFormData } = useNewItemForm();

  const currentStyles = stylesByCategory[formData.selectedCategory as keyof typeof stylesByCategory] || stylesByCategory.all;

  const handleStyleSelect = (styleId: string) => {
    updateFormData({ selectedStyle: styleId, customStyle: undefined });
    if (errors.selectedStyle) clearErrors();
  };

  const handleCustomStyleToggle = () => {
    if (formData.customStyle) {
      updateFormData({ customStyle: undefined });
    } else {
      updateFormData({ 
        selectedStyle: undefined,
        customStyle: {
          inspirationImages: [],
          brandingMaterials: [],
          instructions: ''
        }
      });
    }
    if (errors.selectedStyle) clearErrors();
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
    if (!files || !formData.customStyle) return;
    
    const newFiles = Array.from(files);
    const currentFiles = formData.customStyle[field] || [];
    const updatedFiles = [...currentFiles, ...newFiles];
    
    handleCustomStyleChange(field, updatedFiles);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#333333] mb-4">בחירת סגנון עיצוב</h1>
        <p className="text-gray-600">בחרו את הסגנון שהכי מתאים לכם או יצרו סגנון מותאם אישית</p>
      </div>

      {/* Predefined Styles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {currentStyles.map((style) => (
          <div
            key={style.id}
            onClick={() => handleStyleSelect(style.id)}
            className={cn(
              "p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg",
              formData.selectedStyle === style.id
                ? "border-[#F3752B] bg-orange-50"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
              <img
                src={style.preview}
                alt={style.name}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <h3 className="font-semibold text-[#333333] mb-1">{style.name}</h3>
            <p className="text-sm text-gray-600">{style.description}</p>
          </div>
        ))}
      </div>

      {/* Custom Style Option */}
      <div className="border-t pt-8">
        <div
          onClick={handleCustomStyleToggle}
          className={cn(
            "p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg",
            formData.customStyle
              ? "border-[#F3752B] bg-orange-50"
              : "border-gray-200 hover:border-gray-300"
          )}
        >
          <h3 className="text-xl font-semibold text-[#333333] mb-2">🎨 סגנון מותאם אישית</h3>
          <p className="text-gray-600">העלו תמונות השראה וחומרי מיתוג ותנו הוראות מפורטות</p>
        </div>

        {formData.customStyle && (
          <div className="mt-6 space-y-6 bg-gray-50 p-6 rounded-xl">
            {/* Inspiration Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">תמונות השראה</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-600 mb-2">העלו תמונות של סגנונות שאהבתם</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload('inspirationImages', e.target.files)}
                  className="hidden"
                  id="inspiration-upload"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('inspiration-upload')?.click()}
                  className="text-[#F3752B] hover:text-orange-600 font-medium"
                >
                  בחר קבצים
                </button>
              </div>
              {formData.customStyle.inspirationImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {formData.customStyle.inspirationImages.map((file, index) => (
                    <img
                      key={index}
                      src={URL.createObjectURL(file)}
                      alt={`השראה ${index + 1}`}
                      className="w-full h-20 object-cover rounded"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Branding Materials */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">חומרי מיתוג (לוגו, פונטים)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-600 mb-2">העלו לוגו, פונטים או חומרי מיתוג אחרים</p>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.ai,.psd"
                  onChange={(e) => handleFileUpload('brandingMaterials', e.target.files)}
                  className="hidden"
                  id="branding-upload"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('branding-upload')?.click()}
                  className="text-[#F3752B] hover:text-orange-600 font-medium"
                >
                  ב חר קבצים
                </button>
              </div>
              {formData.customStyle.brandingMaterials.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    {formData.customStyle.brandingMaterials.length} קבצים נבחרו
                  </p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">הוראות מפורטות</label>
              <textarea
                value={formData.customStyle.instructions}
                onChange={(e) => handleCustomStyleChange('instructions', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F3752B] focus:border-transparent"
                placeholder="תארו את הסגנון הרצוי, צבעים, רקעים, סגנון צילום וכל פרט חשוב אחר..."
              />
            </div>
          </div>
        )}
      </div>

      {errors.selectedStyle && (
        <p className="text-red-500 text-sm text-center">{errors.selectedStyle}</p>
      )}
    </div>
  );
};

export default StyleSelectionStep;
