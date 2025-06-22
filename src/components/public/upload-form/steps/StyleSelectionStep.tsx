import React, { useState } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Palette, Sparkles, MessageSquare } from 'lucide-react';

interface StyleSelectionStepProps {
  errors: Record<string, string>;
  clearErrors: () => void;
  onNext?: () => void;
  onBack?: () => void;
}

const StyleSelectionStep: React.FC<StyleSelectionStepProps> = ({ errors, clearErrors, onNext, onBack }) => {
  const { formData, updateFormData } = useNewItemForm();
  const [showComments, setShowComments] = useState(false);

  const allStyleOptions = {
    delivery: [
      {
        id: 'dark-bg',
        name: 'רקע כהה',
        image: '/lovable-uploads/1e4647a0-37e0-48c6-a75e-914c461d682f.png',
        description: 'אלגנטי ומודרני'
      },
      {
        id: 'white-bg',
        name: 'רקע לבן',
        image: '/lovable-uploads/לבן.png',
        description: 'עיצוב נקי ומינימליסטי'
      },
      {
        id: 'colorful-bg',
        name: 'רקע צבעוני',
        image: '/lovable-uploads/70e6f48e-fc5e-49ec-939d-a73951210a94.png',
        description: 'חיוני ובולט'
      },
      {
        id: 'wood-bg',
        name: 'רקע עץ',
        image: '/lovable-uploads/רקע עץ.png',
        description: 'חם וביתי'
      }
    ],
    social: [
      {
        id: 'atmosphere',
        name: 'אווירה',
        image: '/lovable-uploads/be6c1f5c-cbf9-4561-8c33-a09c74e2255f.png',
        description: 'יוצר אווירה מיוחדת'
      },
      {
        id: 'marketing',
        name: 'שיווקי',
        image: '/lovable-uploads/8d620120-9895-4fa9-81cd-3694b4bb638d.png',
        description: 'מותאם לשיווק ברשתות'
      },
      {
        id: 'elegant',
        name: 'אלגנט',
        image: '/lovable-uploads/31fa48cb-1c38-4542-8ecd-96a4392929c2.png',
        description: 'עיצוב אלגנטי ומתוחכם'
      }
    ],
    menu: [
      {
        id: 'sea',
        name: 'ים',
        image: '/lovable-uploads/8081ae70-1035-4a59-864b-a1963cd24c43.png',
        description: 'רקע ים רגוע'
      },
      {
        id: 'wood-table',
        name: 'שולחן עץ',
        image: '/lovable-uploads/eba0f747-8c59-4187-8502-5e3499f303c0.png',
        description: 'שולחן עץ טבעי'
      },
      {
        id: 'summer',
        name: 'קיצי',
        image: '/lovable-uploads/023230ea-be80-4d63-ba02-d78099f875c7.png',
        description: 'עיצוב קיצי וצבעוני'
      },
      {
        id: 'realistic-closeup',
        name: 'תקריב ריאליסטי',
        image: '/lovable-uploads/ff3b2363-6304-49ac-88bc-d49d593a4173.png',
        description: 'תקריב ריאליסטי של האוכל'
      }
    ],
    marketing: [
      {
        id: 'appetizing',
        name: 'מגרה',
        image: '/lovable-uploads/25b6ed83-5bc5-4f15-b1fc-85634b223c61.png',
        description: 'עיצוב מגרה תיאבון'
      },
      {
        id: 'bold',
        name: 'צעקני',
        image: '/lovable-uploads/c01bc50f-e64a-4dc9-9b08-5e6e3cce7401.png',
        description: 'עיצוב בולט וצעקני'
      },
      {
        id: 'seasonal',
        name: 'עונתי',
        image: '/lovable-uploads/59d2e657-6817-4fd1-9ba4-9031c7ab4249.png',
        description: 'מותאם לעונה'
      },
      {
        id: 'luxury',
        name: 'יוקרתי',
        image: '/lovable-uploads/e015b56a-2de9-405c-8b4f-f531b10c743a.png',
        description: 'עיצוב יוקרתי ומפנק'
      }
    ],
    all: [
      // Delivery styles
      {
        id: 'dark-bg',
        name: 'רקע כהה',
        image: '/lovable-uploads/1e4647a0-37e0-48c6-a75e-914c461d682f.png',
        description: 'אלגנטי ומודרני'
      },
      {
        id: 'white-bg',
        name: 'רקע לבן',
        image: '/lovable-uploads/לבן.png',
        description: 'עיצוב נקי ומינימליסטי'
      },
      {
        id: 'colorful-bg',
        name: 'רקע צבעוני',
        image: '/lovable-uploads/70e6f48e-fc5e-49ec-939d-a73951210a94.png',
        description: 'חיוני ובולט'
      },
      {
        id: 'wood-bg',
        name: 'רקע עץ',
        image: '/lovable-uploads/רקע עץ.png',
        description: 'חם וביתי'
      },
      // Social styles
      {
        id: 'atmosphere',
        name: 'אווירה',
        image: '/lovable-uploads/be6c1f5c-cbf9-4561-8c33-a09c74e2255f.png',
        description: 'יוצר אווירה מיוחדת'
      },
      {
        id: 'marketing',
        name: 'שיווקי',
        image: '/lovable-uploads/8d620120-9895-4fa9-81cd-3694b4bb638d.png',
        description: 'מותאם לשיווק ברשתות'
      },
      {
        id: 'elegant',
        name: 'אלגנט',
        image: '/lovable-uploads/31fa48cb-1c38-4542-8ecd-96a4392929c2.png',
        description: 'עיצוב אלגנטי ומתוחכם'
      },
      // Menu styles
      {
        id: 'sea',
        name: 'ים',
        image: '/lovable-uploads/8081ae70-1035-4a59-864b-a1963cd24c43.png',
        description: 'רקע ים רגוע'
      },
      {
        id: 'wood-table',
        name: 'שולחן עץ',
        image: '/lovable-uploads/eba0f747-8c59-4187-8502-5e3499f303c0.png',
        description: 'שולחן עץ טבעי'
      },
      {
        id: 'summer',
        name: 'קיצי',
        image: '/lovable-uploads/023230ea-be80-4d63-ba02-d78099f875c7.png',
        description: 'עיצוב קיצי וצבעוני'
      },
      {
        id: 'realistic-closeup',
        name: 'תקריב ריאליסטי',
        image: '/lovable-uploads/ff3b2363-6304-49ac-88bc-d49d593a4173.png',
        description: 'תקריב ריאליסטי של האוכל'
      },
      // Marketing styles
      {
        id: 'appetizing',
        name: 'מגרה',
        image: '/lovable-uploads/25b6ed83-5bc5-4f15-b1fc-85634b223c61.png',
        description: 'עיצוב מגרה תיאבון'
      }
    ]
  };

  const selectedCategory = formData.selectedCategory || 'delivery';
  const styleOptions = allStyleOptions[selectedCategory as keyof typeof allStyleOptions] || allStyleOptions.delivery;

  const handleStyleSelect = (styleId: string) => {
    updateFormData({
      selectedStyle: styleId,
      customStyle: undefined
    });
    setShowComments(true);
    clearErrors();
  };

  const handleCustomStyleSelect = () => {
    updateFormData({
      selectedStyle: '',
      customStyle: 'סגנון מותאם אישית'
    });
    setShowComments(true);
    clearErrors();
  };

  const handleCommentsChange = (value: string) => {
    updateFormData({
      styleComments: value
    });
  };

  const getFirstImageUrl = () => {
    if (formData.dishes && formData.dishes.length > 0) {
      const firstDish = formData.dishes[0];
      if (firstDish.referenceImages && firstDish.referenceImages.length > 0) {
        return URL.createObjectURL(firstDish.referenceImages[0]);
      }
    }
    return null;
  };

  const firstImageUrl = getFirstImageUrl();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Palette className="w-8 h-8 text-[#F3752B]" />
          <h1 className="text-4xl font-bold text-[#333333]">בחרו סגנון עיצוב</h1>
          <Sparkles className="w-8 h-8 text-[#F3752B]" />
        </div>
        <p className="text-xl text-gray-600">איך תרצו שהתמונות שלכם ייראו?</p>
      </div>

      {/* Style Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {styleOptions.map((style) => (
          <div
            key={style.id}
            className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${
              formData.selectedStyle === style.id 
                ? 'ring-4 ring-[#F3752B] shadow-2xl' 
                : 'hover:ring-2 hover:ring-[#F3752B]/50'
            }`}
            onClick={() => handleStyleSelect(style.id)}
          >
            <div className="aspect-[4/3] relative">
              {firstImageUrl ? (
                <img
                  src={firstImageUrl}
                  alt={style.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={style.image}
                  alt={style.name}
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Overlay with style preview */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-xl font-bold mb-1">{style.name}</h3>
                  <p className="text-sm opacity-90">{style.description}</p>
                </div>
              </div>

              {/* Selection indicator */}
              {formData.selectedStyle === style.id && (
                <div className="absolute top-4 right-4 w-8 h-8 bg-[#F3752B] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">✓</span>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-[#F3752B]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="bg-white/90 px-4 py-2 rounded-full text-[#333333] font-semibold">
                  בחר סגנון
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Style Option */}
      <div className="mt-8">
        <div
          className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-2 border-dashed ${
            formData.customStyle 
              ? 'border-[#F3752B] bg-[#F3752B]/5 shadow-lg' 
              : 'border-gray-300 hover:border-[#F3752B]/50 bg-gray-50'
          }`}
          onClick={handleCustomStyleSelect}
        >
          <div className="p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className={`w-8 h-8 ${formData.customStyle ? 'text-[#F3752B]' : 'text-gray-400'}`} />
              <h3 className={`text-2xl font-bold ${formData.customStyle ? 'text-[#F3752B]' : 'text-gray-600'}`}>
                סגנון מותאם אישית
              </h3>
            </div>
            <p className="text-gray-600 text-lg">
              יש לכם רעיון מיוחד? נעצב בדיוק לפי הבקשה שלכם
            </p>
            
            {formData.customStyle && (
              <div className="mt-4 inline-flex items-center gap-2 bg-[#F3752B] text-white px-4 py-2 rounded-full">
                <span className="font-bold">✓</span>
                <span>נבחר</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comments Section - Shows when a style is selected */}
      {showComments && (formData.selectedStyle || formData.customStyle) && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 shadow-lg animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <h3 className="text-2xl font-bold text-blue-800">הערות מיוחדות לעיצוב</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-blue-700 text-lg">
              יש לכם בקשות מיוחדות לעיצוב? כתבו כאן!
            </p>
            
            <div className="space-y-2">
              <label className="block text-blue-800 font-semibold">
                למשל: "אשמח שזה יהיה בזווית תקריב", "רוצה שהלוגו יופיע", או כל בקשה אחרת
              </label>
              <Textarea
                placeholder="כתבו כאן את ההערות המיוחדות שלכם לעיצוב..."
                value={formData.styleComments || ''}
                onChange={(e) => handleCommentsChange(e.target.value)}
                className="min-h-[120px] text-lg border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                dir="rtl"
              />
            </div>
            
            <div className="text-sm text-blue-600 bg-blue-100 p-3 rounded-lg">
              💡 <strong>טיפ:</strong> ככל שתהיו יותר מפורטים, כך נוכל ליצור בדיוק את מה שאתם מחפשים
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-center gap-4 mt-12">
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            className="px-8 py-3 text-gray-700 border-gray-300 hover:bg-gray-50 rounded-full min-w-[120px]"
          >
            חזור
          </Button>
        )}
        
        {(formData.selectedStyle || formData.customStyle) && onNext && (
          <Button
            onClick={onNext}
            className="px-8 py-3 bg-[#F3752B] hover:bg-orange-600 text-white rounded-full min-w-[120px] font-semibold"
          >
            המשך
          </Button>
        )}
      </div>

      {/* Error Display */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
          <div className="text-red-800">
            {Object.values(errors).map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleSelectionStep;
