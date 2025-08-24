import React, { useState } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface PaymentSummaryStepProps {
  errors: Record<string, string>;
  clearErrors: () => void;
  onPrevious?: () => void;
  onSubmit?: () => Promise<void>;
}

const PaymentSummaryStep: React.FC<PaymentSummaryStepProps> = ({ errors, clearErrors, onPrevious, onSubmit }) => {
  const { formData } = useNewItemForm();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // Delivery styles
      'light-bg': 'רקע נקי קלאסי',
      'dark-bg': 'רקע כהה דרמטי',
      'wood-bg': 'רקע טבעי ארטיזני',
      'colorful-bg': 'צבעוני ומושך',
      // Social media styles
      'appetite': 'מקצועי ונקי',
      'eye-catching': 'אמנותי ומרהיב',
      'luxurious': 'אלגנטי ויוקרתי',
      'special': 'אינסטגרמי ומתוק',
      // Menu styles
      'clean-simple': 'חוף ים ונופש',
      'elegant-sophisticated': 'נקי ופשוט',
      'fresh-summery': 'קייצי ורענן',
      'homey-warm': 'טבעי וחם',
      // Marketing styles
      'shouting': 'יוקרתי ונקי',
      'seasonal': 'חגיגי ומסורתי',
      'appetizing': 'דרמטי ומעורר תיאבון',
      'luxury': 'מודרני ומתוחכם'
    };
    return styles[styleId as keyof typeof styles] || styleId;
  };

  return (
    <div className="space-y-8 sm:space-y-12">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-4 sm:mb-6 shadow-lg">
          <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-[#333333] mb-3 sm:mb-4 px-2">סיכום ושליחה</h1>
        <p className="text-gray-600 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed px-4">בדקו את הפרטים ושלחו את ההגשה. ניתן גם לחזור לדף הלקוח.</p>
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

      {/* Submit Section */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-8 rounded-2xl border-2 border-green-200 shadow-lg mx-2 sm:mx-0">
        <div className="text-center mb-6 sm:mb-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-green-800 mb-2">מוכנים לשלוח?</h3>
        </div>

        <div className="text-center space-y-4 sm:space-y-6">
          <Button
            size="lg"
            className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 sm:px-12 py-4 sm:py-6 text-lg sm:text-2xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 touch-manipulation"
            onClick={async () => {
              if (isSubmitting) return;
              setIsSubmitting(true);
              
              try {
                // Save submission and wait for it to complete
                if (onSubmit) {
                  await onSubmit();
                  // After successful submission, navigate to customer's submissions page
                  navigate('/customer/submissions');
                }
              } catch (error) {
                console.error('Submission error:', error);
                setIsSubmitting(false);
              }
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                שולח הגשה...
              </>
            ) : (
              'שלח הגשה'
            )}
          </Button>
          
          {/* Secondary actions */}
          <div>
            {onPrevious && (
              <Button
                onClick={onPrevious}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 rounded-xl font-semibold text-sm sm:text-base touch-manipulation mr-2"
              >
                חזרה לעריכה
              </Button>
            )}
            <Button
              onClick={() => navigate('/customer/dashboard')}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto mt-3 sm:mt-0 px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 rounded-xl font-semibold text-sm sm:text-base touch-manipulation"
            >
              חזרה לדף הלקוח
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSummaryStep;

