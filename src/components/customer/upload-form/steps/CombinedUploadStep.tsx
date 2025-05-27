
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { IconInput } from '@/components/ui/icon-input';
import { IconTextarea } from '@/components/ui/icon-textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { StepProps } from '../FoodVisionUploadForm';
import { UploadCloud, Trash2, AlertTriangle, Sparkles, FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';

const CombinedUploadStep: React.FC<StepProps> = ({ errors: externalErrors, clearExternalErrors }) => {
  const { formData, updateFormData } = useNewItemForm();
  const errors = externalErrors || {};
  const [checklist, setChecklist] = useState({
    imageQuality: false,
    composition: false,
    colors: false
  });

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
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-primary ml-2" />
          <FileImage className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          פרטי העלאה
        </h2>
        <p className="text-gray-600 mb-8">
          הזינו את פרטי הפריט והעלו תמונות איכותיות
        </p>
      </div>

      {/* Item Details Section */}
      <div className="bg-primary/5 p-6 rounded-xl border border-primary/20">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <Sparkles className="w-6 h-6 text-primary ml-2" />
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
                    className="h-5 w-5 rounded border-gray-400 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
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
            label="מרכיבים עיקריים (אופציונלי)"
            value={formData.description}
            onChange={handleChange}
            placeholder="פרטו את המרכיבים העיקריים של הפריט"
            rows={3}
            error={errors?.description}
          />

          <IconTextarea
            id="specialNotes"
            name="specialNotes"
            label="הערות מיוחדות (אופציונלי)"
            value={formData.specialNotes}
            onChange={handleChange}
            placeholder="כל מידע נוסף שחשוב שנדע"
            rows={2}
            error={errors?.specialNotes}
          />
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
          <FileImage className="w-6 h-6 text-primary ml-2" />
          העלאת תמונות
        </h3>
        
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 md:p-12 text-center cursor-pointer transition-all duration-200 ease-in-out",
            "flex flex-col items-center justify-center min-h-[200px] md:min-h-[250px]",
            isDragActive ? 'border-primary bg-primary/10 ring-2 ring-primary/50' : 'border-gray-300 hover:border-primary/70 hover:bg-gray-50/50'
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud className={cn("h-12 w-12 md:h-16 md:w-16 mb-4", isDragActive ? "text-primary" : "text-gray-400")} />
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
          </div>
        )}

        {formData.referenceImages.length > 0 && (
          <div className="space-y-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-lg font-medium text-gray-700 mb-4">בדיקת איכות מהירה:</h4>
            <div className="space-y-3">
              {[
                { id: "imageQuality", label: "התמונה ברורה ומוארת היטב" },
                { id: "composition", label: "המנה ממורכזת ובפוקוס" },
                { id: "colors", label: "הצבעים חיים ומושכים" }
              ].map(item => (
                <div key={item.id} className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Checkbox
                    id={item.id}
                    checked={checklist[item.id as keyof typeof checklist]}
                    onCheckedChange={(checked) => 
                      setChecklist(prev => ({ ...prev, [item.id]: checked as boolean }))
                    }
                    className="h-5 w-5 rounded border-gray-400 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label
                    htmlFor={item.id}
                    className="text-sm md:text-base text-gray-700 leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CombinedUploadStep;
