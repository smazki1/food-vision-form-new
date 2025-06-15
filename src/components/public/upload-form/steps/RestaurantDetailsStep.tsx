
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { Check, Building2, Sparkles, Users, AlertCircle, Mail, Phone } from 'lucide-react';

const RestaurantDetailsStep: React.FC<PublicStepProps> = ({ errors }) => {
  const { formData, updateFormData } = useNewItemForm();

  const handleBusinessRegistrationChange = (isNewBusiness: boolean) => {
    updateFormData({ isNewBusiness, isLead: isNewBusiness });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Enhanced Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#8B1E3F] to-[#7A1B37] rounded-full mb-2 shadow-xl relative overflow-hidden group">
          <Building2 className="h-10 w-10 text-white relative z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">בואו נכיר!</h2>
        <p className="text-lg text-gray-600 max-w-lg mx-auto leading-relaxed">
          ספרו לנו על העסק שלכם
        </p>
      </div>

      {/* Business Registration Question - Enhanced Design */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-6 border-2 border-blue-100 shadow-lg animate-slide-in-right">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-3 shadow-lg">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">האם העסק שלכם כבר רשום במערכת? *</h3>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => handleBusinessRegistrationChange(false)}
            className={`
              relative px-8 py-6 rounded-2xl border-2 transition-all duration-300 min-w-[160px] group flex-1 hover:scale-105 active:scale-95
              ${formData.isNewBusiness === false 
                ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 text-green-700 shadow-xl shadow-green-500/20 scale-105' 
                : 'border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50/50 shadow-lg'
              }
            `}
          >
            {formData.isNewBusiness === false && (
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <Check className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="text-center">
              <div className="text-xl font-bold mb-1">כן, העסק שלנו רשום</div>
              <div className="text-sm opacity-80">לקוח קיים במערכת</div>
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => handleBusinessRegistrationChange(true)}
            className={`
              relative px-8 py-6 rounded-2xl border-2 transition-all duration-300 min-w-[160px] group flex-1 hover:scale-105 active:scale-95
              ${formData.isNewBusiness === true 
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-xl shadow-blue-500/20 scale-105' 
                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50/50 shadow-lg'
              }
            `}
          >
            {formData.isNewBusiness === true && (
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <Check className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="text-center">
              <div className="text-xl font-bold mb-1">לא, זו פעם ראשונה</div>
              <div className="text-sm opacity-80">לקוח חדש במערכת</div>
            </div>
          </button>
        </div>
      </div>

      {/* Enhanced Form Fields */}
      <div className="grid gap-5 max-w-xl mx-auto">
        <div className="space-y-2 group">
          <Label htmlFor="restaurantName" className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#8B1E3F]" />
            שם המסעדה / העסק *
          </Label>
          <Input
            id="restaurantName"
            type="text"
            placeholder="לדוגמה: מסעדת השף הקטן"
            value={formData.restaurantName}
            onChange={(e) => updateFormData({ restaurantName: e.target.value })}
            className={`h-14 text-lg border-2 rounded-2xl transition-all duration-300 shadow-lg focus:shadow-xl px-4 ${
              errors?.restaurantName 
                ? 'border-red-300 focus:border-red-500 bg-red-50' 
                : 'border-gray-200 focus:border-[#F3752B] bg-white hover:border-gray-300'
            }`}
          />
          {errors?.restaurantName && (
            <div className="flex items-center gap-2 text-red-600 text-sm font-medium animate-shake">
              <AlertCircle className="w-4 h-4" />
              {errors.restaurantName}
            </div>
          )}
          <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
            💡 אם העסק כבר קיים במערכת, כתבו את השם המדויק שלו
          </p>
        </div>

        <div className="space-y-2 group">
          <Label htmlFor="submitterName" className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#8B1E3F]" />
            שם איש הקשר *
          </Label>
          <Input
            id="submitterName"
            type="text"
            placeholder="השם שלכם"
            value={formData.submitterName}
            onChange={(e) => updateFormData({ submitterName: e.target.value })}
            className={`h-14 text-lg border-2 rounded-2xl transition-all duration-300 shadow-lg focus:shadow-xl px-4 ${
              errors?.submitterName 
                ? 'border-red-300 focus:border-red-500 bg-red-50' 
                : 'border-gray-200 focus:border-[#F3752B] bg-white hover:border-gray-300'
            }`}
          />
          {errors?.submitterName && (
            <div className="flex items-center gap-2 text-red-600 text-sm font-medium animate-shake">
              <AlertCircle className="w-4 h-4" />
              {errors.submitterName}
            </div>
          )}
        </div>

        {/* Conditional Email Field - Only show for new businesses */}
        {formData.isNewBusiness === true && (
          <div className="space-y-2 group animate-fade-in">
            <Label htmlFor="contactEmail" className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#8B1E3F]" />
              כתובת אימייל *
            </Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="your@email.com"
              value={formData.contactEmail || ''}
              onChange={(e) => updateFormData({ contactEmail: e.target.value })}
              className={`h-14 text-lg border-2 rounded-2xl transition-all duration-300 shadow-lg focus:shadow-xl px-4 ${
                errors?.contactEmail 
                  ? 'border-red-300 focus:border-red-500 bg-red-50' 
                  : 'border-gray-200 focus:border-[#F3752B] bg-white hover:border-gray-300'
              }`}
            />
            {errors?.contactEmail && (
              <div className="flex items-center gap-2 text-red-600 text-sm font-medium animate-shake">
                <AlertCircle className="w-4 h-4" />
                {errors.contactEmail}
              </div>
            )}
          </div>
        )}

        {/* Conditional Phone Field - Only show for new businesses */}
        {formData.isNewBusiness === true && (
          <div className="space-y-2 group animate-fade-in">
            <Label htmlFor="contactPhone" className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Phone className="w-5 h-5 text-[#8B1E3F]" />
              מספר טלפון *
            </Label>
            <Input
              id="contactPhone"
              type="tel"
              placeholder="050-1234567"
              value={formData.contactPhone || ''}
              onChange={(e) => updateFormData({ contactPhone: e.target.value })}
              className={`h-14 text-lg border-2 rounded-2xl transition-all duration-300 shadow-lg focus:shadow-xl px-4 ${
                errors?.contactPhone 
                  ? 'border-red-300 focus:border-red-500 bg-red-50' 
                  : 'border-gray-200 focus:border-[#F3752B] bg-white hover:border-gray-300'
              }`}
            />
            {errors?.contactPhone && (
              <div className="flex items-center gap-2 text-red-600 text-sm font-medium animate-shake">
                <AlertCircle className="w-4 h-4" />
                {errors.contactPhone}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantDetailsStep;
