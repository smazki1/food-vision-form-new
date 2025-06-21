
import React, { useState } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { cn } from '@/lib/utils';
import { Upload, X, ZoomIn } from 'lucide-react';

interface StyleSelectionStepProps {
  errors: Record<string, string>;
  clearErrors: () => void;
}

const stylesByCategory = {
  delivery: [
    { 
      id: 'light-bg', 
      name: 'רקע בהיר', 
      description: 'קלאסי ומומלץ', 
      preview: '/lovable-uploads/e4149abd-96e4-4cc3-a8d3-6008629f0db1.png' 
    },
    { 
      id: 'dark-bg', 
      name: 'רקע כהה', 
      description: 'פרימיום ואלגנטי', 
      preview: '/lovable-uploads/84d2b702-0e3e-4049-a905-ba420884ba6e.png' 
    },
    { 
      id: 'wood-bg', 
      name: 'רקע עץ', 
      description: 'חמים וביתי', 
      preview: '/lovable-uploads/013f53c9-a06b-4e06-9aaa-f61d28c27fc1.png' 
    },
    { 
      id: 'colorful-bg', 
      name: 'רקע צבעוני', 
      description: 'מודרני ובולט', 
      preview: '/lovable-uploads/d1590bd1-95c0-4df9-a3a6-dea1e4be15ff.png' 
    }
  ],
  social: [
    { id: 'instagram-square', name: 'Instagram מרובע', description: 'מותאם לפוסטים', preview: '/lovable-uploads/e4149abd-96e4-4cc3-a8d3-6008629f0db1.png' },
    { id: 'story-vertical', name: 'Stories אנכי', description: 'מותאם לסטוריז', preview: '/lovable-uploads/84d2b702-0e3e-4049-a905-ba420884ba6e.png' },
    { id: 'facebook-wide', name: 'Facebook רחב', description: 'מותאם לפייסבוק', preview: '/lovable-uploads/013f53c9-a06b-4e06-9aaa-f61d28c27fc1.png' },
    { id: 'tiktok-vertical', name: 'TikTok אנכי', description: 'מותאם לטיקטוק', preview: '/lovable-uploads/d1590bd1-95c0-4df9-a3a6-dea1e4be15ff.png' }
  ],
  menu: [
    { id: 'menu-clean', name: 'תפריט נקי', description: 'מינימליסטי וברור', preview: '/lovable-uploads/e4149abd-96e4-4cc3-a8d3-6008629f0db1.png' },
    { id: 'menu-elegant', name: 'תפריט אלגנטי', description: 'מעוצב ומקצועי', preview: '/lovable-uploads/84d2b702-0e3e-4049-a905-ba420884ba6e.png' },
    { id: 'digital-screen', name: 'מסך דיגיטלי', description: 'מותאם למסכים', preview: '/lovable-uploads/013f53c9-a06b-4e06-9aaa-f61d28c27fc1.png' },
    { id: 'print-menu', name: 'תפריט מודפס', description: 'מותאם להדפסה', preview: '/lovable-uploads/d1590bd1-95c0-4df9-a3a6-dea1e4be15ff.png' }
  ],
  marketing: [
    { id: 'ad-banner', name: 'באנר פרסומי', description: 'מותאם למודעות', preview: '/lovable-uploads/e4149abd-96e4-4cc3-a8d3-6008629f0db1.png' },
    { id: 'flyer-style', name: 'סגנון עלון', description: 'מותאם לעלונים', preview: '/lovable-uploads/84d2b702-0e3e-4049-a905-ba420884ba6e.png' },
    { id: 'poster-style', name: 'סגנון פוסטר', description: 'מותאם לפוסטרים', preview: '/lovable-uploads/013f53c9-a06b-4e06-9aaa-f61d28c27fc1.png' },
    { id: 'brochure-style', name: 'סגנון חוברת', description: 'מותאם לחוברות', preview: '/lovable-uploads/d1590bd1-95c0-4df9-a3a6-dea1e4be15ff.png' }
  ],
  all: [
    { id: 'light-bg', name: 'רקע בהיר', description: 'קלאסי ומומלץ', preview: '/lovable-uploads/e4149abd-96e4-4cc3-a8d3-6008629f0db1.png' },
    { id: 'dark-bg', name: 'רקע כהה', description: 'פרימיום ואלגנטי', preview: '/lovable-uploads/84d2b702-0e3e-4049-a905-ba420884ba6e.png' },
    { id: 'wood-bg', name: 'רקע עץ', description: 'חמים וביתי', preview: '/lovable-uploads/013f53c9-a06b-4e06-9aaa-f61d28c27fc1.png' },
    { id: 'colorful-bg', name: 'רקע צבעוני', description: 'מודרני ובולט', preview: '/lovable-uploads/d1590bd1-95c0-4df9-a3a6-dea1e4be15ff.png' },
    { id: 'instagram-square', name: 'Instagram מרובע', description: 'מותאם לפוסטים', preview: '/lovable-uploads/e4149abd-96e4-4cc3-a8d3-6008629f0db1.png' },
    { id: 'story-vertical', name: 'Stories אנכי', description: 'מותאם לסטוריז', preview: '/lovable-uploads/84d2b702-0e3e-4049-a905-ba420884ba6e.png' }
  ]
};

