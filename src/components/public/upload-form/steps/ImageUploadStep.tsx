
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { UploadCloud, Trash2, Camera, CheckCircle, Lightbulb, Sun, Focus, Zap, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

const ImageUploadStep: React.FC<PublicStepProps> = ({ errors: externalErrors, clearExternalErrors }) => {
  const { formData, updateFormData } = useNewItemForm();
  const errors = externalErrors || {};

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...formData.referenceImages];
    acceptedFiles.forEach(file => {
      if (!newFiles.find(f => f.name === file.name) && newFiles.length < 5) {
        newFiles.push(file);
      }
    });
    updateFormData({ referenceImages: newFiles });
  }, [formData.referenceImages, updateFormData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxSize: 20 * 1024 * 1024,
    maxFiles: 5,
  });

  const removeImage = (index: number) => {
    const newFiles = [...formData.referenceImages];
    newFiles.splice(index, 1);
    updateFormData({ referenceImages: newFiles });
  };

  const photographyTips = [
    { icon: Sun, text: "צלמו בתאורה טובה - אור טבעי עדיף" },
    { icon: Focus, text: "מקמו את המנה במרכז התמונה" },
    { icon: Eye, text: "צלמו מזווית עליונה או צדדית" },
    { icon: Zap, text: "הימנעו מצילום בתאורה חלשה או צהובה" }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-[#333333] mb-4">
          העלאת תמונות איכותיות (2-5 תמונות)
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          ככל שהתמונות ברורות יותר, כך התוצאות יהיו מדויקות יותר
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Photography Tips - Before Upload */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-blue-800 mb-4 text-center">טיפים לצילום טוב</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {photographyTips.map((tip, index) => {
              const IconComponent = tip.icon;
              return (
                <div key={index} className="flex items-center space-x-3 rtl:space-x-reverse">
                  <IconComponent className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-blue-800 text-sm">{tip.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Example Images */}
        <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">דוגמאות צילום</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <img 
                src="https://zjjzqsgflplzdamanhqj.supabase.co/storage/v1/object/public/food-vision-images//jjcmut3409b.jpeg"
                alt="צילום טוב"
                className="w-full h-32 object-cover rounded-lg border-2 border-green-400"
              />
              <p className="text-sm text-green-600 font-semibold mt-2">✓ צילום טוב</p>
              <p className="text-xs text-gray-600">תאורה טובה, מיקום מרכזי</p>
            </div>
            <div className="text-center">
              <img 
                src="https://zjjzqsgflplzdamanhqj.supabase.co/storage/v1/object/public/food-vision-images//304f6d67-4abd-4ab3-844d-eeccf21a2130.jpeg"
                alt="צילום לא טוב"
                className="w-full h-32 object-cover rounded-lg border-2 border-red-400"
              />
              <p className="text-sm text-red-600 font-semibold mt-2">✗ צילום לא טוב</p>
              <p className="text-xs text-gray-600">תאורה חלשה, לא ברור</p>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={cn(
            "border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300",
            "flex flex-col items-center justify-center min-h-[250px]",
            isDragActive 
              ? 'border-[#F3752B] bg-orange-50 scale-105' 
              : 'border-gray-300 hover:border-[#F3752B] hover:bg-orange-50/30'
          )}
        >
          <input {...getInputProps()} />
          <Camera className={cn("h-16 w-16 mb-6", isDragActive ? "text-[#F3752B]" : "text-gray-400")} />
          <h3 className="text-2xl font-bold text-gray-700 mb-3">
            {isDragActive ? 'שחררו כאן את הקבצים' : 'לחצו כאן להעלאת תמונות'}
          </h3>
          <p className="text-lg text-gray-500">
            או גררו תמונות לכאן
          </p>
          <p className="text-sm text-gray-400 mt-4">
            תומך ב-JPG, PNG, WEBP (מקסימום 20MB לתמונה, עד 5 תמונות)
          </p>
        </div>

        {errors?.referenceImages && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-600 text-center">
            {errors.referenceImages}
          </div>
        )}

        {/* Uploaded Images */}
        {formData.referenceImages.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-[#333333] text-center">
              תמונות שהועלו ({formData.referenceImages.length}/5)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {formData.referenceImages.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`תמונה ${index + 1}`}
                      className="w-full h-full object-cover"
                      onLoad={() => URL.revokeObjectURL(file.name)}
                    />
                    <div className="absolute top-2 right-2">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <button
                        onClick={() => removeImage(index)}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Simple check message after upload */}
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 text-center">
              <p className="text-emerald-800 font-semibold text-lg">
                בדקו שהתמונות ברורות לפני המשך
              </p>
              <div className="text-xs text-blue-600 mt-2 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 ml-1" />
                💡 טיפ: צילום בתאורה טבעית משפר משמעותית את התוצאה
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploadStep;
