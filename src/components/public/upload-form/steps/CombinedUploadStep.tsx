
import React from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import DishFormSection from './components/DishFormSection';
import { Camera, Lightbulb, Upload } from 'lucide-react';

const CombinedUploadStep: React.FC<PublicStepProps> = ({ errors }) => {
  const { formData, dishes, addDish, removeDish, updateDish } = useNewItemForm();

  const handleAddDish = () => {
    addDish();
  };

  const handleRemoveDish = (dishId: string) => {
    if (formData.dishes.length > 1) {
      removeDish(dishId);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <Upload className="w-12 h-12 text-[#F3752B] mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-800 mb-3">העלאת מנות ומוצרים</h2>
        <p className="text-gray-600 text-lg">הזמן להציג את היצירות הקולינריות שלכם</p>
      </div>

      {/* Photography Tips Section - Refined Design */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 px-6 py-4 border-b border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-800">טיפים לצילום מושלם</h3>
              <p className="text-amber-700 text-sm">כמה עצות קצרות לתמונות מקצועיות</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700 text-sm">צילום באור טבעי הוא הטוב ביותר</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700 text-sm">הימנעו מפלאש - זה יוצר צללים</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700 text-sm">ודאו שהמנה בפוקוס ומבחינת המנה</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700 text-sm">צלמו מכמה זוויות שונות לתוצאה טובה</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700 text-sm">ודאו שהמנות חיות ומושכות - זה מה שמושך לקוחות!</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="space-y-6">
        {formData.dishes.map((dish, index) => (
          <div key={dish.id} className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#F3752B] text-white rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold text-gray-800">מנה #{index + 1}</h3>
              </div>
              
              {formData.dishes.length > 1 && (
                <button
                  onClick={() => handleRemoveDish(dish.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                >
                  הסר מנה
                </button>
              )}
            </div>

            <DishFormSection
              dish={dish}
              errors={errors}
              onUpdate={(updates) => updateDish(dish.id, updates)}
            />
          </div>
        ))}

        {/* Add Another Dish Button - Only for non-leads */}
        {!formData.isLead && (
          <div className="text-center">
            <button
              onClick={handleAddDish}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Lightbulb className="w-5 h-5" />
              הוספת מנה נוספת
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CombinedUploadStep;
