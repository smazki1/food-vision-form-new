
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { UploadCloud, Trash2, AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ImageUploadStep: React.FC<PublicStepProps> = ({ errors: externalErrors }) => {
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

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-800">העלאת תמונות</h2>
        <p className="text-sm md:text-base text-muted-foreground mb-8">
          העלו תמונות ברורות ואיכותיות של הפריט. מומלץ להעלות בין 1 ל-10 תמונות מזוויות שונות.
        </p>
      </div>

      <div className="space-y-4">
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 md:p-12 text-center cursor-pointer transition-all duration-200 ease-in-out",
            "flex flex-col items-center justify-center min-h-[200px] md:min-h-[250px]",
            isDragActive ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500/50' : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/50'
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud className={cn("h-12 w-12 md:h-16 md:w-16 mb-4", isDragActive ? "text-orange-500" : "text-gray-400")} />
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
      </div>

      {formData.referenceImages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-700">תמונות שהועלו ({formData.referenceImages.length}/10)</h3>
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
          <h3 className="text-lg font-medium text-gray-700 mb-4">בדיקת איכות מהירה:</h3>
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
                  className="h-5 w-5 rounded border-gray-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
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
  );
};

export default ImageUploadStep; 
