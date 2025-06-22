
import React from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { Button } from '@/components/ui/button';
import { Check, Clock, Shield, CreditCard, Star, Sparkles, Timer, Award, ChevronRight } from 'lucide-react';

interface PaymentSummaryStepProps {
  errors: Record<string, string>;
  clearErrors: () => void;
  onBack?: () => void;
}

const PaymentSummaryStep: React.FC<PaymentSummaryStepProps> = ({ errors, clearErrors, onBack }) => {
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

  const handlePaymentRedirect = () => {
    const PAYMENT_URL = "https://app.icount.co.il/m/c2d28/c12db4pa2u68489a290?utm_source=iCount&utm_medium=paypage&utm_campaign=162";
    window.location.href = PAYMENT_URL;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-8 h-8 text-[#F3752B]" />
          <h1 className="text-4xl font-bold text-[#333333]">סיכום וביצוע תשלום</h1>
          <Sparkles className="w-8 h-8 text-[#F3752B]" />
        </div>
        <p className="text-xl text-gray-600">בדקו את הפרטים ובצעו תשלום לביצוע ההזמנה</p>
      </div>

      {/* Order Summary */}
      <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-6 h-6 text-[#8B1E3F]" />
          <h3 className="text-2xl font-bold text-[#333333]">סיכום ההזמנה</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600 font-medium">שם העסק:</span>
              <span className="font-bold text-[#333333]">{formData.restaurantName}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600 font-medium">איש קשר:</span>
              <span className="font-bold text-[#333333]">{formData.submitterName}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600 font-medium">טלפון:</span>
              <span className="font-bold text-[#333333]">{formData.phone}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600 font-medium">מספר מנות:</span>
              <span className="font-bold text-[#8B1E3F] text-lg">{dishCount} מנות</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600 font-medium">קטגוריה:</span>
              <span className="font-bold text-[#333333]">{getCategoryName(selectedCategory || '')}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600 font-medium">סגנון:</span>
              <span className="font-bold text-[#333333]">
                {customStyle ? 'סגנון מותאם אישית' : getStyleName(selectedStyle || '')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* What You Get */}
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <Star className="w-6 h-6 text-emerald-600" />
          <h3 className="text-2xl font-bold text-emerald-800">מה תקבלו</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-emerald-800 font-semibold text-lg">תמונות מקצועיות לכל המנות</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-emerald-800 font-semibold text-lg">עיצוב מקצועי ומותאם</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-emerald-800 font-semibold text-lg">קבצים באיכות גבוהה</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-emerald-800 font-semibold text-lg">זמן אספקה מהיר</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <Timer className="w-6 h-6 text-blue-600" />
          <h3 className="text-2xl font-bold text-blue-800">לוח זמנים</h3>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="font-bold text-blue-800 text-lg">תוך 24 שעות</div>
              <div className="text-blue-700">נתחיל לעבוד על התמונות</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="font-bold text-blue-800 text-lg">תוך 2-3 ימי עבודה</div>
              <div className="text-blue-700">תקבלו את התמונות הראשונות</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="font-bold text-blue-800 text-lg">עד 7 ימי עבודה</div>
              <div className="text-blue-700">כל התמונות יהיו מוכנות</div>
            </div>
          </div>
        </div>
      </div>

      {/* Guarantee */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-orange-600" />
          <h3 className="text-2xl font-bold text-orange-800">הערבות שלנו</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-orange-800 font-semibold">שביעות רצון מלאה או החזר כספי</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-orange-800 font-semibold">תמיכה מקצועית לאורך כל הדרך</span>
          </div>
        </div>
      </div>

      {/* Payment Button */}
      <div className="text-center">
        <Button
          onClick={handlePaymentRedirect}
          size="lg"
          className="bg-[#F3752B] hover:bg-orange-600 text-white px-16 py-6 text-xl font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <CreditCard className="w-6 h-6 mr-3" />
          בצע תשלום - 249₪
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex justify-center mt-8">
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            className="px-8 py-3 text-gray-700 border-gray-300 hover:bg-gray-50 rounded-full"
          >
            <ChevronRight className="w-4 h-4 mr-2" />
            חזור
          </Button>
        )}
      </div>
    </div>
  );
};

export default PaymentSummaryStep;
