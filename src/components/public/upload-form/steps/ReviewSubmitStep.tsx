import React, { useContext } from 'react';
import { NewItemFormContext } from '@/contexts/NewItemFormContext';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, CheckCircle, Image as ImageIcon, Building2, Sparkles as ItemIcon, AlertTriangle } from 'lucide-react';
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

const ReviewSubmitStep: React.FC<PublicStepProps> = ({ errors, onFinalSubmit, isSubmitting }) => {
  const { formData } = useContext(NewItemFormContext);

  const { 
    restaurantName,
    itemName, itemType, description, specialNotes, referenceImages 
  } = formData;

  const itemTypeDisplay: Record<string, string> = {
    dish: "מנה",
    cocktail: "קוקטייל",
    drink: "משקה"
  };
  
  const isButtonDisabled = isSubmitting || (errors && Object.keys(errors).length > 0 && !errors.finalCheck && !errors.submit);
  const hasSpecificSubmitErrors = errors && (errors.finalCheck || errors.submit);

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2 text-[#8B1E3F] text-center">סקירה ואישור</h2>
        <p className="text-sm md:text-base text-muted-foreground mb-8 text-center">
          אנא בדקו את כל הפרטים שהזנתם לפני ההגשה הסופית. ודאו שהכל תקין.
        </p>
      </div>

      {/* Restaurant Details Section */}
      {restaurantName && (
        <section className="space-y-4">
          <div className="flex items-center mb-3 justify-center">
            <Building2 className="h-6 w-6 text-[#F3752B] ml-3" /> 
            <h3 className="text-lg font-semibold text-[#8B1E3F]">פרטי המסעדה</h3>
          </div>
          <dl className="divide-y divide-gray-200 rounded-md border border-gray-200 p-4 bg-white">
            <ReviewItem label="שם המסעדה" value={restaurantName} isMissing={!restaurantName} />
          </dl>
          <Separator className="my-6" />
        </section>
      )}

      {/* Item Details Section */}
      <section className="space-y-4">
        <div className="flex items-center mb-3 justify-center">
          <ItemIcon className="h-6 w-6 text-[#F3752B] ml-3" /> 
          <h3 className="text-lg font-semibold text-[#8B1E3F]">פרטי הפריט</h3>
        </div>
        <dl className="divide-y divide-gray-200 rounded-md border border-gray-200 p-4 bg-white">
          <ReviewItem label="שם הפריט" value={itemName} isMissing={!itemName} />
          <ReviewItem label="סוג הפריט" value={itemType ? itemTypeDisplay[itemType] : undefined} isMissing={!itemType} />
          <ReviewItem label="תיאור/מרכיבים" value={description} />
          <ReviewItem label="הערות מיוחדות" value={specialNotes} />
        </dl>
        <Separator className="my-6" />
      </section>

      {/* Uploaded Images Section */}
      <section className="space-y-4">
         <div className="flex items-center mb-3 justify-center">
            <ImageIcon className="h-6 w-6 text-[#F3752B] ml-3" /> 
            <h3 className="text-lg font-semibold text-[#8B1E3F]">תמונות שהועלו ({referenceImages.length})</h3>
          </div>
          {referenceImages.length > 0 ? (
          <div className="space-y-4 p-4 border border-gray-200 rounded-md bg-white"> 
            {referenceImages.map((file, index) => (
              <div key={index} className="relative group w-full bg-gray-100 rounded-lg shadow-sm overflow-hidden border border-gray-200 aspect-video"> 
                <img 
                  src={URL.createObjectURL(file)} 
                  alt={`תצוגה מקדימה ${index + 1}`} 
                  className="w-full h-full object-contain"
                  onLoad={() => URL.revokeObjectURL(file.name)}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1.5 truncate text-center">
                  {file.name}
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

      {/* Public form info */}
      <Alert className="p-4 rounded-md bg-[#8B1E3F]/10 border-[#8B1E3F] text-[#8B1E3F]">
        <InfoIcon className="h-5 w-5" />
        <AlertDescription className="text-sm mr-2"> 
          לאחר ההגשה, הפריט יתווסף למערכת ויעבור לבדיקה. אם המסעדה קיימת במערכת, הפריט יתווסף אליה אוטומטית.
        </AlertDescription>
      </Alert>

      {/* Final Confirmation Button */}
      {onFinalSubmit && (
        <Button
            onClick={onFinalSubmit}
            disabled={isButtonDisabled}
            className={cn(
                "w-full text-lg md:text-xl font-bold py-5 px-6 rounded-full shadow-lg transition-all duration-200 ease-in-out",
                "flex items-center justify-center gap-x-3 rtl:gap-x-reverse",
                !isButtonDisabled && !hasSpecificSubmitErrors
                ? "bg-[#8B1E3F] hover:bg-[#8B1E3F]/90 text-white" 
                : "bg-gray-300 hover:bg-gray-300 text-gray-500 cursor-not-allowed",
                hasSpecificSubmitErrors && "bg-red-500 hover:bg-red-600 text-white" // This will override gray if specific errors exist
            )}
        >
            <CheckCircle className="h-6 w-6 shrink-0 md:h-7 md:w-7" />
            <span className="leading-tight">
              {isSubmitting ? 'שולח...' : '✓ בדקנו הכל - הגישו עכשיו!'}
            </span>
        </Button>
      )}

      {/* Display any submission errors */}
      {errors?.finalCheck && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-sm text-red-600 justify-center">
            <AlertTriangle className="h-4 w-4 ml-2 shrink-0" /> 
            <span>{errors.finalCheck}</span>
        </div>
      )}
      {errors?.submit && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-sm text-red-600 justify-center">
            <AlertTriangle className="h-4 w-4 ml-2 shrink-0" /> 
            <span>{errors.submit}</span>
        </div>
      )}
    </div>
  );
};

export default ReviewSubmitStep;
