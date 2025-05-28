
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { IconInput } from '@/components/ui/icon-input';
import { IconTextarea } from '@/components/ui/icon-textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { UploadCloud, Trash2, AlertTriangle, UtensilsCrossed, FileImage, Lightbulb, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const CombinedUploadStep: React.FC<PublicStepProps> = ({ errors: externalErrors, clearExternalErrors }) => {
  const { formData, updateFormData } = useNewItemForm();
  const errors = externalErrors || {};
  const [qualityChecked, setQualityChecked] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    const newFiles = [...formData.referenceImages];
    acceptedFiles.forEach(file => {
      if (!newFiles.find(f => f.name === file.name) && newFiles.length < 10) {
        newFiles.push(file);
      }
    });
    updateFormData({ referenceImages: newFiles });

    if (fileRejections.length > 0) {
      console.warn("File rejections:", fileRejections);
    }
  }, [formData.referenceImages, updateFormData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxSize: 20 * 1024 * 1024,
    maxFiles: 10,
  });

  const removeImage = (index: number) => {
    const newFiles = [...formData.referenceImages];
    newFiles.splice(index, 1);
    updateFormData({ referenceImages: newFiles });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
    if (errors && errors[name] && clearExternalErrors) {
      clearExternalErrors();
    }
  };

  const handleItemTypeChange = (itemType: 'dish' | 'cocktail' | 'drink') => {
    updateFormData({ itemType });
    if (errors.itemType && clearExternalErrors) {
      clearExternalErrors();
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          העלאת מנות ומוצרים
        </h2>
        <p className="text-gray-600 text-lg mb-8">
          הזינו את פרטי הפריט והעלו תמונות איכותיות
        </p>
      </div>

      {/* Item Details Section */}
      <div className="bg-emerald-50 p-8 rounded-xl border border-emerald-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <UtensilsCrossed className="w-6 h-6 text-emerald-500 ml-2" />
          פרטי הפריט
        </h3>
        
        <div className="space-y-6">
          <IconInput
            id="itemName"
            name="itemName"
            label="שם הפריט"
            value={formData.itemName}
            onChange={handleChange}
            placeholder="לדוגמה: פסטה קרבונרה, מוחיטו קלאסי"
            error={errors?.itemName}
            iconPosition="right"
            required
            icon={<UtensilsCrossed className="w-5 h-5 text-emerald-500" />}
          />

          <div className="space-y-3">
            <Label className="text-base font-medium text-gray-700">
              סוג הפריט <span className="text-red-600 ml-1">*</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: 'dish', label: 'מנה/מוצר', icon: '🍽️' },
                { value: 'drink', label: 'שתיה', icon: '🥤' },
                { value: 'cocktail', label: 'קוקטייל', icon: '🍸' }
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Checkbox
                    id={option.value}
                    checked={formData.itemType === option.value}
                    onCheckedChange={() => handleItemTypeChange(option.value as 'dish' | 'cocktail' | 'drink')}
                    className="h-5 w-5 rounded border-gray-400 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <label
                    htmlFor={option.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                  >
                    <span className="text-lg">{option.icon}</span>
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
            {errors?.itemType && (
              <p className="text-xs text-red-500 mt-1">{errors.itemType}</p>
            )}
          </div>

          <IconTextarea
            id="description"
            name="description"
            label="תיאור קצר של המנה / המוצר"
            value={formData.description}
            onChange={handleChange}
            placeholder="ספר לנו על המנה ואת המרכיבים העיקריים שחשוב שיראו בתמונה (לדוג' סלט קיסר עם אגוזי מלך ורוטב בלסמי. חשוב להראות את הרוטב בסלט)."
            rows={3}
            error={errors?.description}
          />

          <IconTextarea
            id="specialNotes"
            name="specialNotes"
            label="הערות מיוחדות"
            value={formData.specialNotes}
            onChange={handleChange}
            placeholder="לדוג': להציג את הסלט עם קרוטונים, בלי בצל, להבליט את הרוטב, עדיף צלחת לבנה"
            rows={2}
            error={errors?.specialNotes}
          />
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
          <FileImage className="w-6 h-6 text-emerald-500 ml-2" />
          העלאת תמונות
        </h3>
        
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 md:p-12 text-center cursor-pointer transition-all duration-200 ease-in-out",
            "flex flex-col items-center justify-center min-h-[200px] md:min-h-[250px]",
            isDragActive ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/50' : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50'
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud className={cn("h-12 w-12 md:h-16 md:w-16 mb-4", isDragActive ? "text-emerald-500" : "text-gray-400")} />
          <p className="text-base md:text-lg font-medium text-gray-700 mb-1">
            {isDragActive ? 'שחררו כאן את הקבצים' : 'גררו לכאן תמונות או לחצו לבחירה'}
          </p>
          <p className="text-xs md:text-sm text-muted-foreground">
            תומך ב-JPG, PNG, WEBP (מקסימום 20MB לתמונה, עד 10 תמונות)
          </p>
        </div>

        {errors?.referenceImages && (
          <div className="flex items-center text-sm text-red-600 mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertTriangle className="h-4 w-4 mr-2 shrink-0" />
            <span>{errors.referenceImages}</span>
          </div>
        )}

        {formData.referenceImages.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-700">תמונות שהועלו ({formData.referenceImages.length}/10)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {formData.referenceImages.map((file, index) => (
                <div key={index}
                     className="relative group aspect-square bg-gray-100 rounded-lg shadow-sm overflow-hidden border border-gray-200">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`תצוגה מקדימה ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onLoad={() => URL.revokeObjectURL(file.name)}
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={(e) => { e.preventDefault(); removeImage(index); }}
                      aria-label="הסרת תמונה"
                      className="rounded-full h-9 w-9 md:h-10 md:w-10"
                    >
                      <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quality Check Section */}
            <div className="space-y-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-lg font-medium text-gray-700 mb-4">לפני שממשיכים – ודאו שהתמונה ברורה ונכונה:</h4>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <Checkbox
                    id="qualityCheck"
                    checked={qualityChecked}
                    onCheckedChange={(checked) => setQualityChecked(checked as boolean)}
                    className="h-5 w-5 mt-1 rounded border-gray-400 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="qualityCheck"
                      className="text-sm md:text-base text-gray-700 leading-relaxed cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      <strong>אני מאשר שהתמונה עומדת בדרישות:</strong>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-emerald-500 ml-2 shrink-0" />
                          המנה נראית בבירור – בלי טשטוש או צל
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-emerald-500 ml-2 shrink-0" />
                          הזווית נכונה – לא חתוכה, לא מוסתרת
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-emerald-500 ml-2 shrink-0" />
                          כל מה שחשוב שיראו – מופיע (מרכיבים עיקריים, תוספות, מרקם וכו')
                        </li>
                      </ul>
                    </label>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-500 mt-3">
                  <Lightbulb className="w-4 h-4 ml-2 shrink-0" />
                  <span>💡 ככל שהתמונה ברורה ומדויקת – כך התוצאה הסופית תהיה מקצועית ומגרה יותר</span>
                </div>

                {qualityChecked && (
                  <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center text-emerald-700">
                      <CheckCircle className="w-5 h-5 ml-2 shrink-0" />
                      <span className="font-medium">בדקתי את כל הפרטים ואני מאשר את ההגשה.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CombinedUploadStep;
