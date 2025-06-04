import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { UploadCloud, Trash2, FileImage, CheckCircle, Palette, Eye, FileText, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

const AdditionalDetailsStep: React.FC<PublicStepProps> = ({ errors: externalErrors, clearExternalErrors }) => {
  const { formData, updateFormData } = useNewItemForm();
  const errors = externalErrors || {};
  const [activeUploadType, setActiveUploadType] = useState<'branding' | 'reference'>('branding');

  const onDropBranding = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...formData.brandingMaterials];
    acceptedFiles.forEach(file => {
      if (!newFiles.find(f => f.name === file.name) && newFiles.length < 5) {
        newFiles.push(file);
      }
    });
    updateFormData({ brandingMaterials: newFiles });
  }, [formData.brandingMaterials, updateFormData]);

  const onDropReference = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...formData.referenceExamples];
    acceptedFiles.forEach(file => {
      if (!newFiles.find(f => f.name === file.name) && newFiles.length < 10) {
        newFiles.push(file);
      }
    });
    updateFormData({ referenceExamples: newFiles });
  }, [formData.referenceExamples, updateFormData]);

  const { getRootProps: getBrandingRootProps, getInputProps: getBrandingInputProps, isDragActive: isBrandingDragActive } = useDropzone({
    onDrop: onDropBranding,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf']
    },
    maxSize: 20 * 1024 * 1024,
    maxFiles: 5,
  });

  const { getRootProps: getReferenceRootProps, getInputProps: getReferenceInputProps, isDragActive: isReferenceDragActive } = useDropzone({
    onDrop: onDropReference,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf']
    },
    maxSize: 20 * 1024 * 1024,
    maxFiles: 10,
  });

  const removeBrandingFile = (index: number) => {
    const newFiles = [...formData.brandingMaterials];
    newFiles.splice(index, 1);
    updateFormData({ brandingMaterials: newFiles });
  };

  const removeReferenceFile = (index: number) => {
    const newFiles = [...formData.referenceExamples];
    newFiles.splice(index, 1);
    updateFormData({ referenceExamples: newFiles });
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage className="w-8 h-8 text-blue-500" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    return <FileImage className="w-8 h-8 text-gray-500" />;
  };

  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return (
        <img
          src={URL.createObjectURL(file)}
          alt={file.name}
          className="w-full h-full object-cover"
          onLoad={() => URL.revokeObjectURL(file.name)}
        />
      );
    }
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        {getFileIcon(file)}
        <span className="ml-2 text-sm font-medium truncate">{file.name}</span>
      </div>
    );
  };

  const brandingTips = [
    { icon: Palette, text: "העלו לוגו באיכות גבוהה (PNG עדיף)" },
    { icon: Eye, text: "כללו דוגמאות מהזהות הוויזואלית" },
    { icon: FileText, text: "ניתן להעלות PDF עם הנחיות עיצוב" },
    { icon: Image, text: "תמונות של חומרי פרסום קיימים" }
  ];

  const referenceTips = [
    { icon: Eye, text: "דוגמאות מעבודות שאהבתם" },
    { icon: Palette, text: "סגנון עיצוב שמעוניינים בו" },
    { icon: Image, text: "השראות מהתחום שלכם" },
    { icon: FileText, text: "אפשר גם PDF עם רפרנסים" }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-[#333333] mb-4">
          פרטים נוספים
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          העלו חומרי מיתוג ודוגמאות להתייחסות (אופציונלי)
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Tab Selection */}
        <div className="flex bg-gray-100 rounded-2xl p-2">
          <button
            onClick={() => setActiveUploadType('branding')}
            className={cn(
              "flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-200",
              activeUploadType === 'branding'
                ? "bg-[#F3752B] text-white shadow-lg"
                : "text-gray-600 hover:text-gray-800"
            )}
          >
            <Palette className="w-5 h-5 inline-block ml-2" />
            חומרי מיתוג
          </button>
          <button
            onClick={() => setActiveUploadType('reference')}
            className={cn(
              "flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-200",
              activeUploadType === 'reference'
                ? "bg-[#F3752B] text-white shadow-lg"
                : "text-gray-600 hover:text-gray-800"
            )}
          >
            <Eye className="w-5 h-5 inline-block ml-2" />
            דוגמאות להתייחסות
          </button>
        </div>

        {/* Branding Materials Section */}
        {activeUploadType === 'branding' && (
          <>
            {/* Tips for Branding */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-purple-800 mb-4 text-center">חומרי מיתוג</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {brandingTips.map((tip, index) => {
                  const IconComponent = tip.icon;
                  return (
                    <div key={index} className="flex items-center space-x-3 rtl:space-x-reverse">
                      <IconComponent className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      <span className="text-purple-800 text-sm">{tip.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Branding Upload Area */}
            <div
              {...getBrandingRootProps()}
              data-testid="branding-dropzone"
              className={cn(
                "border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300",
                "flex flex-col items-center justify-center min-h-[200px]",
                isBrandingDragActive 
                  ? 'border-purple-500 bg-purple-50 scale-105' 
                  : 'border-gray-300 hover:border-purple-500 hover:bg-purple-50/30'
              )}
            >
              <input {...getBrandingInputProps()} />
              <Palette className={cn("h-12 w-12 mb-4", isBrandingDragActive ? "text-purple-500" : "text-gray-400")} />
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                {isBrandingDragActive ? 'שחררו כאן את הקבצים' : 'העלו חומרי מיתוג'}
              </h3>
              <p className="text-gray-500">
                לוגו, הנחיות עיצוב, דוגמאות פרסום
              </p>
              <p className="text-sm text-gray-400 mt-2">
                תומך ב-JPG, PNG, PDF (מקסימום 20MB לקובץ, עד 5 קבצים)
              </p>
            </div>

            {/* Uploaded Branding Files */}
            {formData.brandingMaterials.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-[#333333] text-center">
                  חומרי מיתוג שהועלו ({formData.brandingMaterials.length}/5)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.brandingMaterials.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
                        {getFilePreview(file)}
                        <div className="absolute top-2 right-2">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <button
                            onClick={() => removeBrandingFile(index)}
                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 text-center truncate">{file.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Reference Examples Section */}
        {activeUploadType === 'reference' && (
          <>
            {/* Tips for Reference */}
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-green-800 mb-4 text-center">דוגמאות להתייחסות</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {referenceTips.map((tip, index) => {
                  const IconComponent = tip.icon;
                  return (
                    <div key={index} className="flex items-center space-x-3 rtl:space-x-reverse">
                      <IconComponent className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-green-800 text-sm">{tip.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reference Upload Area */}
            <div
              {...getReferenceRootProps()}
              data-testid="reference-dropzone"
              className={cn(
                "border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300",
                "flex flex-col items-center justify-center min-h-[200px]",
                isReferenceDragActive 
                  ? 'border-green-500 bg-green-50 scale-105' 
                  : 'border-gray-300 hover:border-green-500 hover:bg-green-50/30'
              )}
            >
              <input {...getReferenceInputProps()} />
              <Eye className={cn("h-12 w-12 mb-4", isReferenceDragActive ? "text-green-500" : "text-gray-400")} />
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                {isReferenceDragActive ? 'שחררו כאן את הקבצים' : 'העלו דוגמאות להתייחסות'}
              </h3>
              <p className="text-gray-500">
                השראות, סגנון עיצוב, דוגמאות שאהבתם
              </p>
              <p className="text-sm text-gray-400 mt-2">
                תומך ב-JPG, PNG, PDF (מקסימום 20MB לקובץ, עד 10 קבצים)
              </p>
            </div>

            {/* Uploaded Reference Files */}
            {formData.referenceExamples.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-[#333333] text-center">
                  דוגמאות שהועלו ({formData.referenceExamples.length}/10)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {formData.referenceExamples.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
                        {getFilePreview(file)}
                        <div className="absolute top-2 right-2">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <button
                            onClick={() => removeReferenceFile(index)}
                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 text-center truncate">{file.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Optional Notice */}
        <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 text-center">
          <p className="text-gray-700 text-sm">
            <strong>שימו לב:</strong> חלק זה אופציונלי. ניתן לדלג ולעבור ישירות לסקירה ואישור
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdditionalDetailsStep; 