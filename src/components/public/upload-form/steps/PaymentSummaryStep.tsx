import React from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentSummaryStepProps {
  errors: Record<string, string>;
  clearErrors: () => void;
  onPrevious?: () => void;
  onSubmit?: () => Promise<void>;
}

const PaymentSummaryStep: React.FC<PaymentSummaryStepProps> = ({ errors, clearErrors, onPrevious, onSubmit }) => {
  const { formData } = useNewItemForm();

  const selectedCategory = formData.selectedCategory;
  const selectedStyle = formData.selectedStyle;
  const customStyle = formData.customStyle;
  const dishCount = formData.dishes.length;

  const getCategoryName = (categoryId: string) => {
    const categories = {
      delivery: 'אפליקציות משלוחים',
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
    <div className="space-y-8 sm:space-y-12">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-4 sm:mb-6 shadow-lg">
          <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-[#333333] mb-3 sm:mb-4 px-2">סיכום וביצוע תשלום</h1>
        <p className="text-gray-600 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed px-4">
          בדקו את הפרטים ובצעו תשלום לביצוע ההזמנה - חבילת הטעימות שלכם/ן כמעט מוכנה!
        </p>
      </div>

      {/* Mobile-Optimized Order Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 mx-2 sm:mx-0">
        <h3 className="text-lg sm:text-xl font-semibold text-[#333333] mb-3 sm:mb-4">סיכום ההזמנה</h3>
        
        <div className="space-y-2 sm:space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-gray-600 text-sm sm:text-base">שם העסק:</span>
            <span className="font-medium text-sm sm:text-base text-right max-w-[60%]">{formData.restaurantName}</span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-gray-600 text-sm sm:text-base">איש קשר:</span>
            <span className="font-medium text-sm sm:text-base text-right max-w-[60%]">{formData.submitterName}</span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-gray-600 text-sm sm:text-base">טלפון:</span>
            <span className="font-medium text-sm sm:text-base text-right max-w-[60%]">{formData.phone}</span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-gray-600 text-sm sm:text-base">מספר מנות:</span>
            <span className="font-medium text-sm sm:text-base text-right max-w-[60%]">{dishCount} מנות</span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-gray-600 text-sm sm:text-base">קטגוריה:</span>
            <span className="font-medium text-sm sm:text-base text-right max-w-[60%]">{getCategoryName(selectedCategory || '')}</span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-gray-600 text-sm sm:text-base">סגנון:</span>
            <span className="font-medium text-sm sm:text-base text-right max-w-[60%]">
              {customStyle ? 'סגנון מותאם אישית' : getStyleName(selectedStyle || '')}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Payment Section */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-8 rounded-2xl border-2 border-green-200 shadow-lg mx-2 sm:mx-0">
        <div className="text-center mb-6 sm:mb-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-green-800 mb-2">מוכנים להתחיל?</h3>
        </div>

        <div className="text-center space-y-4 sm:space-y-6">
          <Button
            size="lg"
            className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 sm:px-12 py-4 sm:py-6 text-lg sm:text-2xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 touch-manipulation"
            onClick={() => {
              // Redirect to iCount payment page
              window.location.href = 'https://app.icount.co.il/m/7f0d1/c12db4pa6u685838e50?utm_source=iCount&utm_medium=paypage&utm_campaign=166';
            }}
          >
            כן, אני רוצה את התמונות!
          </Button>
          
          {/* Mobile-Optimized Back Button */}
          {onPrevious && (
            <div>
              <Button
                onClick={onPrevious}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 rounded-xl font-semibold text-sm sm:text-base touch-manipulation"
              >
                חזרה לעריכה
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSummaryStep;

