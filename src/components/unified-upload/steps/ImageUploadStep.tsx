
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
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">העלאת תמונות</h2>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
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
        >
          בחר תמונות
        </Button>
        <p className="text-xs text-gray-500 mt-2">עד 10 תמונות, כל תמונה עד 10MB</p>
      </div>

      {errors.referenceImages && (
        <p className="text-red-500 text-xs">{errors.referenceImages}</p>
      )}

      {imagePreviews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative">
              <img
                src={preview}
                alt={`תצוגה מקדימה ${index + 1}`}
                className="w-full h-32 object-cover rounded-md"
              />
              <button
                type="button"
                onClick={() => onRemoveImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploadStep;
