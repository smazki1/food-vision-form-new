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
    { id: 'story-vertical', name: 'Stories אנכי', description: 'מותאם לסטוריז', preview: '/lovable-uploads/84d2b702-0e3e-4049-a905-ba420884ba6e.png' },
    { id: 'menu-clean', name: 'תפריט נקי', description: 'מינימליסטי וברור', preview: '/lovable-uploads/013f53c9-a06b-4e06-9aaa-f61d28c27fc1.png' },
    { id: 'menu-elegant', name: 'תפריט אלגנטי', description: 'מעוצב ומקצועי', preview: '/lovable-uploads/d1590bd1-95c0-4df9-a3a6-dea1e4be15ff.png' },
    { id: 'ad-banner', name: 'באנר פרסומי', description: 'מותאם למודעות', preview: '/lovable-uploads/e4149abd-96e4-4cc3-a8d3-6008629f0db1.png' },
    { id: 'flyer-style', name: 'סגנון עלון', description: 'מותאם לעלונים', preview: '/lovable-uploads/84d2b702-0e3e-4049-a905-ba420884ba6e.png' },
    { id: 'poster-style', name: 'סגנון פוסטר', description: 'מותאם לפוסטרים', preview: '/lovable-uploads/013f53c9-a06b-4e06-9aaa-f61d28c27fc1.png' },
    { id: 'brochure-style', name: 'סגנון חוברת', description: 'מותאם לחוברות', preview: '/lovable-uploads/d1590bd1-95c0-4df9-a3a6-dea1e4be15ff.png' }
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
    if (files && formData.customStyle) {
      const newFiles = Array.from(files);
      handleCustomStyleChange(field, [...formData.customStyle[field], ...newFiles]);
    }
  };

  const handleZoomImage = (imageUrl: string, styleName: string) => {
    console.log('handleZoomImage called:', { imageUrl, styleName });
    setLightboxImage({
      url: imageUrl,
      title: styleName,
      description: 'תצוגה מקדימה של הסגנון'
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#333333] mb-4">
          בחר את הסגנון המועדף עליך
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          כל סגנון מותאם במיוחד לשימוש שבחרת. לחץ על התמונות כדי להציג אותן במסך מלא
        </p>
      </div>

      {/* Style Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {currentStyles.map((style) => (
          <div
            key={style.id}
            className={cn(
              "relative group cursor-pointer rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105",
              formData.selectedStyle === style.id
                ? "ring-4 ring-[#f3752b] shadow-2xl scale-105"
                : "hover:ring-2 hover:ring-[#f3752b]/50"
            )}
            onClick={() => handleStyleSelect(style.id)}
          >
            {/* Background Image */}
            <div className="relative h-64 sm:h-72 lg:h-80 overflow-hidden">
              <img
                src={style.preview}
                alt={style.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  console.error('Image failed to load:', style.preview);
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwQzEyNy45IDEwMCAxMTAgMTE3LjkgMTEwIDE0MFMxMjcuOSAxODAgMTUwIDE4MFMxOTAgMTYyLjEgMTkwIDE0MFMxNzIuMSAxMDAgMTUwIDEwMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTEzMCAxMzBIMTcwVjE1MEgxMzBWMTMwWiIgZmlsbD0iI0Y5RkFGQiIvPgo8L3N2Zz4K';
                }}
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent" />
              
              {/* Zoom Button */}
              <button
                type="button"
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all duration-200 opacity-100 z-10 pointer-events-auto"
                onClick={(e) => {
                  console.log('Zoom button clicked for:', style.name);
                  e.stopPropagation();
                  e.preventDefault();
                  handleZoomImage(style.preview, style.name);
                }}
                onMouseDown={(e) => {
                  console.log('Zoom button mouse down for:', style.name);
                  e.stopPropagation();
                  e.preventDefault();
                  handleZoomImage(style.preview, style.name);
                }}
                aria-label={`הגדל תמונה של ${style.name}`}
              >
                <ZoomIn className="w-5 h-5 text-white" />
              </button>
              
              {/* Selection Indicator */}
              {formData.selectedStyle === style.id && (
                <div className="absolute top-4 left-4 bg-[#f3752b] text-white px-3 py-1 rounded-full text-sm font-semibold">
                  נבחר
                </div>
              )}
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-xl font-bold mb-2">{style.name}</h3>
              <p className="text-sm opacity-90">{style.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Style Section */}
      <div className="border-t pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-[#333333] mb-2">סגנון מותאם אישית</h3>
            <p className="text-gray-600">רוצה משהו מיוחד? צור סגנון משלך</p>
          </div>
          <button
            type="button"
            onClick={handleCustomStyleToggle}
            className={cn(
              "px-6 py-3 rounded-lg font-semibold transition-all duration-200",
              formData.customStyle
                ? "bg-[#f3752b] text-white hover:bg-[#e56b26]"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            {formData.customStyle ? "ביטול סגנון מותאם" : "צור סגנון מותאם"}
          </button>
        </div>

        {formData.customStyle && (
          <div className="bg-gray-50 rounded-xl p-6 space-y-6">
            {/* Inspiration Images */}
            <div>
              <label className="block text-lg font-semibold text-[#333333] mb-3">
                תמונות השראה
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#f3752b] transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">גרור קבצים לכאן או לחץ לבחירה</p>
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
                  className="inline-block bg-[#f3752b] text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-[#e56b26] transition-colors"
                >
                  בחר תמונות
                </label>
              </div>
              {formData.customStyle.inspirationImages.length > 0 && (
                <div className="mt-3 text-sm text-gray-600">
                  נבחרו {formData.customStyle.inspirationImages.length} תמונות
                </div>
              )}
            </div>

            {/* Branding Materials */}
            <div>
              <label className="block text-lg font-semibold text-[#333333] mb-3">
                חומרי מיתוג
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#f3752b] transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">לוגו, צבעי המותג, פונטים</p>
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
                  className="inline-block bg-[#f3752b] text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-[#e56b26] transition-colors"
                >
                  בחר קבצים
                </label>
              </div>
              {formData.customStyle.brandingMaterials.length > 0 && (
                <div className="mt-3 text-sm text-gray-600">
                  נבחרו {formData.customStyle.brandingMaterials.length} קבצים
                </div>
              )}
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-lg font-semibold text-[#333333] mb-3">
                הוראות מיוחדות
              </label>
              <textarea
                value={formData.customStyle.instructions}
                onChange={(e) => handleCustomStyleChange('instructions', e.target.value)}
                placeholder="תאר את הסגנון הרצוי, צבעים מועדפים, אווירה וכל פרט שיעזור לנו ליצור בדיוק מה שאתה מחפש..."
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f3752b] focus:border-transparent resize-none"
                rows={4}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {errors.selectedStyle && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 font-semibold">{errors.selectedStyle}</p>
        </div>
      )}

      {/* Lightbox Modal */}
      <ImageLightbox
        isOpen={!!lightboxImage}
        imageUrl={lightboxImage?.url || ''}
        title={lightboxImage?.title || ''}
        description={lightboxImage?.description || ''}
        onClose={() => {
          console.log('Closing lightbox');
          setLightboxImage(null);
        }}
      />
    </div>
  );
};

export default StyleSelectionStep;
