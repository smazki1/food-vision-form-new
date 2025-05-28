
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { UploadCloud, Trash2, Camera, CheckCircle, Lightbulb, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const ImageUploadStep: React.FC<PublicStepProps> = ({ errors: externalErrors, clearExternalErrors }) => {
  const { formData, updateFormData } = useNewItemForm();
  const errors = externalErrors || {};
  const [qualityChecks, setQualityChecks] = useState({
    clarity: false,
    angle: false,
    completeness: false
  });

  const allChecked = Object.values(qualityChecks).every(Boolean);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...formData.referenceImages];
    acceptedFiles.forEach(file => {
      if (!newFiles.find(f => f.name === file.name) && newFiles.length < 10) {
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
    maxFiles: 10,
  });

  const removeImage = (index: number) => {
    const newFiles = [...formData.referenceImages];
    newFiles.splice(index, 1);
    updateFormData({ referenceImages: newFiles });
  };

  const handleQualityCheck = (check: keyof typeof qualityChecks) => {
    setQualityChecks(prev => ({ ...prev, [check]: !prev[check] }));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-[#333333] mb-4">
          העלאת תמונות
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          העלו תמונות איכותיות של המנה שלכם לקבלת תוצאה מושלמת
        </p>
      </div>

      {/* Upload Area */}
      <div className="max-w-3xl mx-auto space-y-8">
        <div
          {...getRootProps()}
          className={cn(
            "border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300",
            "flex flex-col items-center justify-center min-h-[300px]",
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
            תומך ב-JPG, PNG, WEBP (מקסימום 20MB לתמונה, עד 10 תמונות)
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
              תמונות שהועלו ({formData.referenceImages.length}/10)
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

            {/* Quality Check Section */}
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-8 space-y-6">
              <h4 className="text-2xl font-bold text-emerald-800 text-center mb-6">
                לפני שממשיכים – ודאו שהתמונה ברורה ונכונה:
              </h4>
              
              <div className="space-y-4">
                {[
                  { key: 'clarity', text: 'המנה נראית בבירור – בלי טשטוש או צל' },
                  { key: 'angle', text: 'הזווית נכונה – לא חתוכה, לא מוסתרת' },
                  { key: 'completeness', text: 'כל מה שחשוב שיראו – מופיע (מרכיבים עיקריים, תוספות, מרקם וכו\')' }
                ].map(({ key, text }) => (
                  <label key={key} className="flex items-start space-x-4 rtl:space-x-reverse cursor-pointer">
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={cn(
                          "w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200",
                          qualityChecks[key as keyof typeof qualityChecks]
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-gray-300 hover:border-emerald-400"
                        )}
                        onClick={() => handleQualityCheck(key as keyof typeof qualityChecks)}
                      >
                        {qualityChecks[key as keyof typeof qualityChecks] && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                    <span className="text-lg text-emerald-800 leading-relaxed">{text}</span>
                  </label>
                ))}
              </div>

              {/* Tip */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-start space-x-3 rtl:space-x-reverse">
                <Lightbulb className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                <p className="text-blue-800 text-lg">
                  💡 ככל שהתמונה ברורה ומדויקת – כך התוצאה הסופית תהיה מקצועית ומגרה יותר
                </p>
              </div>

              {/* Confirmation Box */}
              {allChecked && (
                <div className="bg-emerald-100 border-2 border-emerald-300 rounded-xl p-6 text-center animate-fadeIn">
                  <div className="flex items-center justify-center space-x-3 rtl:space-x-reverse">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                    <span className="text-xl font-bold text-emerald-800">
                      ✔️ בדקתי את כל הפרטים ואני מאשר את ההגשה
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploadStep;
