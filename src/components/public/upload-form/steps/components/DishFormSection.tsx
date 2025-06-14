import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { DishData } from '@/contexts/NewItemFormContext';
import { IconInput } from '@/components/ui/icon-input';
import { IconTextarea } from '@/components/ui/icon-textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { UploadCloud, Trash2, AlertTriangle, UtensilsCrossed, FileImage, Lightbulb, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DishFormSectionProps {
  dish: DishData;
  errors?: Record<string, string>;
  onUpdate: (updates: Partial<DishData>) => void;
}

const DishFormSection: React.FC<DishFormSectionProps> = ({ dish, errors = {}, onUpdate }) => {
  const [qualityChecked, setQualityChecked] = useState(dish.qualityConfirmed);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    const currentFiles = dish.referenceImages || [];
    const newFiles = [...currentFiles];
    
    acceptedFiles.forEach(file => {
      // Check if file already exists and if we haven't reached the limit
      const fileExists = newFiles.some(existingFile => 
        existingFile.name === file.name && existingFile.size === file.size
      );
      
      if (!fileExists && newFiles.length < 10) {
        newFiles.push(file);
      }
    });
    
    // Only update if there are actually new files
    if (newFiles.length !== currentFiles.length) {
      onUpdate({ referenceImages: newFiles });
    }

    if (fileRejections.length > 0) {
      console.warn("File rejections:", fileRejections);
    }
  }, [dish.referenceImages, onUpdate]);

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
    const newFiles = [...dish.referenceImages];
    newFiles.splice(index, 1);
    onUpdate({ referenceImages: newFiles });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onUpdate({ [name]: value });
  };

  // Handle item type selection
  const handleItemTypeSelect = (type: string) => {
    if (type === 'other') {
      onUpdate({ 
        isCustomItemType: true, 
        itemType: dish.customItemType || ''
      });
    } else {
      onUpdate({ 
        isCustomItemType: false, 
        itemType: type,
        customItemType: ''
      });
    }
  };

  const handleCustomItemTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onUpdate({ 
      customItemType: value,
      itemType: value
    });
  };

  // Item type options
  const itemTypes = [
    { id: 'dish', label: 'מנה עיקרית', icon: '🍽️' },
    { id: 'drink', label: 'משקה', icon: '🥤' },
    { id: 'cocktail', label: 'קוקטייל', icon: '🍹' },
    { id: 'other', label: 'אחר', icon: '🔖' }
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Item Type Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">סוג המוצר *</Label>
        <div className="grid grid-cols-2 gap-3">
          {itemTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => handleItemTypeSelect(type.id)}
              className={cn(
                "flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-sm font-medium",
                dish.itemType === type.id || (type.id === 'other' && dish.isCustomItemType)
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              )}
            >
              <span className="text-lg">{type.icon}</span>
              {type.label}
            </button>
          ))}
        </div>
        
        {/* Custom Item Type Input */}
        {dish.isCustomItemType && (
          <div className="mt-3">
            <IconInput
              id={`customItemType-${dish.id}`}
              name="customItemType"
              icon={<UtensilsCrossed />}
              label=""
              placeholder="הזינו את סוג המוצר"
              value={dish.customItemType}
              onChange={handleCustomItemTypeChange}
              error={errors?.itemType}
            />
          </div>
        )}
        

      </div>

      {/* Item Name */}
      <div className="space-y-2">
        <Label htmlFor={`itemName-${dish.id}`} className="text-sm font-medium text-gray-700">
          שם המנה/המוצר *
        </Label>
        <IconInput
          id={`itemName-${dish.id}`}
          icon={<CheckCircle />}
          label=""
          placeholder="למשל: פסטה ברוטב עגבניות"
          name="itemName"
          value={dish.itemName}
          onChange={handleChange}
          error={errors?.itemName}
        />

      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor={`description-${dish.id}`} className="text-sm font-medium text-gray-700">
          תיאור המנה *
        </Label>
        <IconTextarea
          id={`description-${dish.id}`}
          icon={<CheckCircle />}
          label=""
          placeholder="תארו את המנה - רכיבים, טעמים, סגנון הגשה..."
          name="description"
          value={dish.description}
          onChange={handleChange}
          rows={4}
          error={errors?.description}
        />

      </div>

      {/* Special Notes */}
      <div className="space-y-2">
        <Label htmlFor={`specialNotes-${dish.id}`} className="text-sm font-medium text-gray-700">
          הערות מיוחדות (אופציונלי)
        </Label>
        <IconTextarea
          id={`specialNotes-${dish.id}`}
          icon={<CheckCircle />}
          label=""
          placeholder="הערות נוספות, בקשות מיוחדות לעיצוב..."
          name="specialNotes"
          value={dish.specialNotes}
          onChange={handleChange}
          rows={3}
          error={errors?.specialNotes}
        />
      </div>

      {/* Image Upload */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-gray-700">תמונות המנה *</Label>
        
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-primary hover:bg-gray-50"
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          
          {isDragActive ? (
            <p className="text-primary font-medium">השליכו את התמונות כאן...</p>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-600 font-medium">
                לחצו כאן או גררו תמונות לכאן
              </p>
              <p className="text-gray-400 text-sm">
                עד 10 תמונות, עד 20MB כל תמונה
              </p>
            </div>
          )}
        </div>

        {/* Uploaded Images Preview */}
        {dish.referenceImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {dish.referenceImages.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <Button
                  onClick={() => removeImage(index)}
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}


      </div>

      {/* Quality Confirmation */}
      <div className="space-y-3">
        <div className="flex items-start space-x-3 space-x-reverse">
          <Checkbox
            id={`quality-${dish.id}`}
            checked={qualityChecked}
            onCheckedChange={(checked) => {
              const isChecked = checked === true;
              setQualityChecked(isChecked);
              onUpdate({ qualityConfirmed: isChecked });
            }}
          />
          <div className="space-y-1">
            <Label 
              htmlFor={`quality-${dish.id}`}
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              אני מאשר/ת שהתמונות ברורות ומובנות *
            </Label>
            <p className="text-xs text-gray-500">
              תמונות ברורות ומובנות מבטיחות תוצאות טובות יותר
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DishFormSection; 