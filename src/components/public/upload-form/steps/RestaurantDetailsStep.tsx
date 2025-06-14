
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { Check, Building2 } from 'lucide-react';

const RestaurantDetailsStep: React.FC<PublicStepProps> = ({ errors }) => {
  const { formData, updateFormData } = useNewItemForm();

  const handleBusinessRegistrationChange = (isNewBusiness: boolean) => {
    updateFormData({ isNewBusiness, isLead: isNewBusiness });
  };

  return (
    <div className="space-y-4">
      {/* Business Registration Question - Enhanced Design */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
        <div className="text-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-1">האם העסק שלכם כבר רשום במערכת? *</h3>
          <p className="text-gray-600 text-sm">זה יעזור לנו להתאים את השירות בצורה הטובה ביותר</p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={() => handleBusinessRegistrationChange(false)}
            className={`
              relative px-6 py-4 rounded-xl border-2 transition-all duration-300 min-w-[140px] group
              ${formData.isNewBusiness === false 
                ? 'border-green-500 bg-green-50 text-green-700 shadow-lg scale-105' 
                : 'border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50/50'
              }
            `}
          >
            {formData.isNewBusiness === false && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="font-medium">כן, העסק שלנו רשום</span>
          </button>
          
          <button
            type="button"
            onClick={() => handleBusinessRegistrationChange(true)}
            className={`
              relative px-6 py-4 rounded-xl border-2 transition-all duration-300 min-w-[140px] group
              ${formData.isNewBusiness === true 
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg scale-105' 
                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50/50'
              }
            `}
          >
            {formData.isNewBusiness === true && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="font-medium">לא, זו פעם ראשונה שלנו</span>
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid gap-3">
        <div className="space-y-2">
          <Label htmlFor="restaurantName" className="text-lg font-medium text-gray-800">
            שם המסעדה / העסק *
          </Label>
          <Input
            id="restaurantName"
            type="text"
            placeholder="לדוגמה: מסעדת השף הקטן"
            value={formData.restaurantName}
            onChange={(e) => updateFormData({ restaurantName: e.target.value })}
            className="h-12 text-lg border-2 border-gray-200 focus:border-[#F3752B] rounded-xl"
          />

        </div>

        <div className="space-y-2">
          <Label htmlFor="submitterName" className="text-lg font-medium text-gray-800">
            שם איש הקשר *
          </Label>
          <Input
            id="submitterName"
            type="text"
            placeholder="השם שלכם"
            value={formData.submitterName}
            onChange={(e) => updateFormData({ submitterName: e.target.value })}
            className="h-12 text-lg border-2 border-gray-200 focus:border-[#F3752B] rounded-xl"
          />

        </div>

        {formData.isNewBusiness !== false && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail" className="text-lg font-medium text-gray-800">
                כתובת אימייל{formData.isNewBusiness ? ' *' : ''}
              </Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="your@email.com"
                value={formData.contactEmail || ''}
                onChange={(e) => updateFormData({ contactEmail: e.target.value })}
                className="h-12 text-lg border-2 border-gray-200 focus:border-[#F3752B] rounded-xl"
              />

            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone" className="text-lg font-medium text-gray-800">
                מספר טלפון{formData.isNewBusiness ? ' *' : ''}
              </Label>
              <Input
                id="contactPhone"
                type="tel"
                placeholder="050-1234567"
                value={formData.contactPhone || ''}
                onChange={(e) => updateFormData({ contactPhone: e.target.value })}
                className="h-12 text-lg border-2 border-gray-200 focus:border-[#F3752B] rounded-xl"
              />

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantDetailsStep;
