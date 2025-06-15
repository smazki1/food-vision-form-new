
import React from 'react';
import { IconInput } from '@/components/ui/icon-input';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { StepProps } from '../FoodVisionUploadForm';
import { Store, Sparkles } from 'lucide-react';

const RestaurantDetailsStep: React.FC<StepProps> = ({ errors, clearExternalErrors }) => {
  const { formData, updateFormData } = useNewItemForm();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updateFormData({ [e.target.name]: e.target.value });
    if (clearExternalErrors) clearExternalErrors();
  };

  return (
    <div className="space-y-8 animate-fade-in" dir="rtl">
      {/* Enhanced Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#8B1E3F] to-[#7A1B37] rounded-full mb-6 shadow-xl relative overflow-hidden group">
          <Store className="h-10 w-10 text-white relative z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">פרטי המסעדה שלכם</h2>
        <div className="max-w-lg mx-auto">
          <p className="text-base text-gray-600 leading-relaxed">
            מידע זה יעזור לנו להתאים לכם את השירות בצורה הטובה ביותר ולשייך את ההגשות לחשבונכם.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-[#F3752B] bg-orange-50 px-4 py-2 rounded-full">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">שלב ראשון מתוך הטופס</span>
          </div>
        </div>
      </div>

      {/* Enhanced Form Field */}
      <div className="max-w-md mx-auto space-y-6">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8B1E3F] to-[#F3752B] rounded-2xl opacity-20 group-focus-within:opacity-40 transition-opacity duration-300"></div>
          <div className="relative bg-white rounded-2xl p-1">
            <IconInput
              id="restaurantName"
              name="restaurantName"
              label="שם המסעדה"
              value={formData.restaurantName || ''}
              onChange={handleChange}
              placeholder="לדוגמה: פיצה כרמל"
              error={errors?.restaurantName}
              icon={<Store className="w-5 h-5" />}
              iconPosition="right"
              className="border-0 shadow-lg text-lg h-14 rounded-xl focus:ring-2 focus:ring-[#8B1E3F]/20 transition-all duration-300"
            />
          </div>
        </div>

        {/* Helpful Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            טיפים שימושיים
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 shrink-0"></div>
              <span>הזינו את השם המדויק של המסעדה כפי שהוא מופיע רשמית</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 shrink-0"></div>
              <span>אם יש לכם כמה סניפים, ציינו גם את המיקום</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetailsStep;
