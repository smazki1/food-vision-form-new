
import React from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { UtensilsCrossed, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const ItemDetailsStep: React.FC<PublicStepProps> = ({ errors: externalErrors, clearExternalErrors }) => {
  const { formData, updateFormData } = useNewItemForm();
  const errors = externalErrors || {};

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
    if (errors && errors[name] && clearExternalErrors) {
      clearExternalErrors();
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-[#333333] mb-4">
          פרטי המנה / מוצר
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          ספרו לנו על המנה שלכם כדי שנוכל ליצור עבורכם תמונה מושלמת
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-8 max-w-3xl mx-auto">
        {/* Item Name */}
        <div className="space-y-3">
          <label htmlFor="itemName" className="block text-lg font-semibold text-[#333333] flex items-center">
            <UtensilsCrossed className="w-6 h-6 text-[#F3752B] ml-3" />
            שם המנה / המוצר
            <span className="text-red-500 mr-1">*</span>
          </label>
          <input
            id="itemName"
            name="itemName"
            type="text"
            value={formData.itemName}
            onChange={(e) => updateFormData({ itemName: e.target.value })}
            placeholder="לדוגמה: פסטה קרבונרה, מוחיטו קלאסי"
            className={cn(
              "w-full px-6 py-4 text-lg border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#F3752B]/20",
              errors?.itemName 
                ? "border-red-500 bg-red-50" 
                : "border-gray-200 focus:border-[#F3752B] bg-white hover:border-gray-300"
            )}
          />
          {errors?.itemName && (
            <p className="text-red-500 text-sm mt-2 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full ml-2"></span>
              {errors.itemName}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-3">
          <label htmlFor="description" className="block text-lg font-semibold text-[#333333] flex items-center">
            <FileText className="w-6 h-6 text-[#F3752B] ml-3" />
            תיאור קצר של המנה / המוצר
            <span className="text-red-500 mr-1">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="ספר לנו על המנה ואת המרכיבים העיקריים שחשוב שיראו בתמונה (לדוג' סלט קיסר עם אגוזי מלך ורוטב בלסמי. חשוב להראות את הרוטב בסלט)."
            rows={5}
            className={cn(
              "w-full px-6 py-4 text-lg border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#F3752B]/20 resize-none",
              errors?.description 
                ? "border-red-500 bg-red-50" 
                : "border-gray-200 focus:border-[#F3752B] bg-white hover:border-gray-300"
            )}
          />
          {errors?.description && (
            <p className="text-red-500 text-sm mt-2 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full ml-2"></span>
              {errors.description}
            </p>
          )}
        </div>

        {/* Special Notes */}
        <div className="space-y-3">
          <label htmlFor="specialNotes" className="block text-lg font-semibold text-[#333333] flex items-center">
            <FileText className="w-6 h-6 text-emerald-500 ml-3" />
            הערות מיוחדות
            <span className="text-sm text-gray-500 font-normal mr-2">(אופציונלי)</span>
          </label>
          <textarea
            id="specialNotes"
            name="specialNotes"
            value={formData.specialNotes}
            onChange={handleChange}
            placeholder="לדוג': להציג את הסלט עם קרוטונים, בלי בצל, להבליט את הרוטב, עדיף צלחת לבנה"
            rows={4}
            className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#F3752B]/20 focus:border-[#F3752B] bg-white hover:border-gray-300 resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default ItemDetailsStep;