interface ImageZoomModalProps {
  imageUrl: string;
  styleName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageZoomModal: React.FC<ImageZoomModalProps> = ({ imageUrl, styleName, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={onClose}>
      <div className="relative max-w-4xl max-h-4xl p-4">
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={imageUrl}
          alt={styleName}
          className="max-w-full max-h-full object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-4 py-2 rounded-lg">
          <h3 className="font-semibold">{styleName}</h3>
        </div>
      </div>
    </div>
  );
};

const StyleSelectionStep: React.FC<StyleSelectionStepProps> = ({ errors, clearErrors }) => {
  const { formData, updateFormData } = useNewItemForm();
  const [zoomedImage, setZoomedImage] = useState<{ url: string; name: string } | null>(null);

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

  const handleZoomImage = (imageUrl: string, styleName: string) => {
    setZoomedImage({ url: imageUrl, name: styleName });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#333333] mb-4">בחירת סגנון עיצוב</h1>
        <p className="text-gray-600">בחרו את הסגנון שהכי מתאים לכם או יצרו סגנון מותאם אישית</p>
      </div>

      {/* Predefined Styles Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {currentStyles.map((style) => (
          <div
            key={style.id}
            onClick={() => handleStyleSelect(style.id)}
            className={cn(
              "relative group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl",
              "border-4 rounded-2xl overflow-hidden",
              formData.selectedStyle === style.id
                ? "border-[#F3752B] shadow-lg shadow-orange-200"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            {/* Background Image */}
            <div 
              className="relative aspect-square bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${style.preview})` }}
            >
              {/* Semi-transparent overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              
              {/* Content overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="font-bold text-lg mb-1 drop-shadow-lg">{style.name}</h3>
                <p className="text-sm opacity-90 drop-shadow">{style.description}</p>
              </div>

              {/* Zoom icon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomImage(style.preview, style.name);
                }}
                className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/30"
              >
                <ZoomIn className="w-4 h-4 text-white" />
              </button>

              {/* Selected indicator */}
              {formData.selectedStyle === style.id && (
                <div className="absolute top-3 left-3 bg-[#F3752B] text-white rounded-full w-6 h-6 flex items-center justify-center">
                  <span className="text-sm font-bold">✓</span>
                </div>
              )}
            </div>
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
                  בחר קבצים
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

      {/* Error Display */}
      {errors.selectedStyle && (
        <p className="text-red-500 text-sm text-center">{errors.selectedStyle}</p>
      )}

      {/* Image Zoom Modal */}
      <ImageZoomModal
        imageUrl={zoomedImage?.url || ''}
        styleName={zoomedImage?.name || ''}
        isOpen={!!zoomedImage}
        onClose={() => setZoomedImage(null)}
      />
    </div>
  );
};

export default StyleSelectionStep;
