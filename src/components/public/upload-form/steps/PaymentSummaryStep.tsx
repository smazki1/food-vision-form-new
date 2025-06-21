
import React from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { Button } from '@/components/ui/button';
import { Check, Clock, Shield, CreditCard } from 'lucide-react';

interface PaymentSummaryStepProps {
  errors: Record<string, string>;
  clearErrors: () => void;
}

const PaymentSummaryStep: React.FC<PaymentSummaryStepProps> = ({ errors, clearErrors }) => {
  const { formData } = useNewItemForm();

  const selectedCategory = formData.selectedCategory;
  const selectedStyle = formData.selectedStyle;
  const customStyle = formData.customStyle;
  const dishCount = formData.dishes.length;

  const getCategoryName = (categoryId: string) => {
    const categories = {
      delivery: 'אפליקציות משלוח',
      social: 'רשתות חברתיות',
      menu: 'תפריטים ומסכי הזמנה',
      marketing: 'פרסום ושיווק',
      all: 'כל הסגנונות'
    };
    return categories[categoryId as keyof typeof categories] || categoryId;
  };

  const getStyleName = (styleId: string) => {
    const styles = {
      'white-bg': 'רקע לבן',
      'dark-bg': 'רקע כהה',
      'wood-bg': 'רקע עץ',
      'colorful-bg': 'רקע צבעוני',
      'instagram-square': 'Instagram מרובע',
      'story-vertical': 'Stories אנכי',
      'facebook-wide': 'Facebook רחב',
      'tiktok-vertical': 'TikTok אנכי',
      'menu-clean': 'תפריט נקי',
      'menu-elegant': 'תפריט אלגנטי',
      'digital-screen': 'מסך דיגיטלי',
      'print-menu': 'תפריט מודפס',
      'ad-banner': 'באנר פרסומי',
      'flyer-style': 'סגנון עלון',
      'poster-style': 'סגנון פוסטר',
      'brochure-style': 'סגנון חוברת'
    };
    return styles[styleId as keyof typeof styles] || styleId;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#333333] mb-4">סיכום וביצוע תשלום</h1>
        <p className="text-gray-600">בדקו את הפרטים ובצעו תשלום לביצוע ההזמנה</p>
      </div>

      {/* Order Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-[#333333] mb-4">סיכום ההזמנה</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">שם העסק:</span>
            <span className="font-medium">{formData.restaurantName}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">איש קשר:</span>
            <span className="font-medium">{formData.submitterName}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">טלפון:</span>
            <span className="font-medium">{formData.phone}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">מספר מנות:</span>
            <span className="font-medium">{dishCount} מנות</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">קטגוריה:</span>
            <span className="font-medium">{getCategoryName(selectedCategory || '')}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">סגנון:</span>
            <span className="font-medium">
              {customStyle ? 'סגנון מותאם אישית' : getStyleName(selectedStyle || '')}
            </span>
          </div>
        </div>
      </div>

      {/* What You Get */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-green-800 mb-4">מה תקבלו</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800">תמונות מקצועיות לכל המנות</span>
          </div>
          
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800">עיצוב מותאם לשימוש שלכם</span>
          </div>
          
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800">קבצים באיכות גבוהה</span>
          </div>
          
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800">זמן אספקה מהיר</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-blue-800 mb-4">מה קורה הלאה?</h3>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800">תוך 24 שעות - נתחיל לעבוד על התמונות</span>
          </div>
          
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800">תוך 2-3 ימי עבודה - תקבלו את התמונות הראשונות</span>
          </div>
          
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800">עד 7 ימי עבודה - כל התמונות יהיו מוכנות</span>
          </div>
        </div>
      </div>

      {/* Guarantee */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-orange-800 mb-4">הערבות שלנו</h3>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Shield className="w-5 h-5 text-orange-600" />
            <span className="text-orange-800">החזר כספי מלא אם לא מרוצים</span>
          </div>
          
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Shield className="w-5 h-5 text-orange-600" />
            <span className="text-orange-800">249₪ זיכוי לחבילה הבאה</span>
          </div>
          
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Shield className="w-5 h-5 text-orange-600" />
            <span className="text-orange-800">שירות לקוחות מהיר ומקצועי</span>
          </div>
        </div>
      </div>

      {/* Price and Payment */}
      <div className="bg-[#8B1E3F] text-white rounded-xl p-6 text-center">
        <h3 className="text-2xl font-bold mb-2">249₪</h3>
        <p className="text-lg mb-4">חבילת ניסיון מיוחדת</p>
        <p className="text-sm opacity-90 mb-6">כולל עיבוד מקצועי לכל המנות + זיכוי מלא לחבילה הבאה</p>
        
        <Button
          size="lg"
          className="bg-[#F3752B] hover:bg-orange-600 text-white px-12 py-4 text-lg font-semibold"
        >
          <CreditCard className="w-5 h-5 mr-2" />
          בצע תשלום - 249₪
        </Button>
      </div>
    </div>
  );
};

export default PaymentSummaryStep;
