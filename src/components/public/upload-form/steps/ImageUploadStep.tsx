import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploadStepProps {
  errors: Record<string, string>;
}

const ImageUploadStep: React.FC<ImageUploadStepProps> = ({ errors }) => {
  const { formData, updateFormData } = useNewItemForm();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = [...formData.referenceImages, ...acceptedFiles].slice(0, 10);
    updateFormData({ referenceImages: newImages });
  }, [formData.referenceImages, updateFormData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    multiple: true
  });

  const removeImage = (index: number) => {
    const newImages = formData.referenceImages.filter((_, i) => i !== index);
    updateFormData({ referenceImages: newImages });
  };

  const qualityChecklist = [
    'התמונות ברזולוציה גבוהה וחדות',
    'התאורה טובה ואין צללים',
    'הפריט מוצג בצורה אטרקטיבית'
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <ImageIcon className="w-8 h-8 text-[#F3752B]" />
        </div>
        <h2 className="text-2xl font-bold text-[#8B1E3F] mb-2">
          העלאת תמונות
        </h2>
        <p className="text-gray-600">
          העלו תמונות איכותיות של הפריט (עד 10 תמונות, מקסימום 20MB לכל תמונה)
        </p>
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-[#F3752B] bg-[#F3752B]/10"
            : "border-gray-300 hover:border-[#F3752B] hover:bg-gray-50",
          errors.referenceImages && "border-red-500 bg-red-50"
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-700">
            {isDragActive ? 'שחררו כאן את התמונות' : 'לחצו או גררו תמונות לכאן'}
          </p>
          <p className="text-sm text-gray-500">
            JPG, PNG, WEBP עד 20MB לכל תמונה
          </p>
          <p className="text-xs text-gray-400">
            {formData.referenceImages.length}/10 תמונות
          </p>
        </div>
      </div>

      {errors.referenceImages && (
        <p className="text-sm text-red-500 text-center">{errors.referenceImages}</p>
      )}

      {/* Image Preview Grid */}
      {formData.referenceImages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#8B1E3F] text-center">
            תמונות שהועלו ({formData.referenceImages.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {formData.referenceImages.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-200" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 left-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={() => removeImage(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-1 truncate" title={file.name}>
                  {file.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quality Checklist */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[#8B1E3F] text-center">
          רשימת בדיקה לאיכות התמונות
        </h3>
        <div className="space-y-3 max-w-md mx-auto">
          {qualityChecklist.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id={`quality-${index}`}
                className="data-[state=checked]:bg-[#F3752B] data-[state=checked]:border-[#F3752B]"
              />
              <Label htmlFor={`quality-${index}`} className="text-sm text-gray-700">
                {item}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageUploadStep;
