import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { cn } from '@/lib/utils';
import { Upload, ZoomIn, X } from 'lucide-react';

interface StyleSelectionStepProps {
  errors: Record<string, string>;
  clearErrors: () => void;
}

// Lightbox Modal Component
const ImageLightbox: React.FC<{
  isOpen: boolean;
  imageUrl: string;
  title: string;
  description: string;
  onClose: () => void;
}> = ({ isOpen, imageUrl, title, description, onClose }) => {
  console.log('ImageLightbox render:', { isOpen, imageUrl, title });
  
  if (!isOpen) {
    console.log('ImageLightbox not rendering - isOpen is false');
    return null;
  }
  
  console.log('ImageLightbox rendering modal...');

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  React.useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Modal Content */}
      <div className="relative max-w-5xl max-h-[95vh] w-full">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10 bg-black/30 rounded-full p-2 hover:bg-black/50"
          aria-label="סגור"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="bg-white rounded-lg overflow-hidden shadow-2xl max-h-[95vh] flex flex-col">
          <div className="flex-1 overflow-hidden">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-auto max-h-[70vh] object-contain bg-gray-100"
              onError={(e) => {
                console.error('Image failed to load:', imageUrl);
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwQzEyNy45IDEwMCAxMTAgMTE3LjkgMTEwIDE0MFMxMjcuOSAxODAgMTUwIDE4MFMxOTAgMTYyLjEgMTkwIDE0MFMxNzIuMSAxMDAgMTUwIDEwMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTEzMCAxMzBIMTcwVjE1MEgxMzBWMTMwWiIgZmlsbD0iI0Y5RkFGQiIvPgo8L3N2Zz4K';
              }}
            />
          </div>
          <div className="p-6 border-t bg-white">
            <h3 className="text-2xl font-bold text-[#333333] mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const stylesByCategory = {
  delivery: [
    { id: 'white-bg', name: 'רקע לבן', description: 'קלאסי ומומלץ', preview: '/lovable-uploads/dfeff3bf-b175-483f-9dca-6d0692f52432.png' },
    { id: 'dark-bg', name: 'רקע כהה', description: 'פרימיום ואלגנטי', preview: '/lovable-uploads/8c083378-a07b-471b-a45f-68c496fa099f.png' },
    { id: 'wood-bg', name: 'רקע עץ', description: 'חמים וביתי', preview: '/lovable-uploads/2afb683b-feda-4b83-897e-15fd3bab53b4.png' },
    { id: 'colorful-bg', name: 'רקע צבעוני', description: 'מודרני ובולט', preview: '/lovable-uploads/9f3cbbc2-d21d-46aa-a455-196f08dbe887.png' }
  ],
  social: [
    { id: 'instagram-square', name: 'Instagram מרובע', description: 'מותאם לפוסטים', preview: '/lovable-uploads/dfeff3bf-b175-483f-9dca-6d0692f52432.png' },
    { id: 'story-vertical', name: 'Stories אנכי', description: 'מותאם לסטוריז', preview: '/lovable-uploads/8c083378-a07b-471b-a45f-68c496fa099f.png' },
    { id: 'facebook-wide', name: 'Facebook רחב', description: 'מותאם לפייסבוק', preview: '/lovable-uploads/2afb683b-feda-4b83-897e-15fd3bab53b4.png' },
    { id: 'tiktok-vertical', name: 'TikTok אנכי', description: 'מותאם לטיקטוק', preview: '/lovable-uploads/9f3cbbc2-d21d-46aa-a455-196f08dbe887.png' }
  ],
  menu: [
    { id: 'menu-clean', name: 'תפריט נקי', description: 'מינימליסטי וברור', preview: '/lovable-uploads/dfeff3bf-b175-483f-9dca-6d0692f52432.png' },
    { id: 'menu-elegant', name: 'תפריט אלגנטי', description: 'מעוצב ומקצועי', preview: '/lovable-uploads/8c083378-a07b-471b-a45f-68c496fa099f.png' },
    { id: 'digital-screen', name: 'מסך דיגיטלי', description: 'מותאם למסכים', preview: '/lovable-uploads/2afb683b-feda-4b83-897e-15fd3bab53b4.png' },
    { id: 'print-menu', name: 'תפריט מודפס', description: 'מותאם להדפסה', preview: '/lovable-uploads/9f3cbbc2-d21d-46aa-a455-196f08dbe887.png' }
  ],
  marketing: [
    { id: 'ad-banner', name: 'באנר פרסומי', description: 'מותאם למודעות', preview: '/lovable-uploads/dfeff3bf-b175-483f-9dca-6d0692f52432.png' },
    { id: 'flyer-style', name: 'סגנון עלון', description: 'מותאם לעלונים', preview: '/lovable-uploads/8c083378-a07b-471b-a45f-68c496fa099f.png' },
    { id: 'poster-style', name: 'סגנון פוסטר', description: 'מותאם לפוסטרים', preview: '/lovable-uploads/2afb683b-feda-4b83-897e-15fd3bab53b4.png' },
    { id: 'brochure-style', name: 'סגנון חוברת', description: 'מותאם לחוברות', preview: '/lovable-uploads/9f3cbbc2-d21d-46aa-a455-196f08dbe887.png' }
  ],
  all: [
    { id: 'white-bg', name: 'רקע לבן', description: 'קלאסי ומומלץ', preview: '/lovable-uploads/dfeff3bf-b175-483f-9dca-6d0692f52432.png' },
    { id: 'dark-bg', name: 'רקע כהה', description: 'פרימיום ואלגנטי', preview: '/lovable-uploads/8c083378-a07b-471b-a45f-68c496fa099f.png' },
    { id: 'wood-bg', name: 'רקע עץ', description: 'חמים וביתי', preview: '/lovable-uploads/2afb683b-feda-4b83-897e-15fd3bab53b4.png' },
    { id: 'colorful-bg', name: 'רקע צבעוני', description: 'מודרני ובולט', preview: '/lovable-uploads/9f3cbbc2-d21d-46aa-a455-196f08dbe887.png' },
    { id: 'instagram-square', name: 'Instagram מרובע', description: 'מותאם לפוסטים', preview: '/lovable-uploads/fe01098f-59b9-4d84-b387-deaace6bc703.png' },
    { id: 'story-vertical', name: 'Stories אנכי', description: 'מותאם לסטוריז', preview: '/lovable-uploads/c50a1c5c-2fa9-4fdc-aa84-00665a402a8e.png' },
    { id: 'menu-clean', name: 'תפריט נקי', description: 'מינימליסטי וברור', preview: '/lovable-uploads/26889960-2 (2).jpg' },
    { id: 'menu-elegant', name: 'תפריט אלגנטי', description: 'מעוצב ומקצועי', preview: '/lovable-uploads/IMG_D76A6032ABB8-1.jpeg' },
    { id: 'ad-banner', name: 'באנר פרסומי', description: 'מותאם למודעות', preview: '/lovable-uploads/dfeff3bf-b175-483f-9dca-6d0692f52432.png' },
    { id: 'flyer-style', name: 'סגנון עלון', description: 'מותאם לעלונים', preview: '/lovable-uploads/8c083378-a07b-471b-a45f-68c496fa099f.png' },
    { id: 'poster-style', name: 'סגנון פוסטר', description: 'מותאם לפוסטרים', preview: '/lovable-uploads/2afb683b-feda-4b83-897e-15fd3bab53b4.png' },
    { id: 'brochure-style', name: 'סגנון חוברת', description: 'מותאם לחוברות', preview: '/lovable-uploads/9f3cbbc2-d21d-46aa-a455-196f08dbe887.png' }
  ]
};

