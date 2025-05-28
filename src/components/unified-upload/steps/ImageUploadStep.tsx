import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';

interface ImageUploadStepProps {
  formData: {
    referenceImages: File[];
  };
  imagePreviews: string[];
  errors: Record<string, string>;
  onImageUpload: (files: FileList | null) => void;
  onRemoveImage: (index: number) => void;
}

const ImageUploadStep: React.FC<ImageUploadStepProps> = ({
  formData,
  imagePreviews,
  errors,
  onImageUpload,
  onRemoveImage
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-center text-[#8B1E3F] mb-4">העלאת תמונות</h2>
      
      <div className="border-2 border-dashed border-[#8B1E3F]/30 rounded-lg p-6 text-center">
        <Upload className="mx-auto h-12 w-12 text-[#F3752B] mb-4" />
        <p className="text-gray-600 mb-4">גרור תמונות לכאן או לחץ לבחירה</p>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => onImageUpload(e.target.files)}
          className="hidden"
          id="file-upload"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('file-upload')?.click()}
          className="bg-[#F3752B] text-white hover:bg-[#F3752B]/90 border-none"
        >
          בחר תמונות
        </Button>
        <p className="text-xs text-gray-500 mt-2">עד 10 תמונות, כל תמונה עד 10MB</p>
      </div>

      {errors.referenceImages && (
        <p className="text-red-500 text-xs text-center">{errors.referenceImages}</p>
      )}

      {imagePreviews.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-center text-[#8B1E3F] mb-3">תמונות שנבחרו</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`תצוגה מקדימה ${index + 1}`}
                  className="w-full h-32 object-cover rounded-md shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadStep;
