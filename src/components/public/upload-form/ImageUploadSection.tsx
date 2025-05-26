
import React from 'react';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';

interface ImageUploadSectionProps {
  images: File[];
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  error?: string;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  images,
  onImageUpload,
  onRemoveImage,
  error
}) => {
  return (
    <div>
      <Label htmlFor="images">תמונות הפריט *</Label>
      <div className="mt-2">
        <input
          id="images"
          type="file"
          multiple
          accept="image/*"
          onChange={onImageUpload}
          className="hidden"
        />
        <label
          htmlFor="images"
          className={`border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition-colors flex flex-col items-center justify-center ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-600">לחץ כדי לבחור תמונות</span>
          <span className="text-xs text-gray-400 mt-1">עד 10 תמונות</span>
        </label>
      </div>
      
      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((file, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt={`תצוגה מקדימה ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => onRemoveImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default ImageUploadSection;