const StyleSelectionStep: React.FC<StyleSelectionStepProps> = ({ errors, clearErrors }) => {
  const { formData, updateFormData } = useNewItemForm();
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    title: string;
    description: string;
  } | null>(null);

  console.log('StyleSelectionStep render - lightboxImage:', lightboxImage);

  const currentStyles = stylesByCategory[formData.selectedCategory as keyof typeof stylesByCategory] || stylesByCategory.all;

  const handleStyleSelect = (styleId: string) => {
    updateFormData({ selectedStyle: styleId, customStyle: undefined });
    if (errors.selectedStyle) clearErrors();
  };

  const handleImageClick = (e: React.MouseEvent, style: any) => {
    console.log('handleImageClick called with:', style);
    e.stopPropagation();
    e.preventDefault();
    
    const lightboxData = {
      url: style.preview,
      title: style.name,
      description: style.description
    };
    
    console.log('Setting lightbox image to:', lightboxData);
    setLightboxImage(lightboxData);
    
    // Force a re-render check
    setTimeout(() => {
      console.log('Current lightboxImage state:', lightboxImage);
    }, 100);
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

      {/* Predefined Styles - Improved Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {currentStyles.map((style) => (
          <div
            key={style.id}
            onClick={() => handleStyleSelect(style.id)}
            className={cn(
              "group relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl",
              "border-2",
              formData.selectedStyle === style.id
                ? "border-[#F3752B] ring-2 ring-[#F3752B]/20"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            {/* Full Background Image */}
            <div className="aspect-square relative overflow-hidden">
              <img
                src={style.preview}
                alt={style.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              
              {/* Zoom Indicator */}
              <button
                type="button"
                onClick={(e) => {
                  console.log('ZOOM BUTTON CLICKED!', style.name);
                  e.stopPropagation();
                  e.preventDefault();
                  handleImageClick(e, style);
                }}
                onMouseDown={(e) => {
                  console.log('ZOOM BUTTON MOUSE DOWN!');
                  e.stopPropagation();
                }}
                className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white p-3 rounded-full opacity-100 transition-all duration-300 hover:bg-black/80 hover:scale-110 z-10 pointer-events-auto"
                aria-label="הגדל תמונה"
                style={{ pointerEvents: 'auto' }}
              >
                <ZoomIn className="w-5 h-5" />
              </button>

              {/* Selected Indicator */}
              {formData.selectedStyle === style.id && (
                <div className="absolute top-3 left-3 bg-[#F3752B] text-white px-3 py-1 rounded-full text-sm font-medium">
                  נבחר
                </div>
              )}

              {/* Semi-transparent Text Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-4">
                <h3 className="font-bold text-white text-lg mb-1 drop-shadow-sm">{style.name}</h3>
                <p className="text-white/90 text-sm drop-shadow-sm">{style.description}</p>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-[#F3752B]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        ))}
      </div>

      {/* Custom Style Option */}
      <div className="border-t pt-8">
        <div
          onClick={handleCustomStyleToggle}
          className={cn(
            "group p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
            formData.customStyle
              ? "border-[#F3752B] bg-orange-50 ring-2 ring-[#F3752B]/20"
              : "border-gray-200 hover:border-gray-300"
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-[#333333] mb-2 group-hover:text-[#F3752B] transition-colors">
                🎨 סגנון מותאם אישית
              </h3>
              <p className="text-gray-600">העלו תמונות השראה וחומרי מיתוג ותנו הוראות מפורטות</p>
            </div>
            {formData.customStyle && (
              <div className="bg-[#F3752B] text-white px-3 py-1 rounded-full text-sm font-medium">
                פעיל
              </div>
            )}
          </div>
        </div>

        {formData.customStyle && (
          <div className="mt-6 space-y-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
            {/* Inspiration Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">תמונות השראה</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
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
                  className="bg-[#F3752B] hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  בחר קבצים
                </button>
              </div>
              {formData.customStyle.inspirationImages.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {formData.customStyle.inspirationImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`השראה ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Branding Materials */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">חומרי מיתוג (לוגו, פונטים)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
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
                  className="bg-[#F3752B] hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  בחר קבצים
                </button>
              </div>
              {formData.customStyle.brandingMaterials.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">
                    ✓ {formData.customStyle.brandingMaterials.length} קבצים נבחרו
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F3752B] focus:border-transparent transition-all"
                placeholder="תארו את הסגנון הרצוי, צבעים, רקעים, סגנון צילום וכל פרט חשוב אחר..."
              />
            </div>
          </div>
        )}
      </div>

      {errors.selectedStyle && (
        <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">{errors.selectedStyle}</p>
        </div>
      )}

      {/* Lightbox Modal - Render outside main container */}
      {lightboxImage && (
        <ImageLightbox
          isOpen={true}
          imageUrl={lightboxImage.url}
          title={lightboxImage.title}
          description={lightboxImage.description}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
};

export default StyleSelectionStep;
