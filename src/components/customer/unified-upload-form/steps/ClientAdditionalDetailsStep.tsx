import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Trash2, FileImage, CheckCircle, Palette, Eye, FileText, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NewItemFormData } from '@/contexts/NewItemFormContext';

interface ClientAdditionalDetailsStepProps {
  formData: NewItemFormData;
  errors: Record<string, string>;
  onBrandingMaterialsChange: (files: File[]) => void;
  onReferenceExamplesChange: (files: File[]) => void;
}

const ClientAdditionalDetailsStep: React.FC<ClientAdditionalDetailsStepProps> = ({
  formData,
  errors,
  onBrandingMaterialsChange,
  onReferenceExamplesChange
}) => {
  const [activeUploadType, setActiveUploadType] = useState<'branding' | 'reference'>('branding');

  const onDropBranding = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...(formData.brandingMaterials || [])];
    acceptedFiles.forEach(file => {
      if (!newFiles.find(f => f.name === file.name) && newFiles.length < 5) {
        newFiles.push(file);
      }
    });
    onBrandingMaterialsChange(newFiles);
  }, [formData.brandingMaterials, onBrandingMaterialsChange]);

  const onDropReference = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...(formData.referenceExamples || [])];
    acceptedFiles.forEach(file => {
      if (!newFiles.find(f => f.name === file.name) && newFiles.length < 10) {
        newFiles.push(file);
      }
    });
    onReferenceExamplesChange(newFiles);
  }, [formData.referenceExamples, onReferenceExamplesChange]);

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
    const newFiles = [...(formData.brandingMaterials || [])];
    newFiles.splice(index, 1);
    onBrandingMaterialsChange(newFiles);
  };

  const removeReferenceFile = (index: number) => {
    const newFiles = [...(formData.referenceExamples || [])];
    newFiles.splice(index, 1);
    onReferenceExamplesChange(newFiles);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage className="w-6 h-6 text-blue-500" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="w-6 h-6 text-red-500" />;
    }
    return <FileImage className="w-6 h-6 text-gray-500" />;
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
        <span className="ml-2 text-xs font-medium truncate">{file.name}</span>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">פרטים נוספים</h2>
        <p className="text-gray-600">העלו חומרי מיתוג ודוגמאות להתייחסות (אופציונלי)</p>
      </div>

      {/* Tab Selection */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setActiveUploadType('branding')}
          className={cn(
            "flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 text-sm",
            activeUploadType === 'branding'
              ? "bg-[#F3752B] text-white shadow-md"
              : "text-gray-600 hover:text-gray-800"
          )}
        >
          <Palette className="w-4 h-4 inline-block ml-2" />
          חומרי מיתוג
        </button>
        <button
          onClick={() => setActiveUploadType('reference')}
          className={cn(
            "flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 text-sm",
            activeUploadType === 'reference'
              ? "bg-[#F3752B] text-white shadow-md"
              : "text-gray-600 hover:text-gray-800"
          )}
        >
          <Eye className="w-4 h-4 inline-block ml-2" />
          דוגמאות להתייחסות
        </button>
      </div>

      {/* Branding Materials Section */}
      {activeUploadType === 'branding' && (
        <div className="space-y-4">
          {/* Tips for Branding */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-800 mb-3 text-center">חומרי מיתוג</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {brandingTips.map((tip, index) => {
                const IconComponent = tip.icon;
                return (
                  <div key={index} className="flex items-center space-x-2 rtl:space-x-reverse">
                    <IconComponent className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span className="text-purple-800 text-xs">{tip.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Branding Upload Area */}
          <div
            {...getBrandingRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300",
              "flex flex-col items-center justify-center min-h-[160px]",
              isBrandingDragActive 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-300 hover:border-purple-500 hover:bg-purple-50/30'
            )}
          >
            <input {...getBrandingInputProps()} />
            <Palette className={cn("h-8 w-8 mb-3", isBrandingDragActive ? "text-purple-500" : "text-gray-400")} />
            <h3 className="font-semibold text-gray-700 mb-1">
              {isBrandingDragActive ? 'שחררו כאן את הקבצים' : 'העלו חומרי מיתוג'}
            </h3>
            <p className="text-sm text-gray-500 mb-2">לוגו, הנחיות עיצוב, דוגמאות פרסום</p>
            <p className="text-xs text-gray-400">JPG, PNG, PDF (מקסימום 20MB, עד 5 קבצים)</p>
          </div>

          {/* Uploaded Branding Files */}
          {formData.brandingMaterials && formData.brandingMaterials.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 text-center">
                חומרי מיתוג שהועלו ({formData.brandingMaterials.length}/5)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {formData.brandingMaterials.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      {getFilePreview(file)}
                      <div className="absolute top-1 right-1">
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <button
                          onClick={() => removeBrandingFile(index)}
                          className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 text-center truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reference Examples Section */}
      {activeUploadType === 'reference' && (
        <div className="space-y-4">
          {/* Tips for Reference */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-3 text-center">דוגמאות להתייחסות</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {referenceTips.map((tip, index) => {
                const IconComponent = tip.icon;
                return (
                  <div key={index} className="flex items-center space-x-2 rtl:space-x-reverse">
                    <IconComponent className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-green-800 text-xs">{tip.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reference Upload Area */}
          <div
            {...getReferenceRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300",
              "flex flex-col items-center justify-center min-h-[160px]",
              isReferenceDragActive 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 hover:border-green-500 hover:bg-green-50/30'
            )}
          >
            <input {...getReferenceInputProps()} />
            <Eye className={cn("h-8 w-8 mb-3", isReferenceDragActive ? "text-green-500" : "text-gray-400")} />
            <h3 className="font-semibold text-gray-700 mb-1">
              {isReferenceDragActive ? 'שחררו כאן את הקבצים' : 'העלו דוגמאות להתייחסות'}
            </h3>
            <p className="text-sm text-gray-500 mb-2">השראות, סגנון עיצוב, דוגמאות שאהבתם</p>
            <p className="text-xs text-gray-400">JPG, PNG, PDF (מקסימום 20MB, עד 10 קבצים)</p>
          </div>

          {/* Uploaded Reference Files */}
          {formData.referenceExamples && formData.referenceExamples.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 text-center">
                דוגמאות שהועלו ({formData.referenceExamples.length}/10)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {formData.referenceExamples.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      {getFilePreview(file)}
                      <div className="absolute top-1 right-1">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <button
                          onClick={() => removeReferenceFile(index)}
                          className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 text-center truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Optional Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
        <p className="text-gray-700 text-sm">
          <strong>שימו לב:</strong> חלק זה אופציונלי. ניתן לדלג ולעבור ישירות לסקירה ואישור
        </p>
      </div>
    </div>
  );
};

export default ClientAdditionalDetailsStep; 