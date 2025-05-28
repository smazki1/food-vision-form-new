
import React from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { Separator } from '@/components/ui/separator';
import { Image as ImageIcon, Building2, Sparkles as ItemIcon, AlertTriangle, CheckCircle, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils'; 
import { Button } from '@/components/ui/button';

interface ReviewItemProps {
  label: string;
  value?: string | null;
  isMissing?: boolean;
}

const ReviewItem: React.FC<ReviewItemProps> = ({ label, value, isMissing }) => {
  if (!value && !isMissing) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2">
      <dt className="text-sm font-medium text-gray-500 sm:w-1/3">{label}</dt>
      <dd className={cn("mt-1 text-sm text-gray-800 sm:mt-0 sm:w-2/3", isMissing && !value && "text-red-500 italic")}>
        {value || (isMissing ? "לא סופק" : "-")}
      </dd>
    </div>
  );
};

const ReviewSubmitStep: React.FC<PublicStepProps> = ({ errors, onFinalSubmit }) => {
  const { formData } = useNewItemForm();

  const { 
    restaurantName, submitterName,
    itemName, itemType, description, specialNotes, referenceImages 
  } = formData;

  const itemTypeDisplay: Record<string, string> = {
    dish: "מנה",
    cocktail: "קוקטייל",
    drink: "משקה"
  };

  const canSubmit = true; 

  return (
    <div className="space-y-8" dir="rtl">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">סקירה ואישור</h2>
        <p className="text-lg text-muted-foreground mb-8">
          אנא בדקו את כל הפרטים שהזנתם/ן לפני ההגשה הסופית.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center mb-3">
          <Building2 className="h-6 w-6 text-emerald-500 ml-3" /> 
          <h3 className="text-lg font-semibold text-gray-700">פרטי מסעדה</h3>
        </div>
        <dl className="divide-y divide-gray-200 rounded-md border border-gray-200 p-4 bg-white">
          <ReviewItem label="שם המסעדה" value={restaurantName} isMissing={!restaurantName} />
          <ReviewItem label="שם המגיש" value={submitterName} isMissing={!submitterName} />
        </dl>
        <Separator className="my-6" />
      </section>

      <section className="space-y-4">
        <div className="flex items-center mb-3">
          <ItemIcon className="h-6 w-6 text-emerald-500 ml-3" /> 
          <h3 className="text-lg font-semibold text-gray-700">פרטי הפריט</h3>
        </div>
        <dl className="divide-y divide-gray-200 rounded-md border border-gray-200 p-4 bg-white">
          <ReviewItem label="שם הפריט" value={itemName} isMissing={!itemName} />
          <ReviewItem label="סוג הפריט" value={itemType ? itemTypeDisplay[itemType] : undefined} isMissing={!itemType} />
          <ReviewItem label="תיאור/מרכיבים" value={description} />
          <ReviewItem label="הערות מיוחדות" value={specialNotes} />
        </dl>
        <Separator className="my-6" />
      </section>

      <section className="space-y-4">
         <div className="flex items-center mb-3">
            <ImageIcon className="h-6 w-6 text-emerald-500 ml-3" /> 
            <h3 className="text-lg font-semibold text-gray-700">תמונות שהועלו ({referenceImages.length})</h3>
          </div>
          {referenceImages.length > 0 ? (
          <div className="space-y-4 p-4 border border-gray-200 rounded-md bg-white">
              {referenceImages.map((file, index) => (
              <div key={index} className="relative group w-full bg-gray-100 rounded-lg shadow-sm overflow-hidden border border-gray-200 aspect-video">
                  <img 
                    src={URL.createObjectURL(file)} 
                  alt={`תצוגה מקדימה ${index + 1}`} 
                  className="w-full h-full object-contain"
                  onLoad={() => {if (file instanceof File) URL.revokeObjectURL(file.name);}}
                  />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1.5 truncate text-center">
                    {file instanceof File ? file.name : `Image ${index + 1}`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div className="p-4 border border-gray-200 rounded-md bg-white">
            <p className="text-muted-foreground text-center py-4">לא הועלו תמונות.</p>
          </div>
          )}
        <Separator className="my-6" />
      </section>

      {onFinalSubmit && (
        <Button
            onClick={onFinalSubmit}
            disabled={!canSubmit || (errors && Object.keys(errors).length > 0 && !errors.finalCheck && !errors.submit) }
            className={cn(
                "w-full text-lg md:text-xl font-bold py-6 px-8 rounded-xl shadow-lg transition-all duration-200 ease-in-out transform hover:-translate-y-1 hover:shadow-xl",
                "flex items-center justify-center gap-x-3 rtl:gap-x-reverse",
                "border-2",
                canSubmit 
                ? "bg-[#8B1E3F] hover:bg-[#721832] border-[#8B1E3F] hover:border-[#721832] text-white focus-visible:ring-[#8B1E3F]" 
                : "bg-gray-300 hover:bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed shadow-inner",
                (errors && (errors.finalCheck || errors.submit)) && "bg-red-500 hover:bg-red-600 border-red-600 hover:border-red-700 text-white focus-visible:ring-red-500"
            )}
        >
            <CheckCircle className="h-6 w-6 shrink-0 md:h-7 md:w-7" />
            <span className="leading-tight">שלח בקשה</span>
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" /> 
        </Button>
      )}
      
      {errors?.finalCheck && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-sm text-red-600">
            <AlertTriangle className="h-4 w-4 ml-2 shrink-0" /> 
            <span>{errors.finalCheck}</span>
        </div>
      )}
       {errors?.submit && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-sm text-red-600">
            <AlertTriangle className="h-4 w-4 ml-2 shrink-0" /> 
            <span>{errors.submit}</span>
        </div>
      )}
    </div>
  );
};

export default ReviewSubmitStep;
