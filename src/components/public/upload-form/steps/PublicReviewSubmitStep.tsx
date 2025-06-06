
import React, { useState } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { Separator } from '@/components/ui/separator';
import { Image as ImageIcon, Building2, Sparkles as ItemIcon, AlertTriangle, CheckCircle, ChevronLeft, X, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils'; 
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

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

const PublicReviewSubmitStep: React.FC<PublicStepProps> = ({ errors, onFinalSubmit }) => {
  const { formData } = useNewItemForm();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const { 
    restaurantName,
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
      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-800 text-center">סקירה ואישור</h2>
        <p className="text-sm md:text-base text-muted-foreground mb-8 text-center">
          אנא בדקו את כל הפרטים שהזנתם/ן לפני ההגשה הסופית.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center mb-3">
          <Building2 className="h-6 w-6 text-primary ml-3" /> 
          <h3 className="text-lg font-semibold text-gray-700">שם המסעדה</h3>
        </div>
        <dl className="divide-y divide-gray-200 rounded-md border border-gray-200 p-4 bg-white">
          <ReviewItem label="שם המסעדה" value={restaurantName} isMissing={!restaurantName} />
        </dl>
        <Separator className="my-6" />
      </section>

      <section className="space-y-4">
        <div className="flex items-center mb-3">
          <ItemIcon className="h-6 w-6 text-primary ml-3" /> 
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
            <ImageIcon className="h-6 w-6 text-primary ml-3" /> 
            <h3 className="text-lg font-semibold text-gray-700">תמונות שהועלו ({referenceImages.length})</h3>
          </div>
          {referenceImages.length > 0 ? (
          <div className="space-y-4 p-4 border border-gray-200 rounded-md bg-white">
              {/* Image Grid for Review */}
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {referenceImages.map((file, index) => (
                  <Dialog key={index}>
                    <DialogTrigger asChild>
                      <div className="relative group cursor-pointer bg-gray-100 rounded-lg overflow-hidden border border-gray-200 aspect-square hover:shadow-md transition-shadow">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`תצוגה מקדימה ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <ZoomIn className="w-6 h-6 text-white" />
                        </div>
                        <div className="absolute top-1 right-1 bg-white/90 text-xs px-1.5 py-0.5 rounded text-gray-700">
                          {index + 1}
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl w-full">
                      <div className="relative">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`תמונה ${index + 1}`} 
                          className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                        />
                        <div className="mt-4 text-center">
                          <p className="text-sm text-gray-600">תמונה {index + 1} מתוך {referenceImages.length}</p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
              <p className="text-xs text-gray-500 text-center">לחצו על תמונה להגדלה ובדיקה אחרונה</p>
            </div>
          ) : (
          <div className="p-4 border border-gray-200 rounded-md bg-white">
            <p className="text-muted-foreground text-center py-4">לא הועלו תמונות.</p>
          </div>
          )}
        <Separator className="my-6" />
      </section>

      {/* Summary Message */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
        <p className="text-orange-800 font-semibold">
          הגשה זו תנצל מנה אחת מהחבילה שלך.
        </p>
      </div>

      {onFinalSubmit && (
        <Button
            onClick={onFinalSubmit}
            disabled={!canSubmit || (errors && Object.keys(errors).length > 0 && !errors.finalCheck && !errors.submit) }
            className={cn(
                "w-full text-lg md:text-xl font-bold py-5 px-6 rounded-xl shadow-lg transition-all duration-200 ease-in-out transform hover:-translate-y-1 hover:shadow-xl",
                "flex items-center justify-center gap-x-3 rtl:gap-x-reverse",
                "border-2",
                canSubmit 
                ? "bg-orange-500 hover:bg-orange-600 border-orange-600 hover:border-orange-700 text-white focus-visible:ring-orange-500" 
                : "bg-gray-300 hover:bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed shadow-inner",
                (errors && (errors.finalCheck || errors.submit)) && "bg-red-500 hover:bg-red-600 border-red-600 hover:border-red-700 text-white focus-visible:ring-red-500"
            )}
        >
            <CheckCircle className="h-6 w-6 shrink-0 md:h-7 md:w-7" />
            <span className="leading-tight">✓ בדקנו הכל - הגישו עכשיו!</span>
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

export default PublicReviewSubmitStep;
