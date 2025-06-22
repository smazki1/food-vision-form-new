
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
    <div className="space-y-12">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-6 shadow-lg">
          <CreditCard className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-[#333333] mb-4">סיכום וביצוע תשלום</h1>
        <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
          בדקו את הפרטים ובצעו תשלום לביצוע ההזמנה - חבילת הטעימות שלכם כמעט מוכנה!
        </p>
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





      {/* Payment Section */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border-2 border-green-200 shadow-lg">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-green-800 mb-2">מוכנים להתחיל?</h3>
        </div>

        <div className="text-center space-y-6">
          <Button
            size="lg"
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-16 py-6 text-2xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            onClick={() => {
              if (onSubmit) {
                onSubmit();
              } else {
                // Fallback for testing
                toast.info('מעבד את ההגשה...');
                setTimeout(() => {
                  toast.success('ההזמנה נשלחה בהצלחה!');
                  window.location.href = '/thank-you';
                }, 1000);
              }
            }}
          >
            <CreditCard className="w-6 h-6 mr-3" />
            המשך לתשלום
          </Button>
          
          {/* Back Button */}
          {onPrevious && (
            <div>
              <Button
                onClick={onPrevious}
                variant="outline"
                size="lg"
                className="px-8 py-4 border-2 border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 rounded-xl font-semibold"
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

