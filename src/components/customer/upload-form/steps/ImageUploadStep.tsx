import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { StepProps } from '../FoodVisionUploadForm';
import { Card } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

const ImageUploadStep: React.FC<StepProps> = ({ errors: externalErrors }) => {
  const { formData, updateFormData } = useNewItemForm();
  const errors = externalErrors || {};
  const [checklist, setChecklist] = React.useState({
    imageQuality: false,
    composition: false,
    colors: false
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...formData.referenceImages];
    acceptedFiles.forEach(file => {
      if (!newFiles.find(f => f.name === file.name)) {
        newFiles.push(file);
      }
    });
    updateFormData({ referenceImages: newFiles.slice(0, 10) });
  }, [formData.referenceImages, updateFormData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxSize: 20 * 1024 * 1024 // 20MB
  });

  const removeImage = (index: number) => {
    const newFiles = [...formData.referenceImages];
    newFiles.splice(index, 1);
    updateFormData({ referenceImages: newFiles });
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="p-4">
        <div className="text-center mb-4">
          <h3 className="text-sm font-medium mb-1">העלאת תמונות איכותיות</h3>
          <p className="text-xs text-muted-foreground">יש להעלות בין 3 ל-10 תמונות</p>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`}
        >
          <input {...getInputProps()} />
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isDragActive ? 'שחרר כאן את הקבצים' : 'גרור לכאן תמונות או לחץ לבחירה'}
          </p>
        </div>

        {errors?.referenceImages && (
          <p className="text-sm text-destructive mt-2">{errors.referenceImages}</p>
        )}

        {formData.referenceImages.length > 0 && (
          <div className="mt-6">
            <div className="grid grid-cols-1 gap-4">
              {formData.referenceImages.map((file, index) => (
                <div key={file.name} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`תמונה ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeImage(index);
                    }}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Quality Checklist */}
      {formData.referenceImages.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-4">רשימת איכות</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Checkbox
                id="imageQuality"
                checked={checklist.imageQuality}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, imageQuality: checked as boolean }))
                }
              />
              <label
                htmlFor="imageQuality"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                התמונה ברורה ומוארת היטב
              </label>
            </div>
            
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Checkbox
                id="composition"
                checked={checklist.composition}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, composition: checked as boolean }))
                }
              />
              <label
                htmlFor="composition"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                המנה ממורכזת ובפוקוס
              </label>
            </div>

            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Checkbox
                id="colors"
                checked={checklist.colors}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, colors: checked as boolean }))
                }
              />
              <label
                htmlFor="colors"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                הצבעים חיים ומושכים
              </label>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ImageUploadStep; 