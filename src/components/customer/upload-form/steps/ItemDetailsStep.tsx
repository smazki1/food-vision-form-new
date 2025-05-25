import React, { useEffect } from 'react';
import { useNewItemForm, ItemType } from '@/contexts/NewItemFormContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { StepProps } from '../FoodVisionUploadForm';
import { Card } from '@/components/ui/card';

const ItemDetailsStep: React.FC<StepProps> = ({ errors: externalErrors, clearExternalErrors }) => {
  const { formData, updateFormData } = useNewItemForm();
  const errors = externalErrors || {};

  useEffect(() => {
    return () => {
      if (clearExternalErrors) clearExternalErrors();
    };
  }, [clearExternalErrors]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
    if (errors && errors[name] && clearExternalErrors) {
      clearExternalErrors();
    }
  };

  const handleSelectChange = (value: ItemType) => {
    updateFormData({ itemType: value });
    if (errors.itemType && clearExternalErrors) {
      clearExternalErrors();
    }
  };
  
  return (
    <div className="space-y-4">
      <Card className="p-4 bg-card/50">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="itemName" className="text-sm font-medium text-foreground">
              שם הפריט <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="itemName"
              name="itemName"
              value={formData.itemName}
              onChange={handleChange}
              placeholder="לדוגמה: פסטה קרבונרה, מוחיטו קלאסי"
              className={`bg-background/50 ${errors?.itemName ? 'border-destructive' : ''}`}
              aria-invalid={!!errors?.itemName}
            />
            {errors?.itemName && (
              <p className="text-sm text-destructive">{errors.itemName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemType" className="text-sm font-medium text-foreground">
              סוג הפריט <span className="text-destructive">*</span>
            </Label>
            <Select 
              name="itemType" 
              value={formData.itemType}
              onValueChange={handleSelectChange}
            >
              <SelectTrigger 
                id="itemType" 
                className={`bg-background/50 ${errors?.itemType ? 'border-destructive' : ''}`}
              >
                <SelectValue placeholder="בחר סוג פריט" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dish">מנה</SelectItem>
                <SelectItem value="cocktail">קוקטייל</SelectItem>
                <SelectItem value="drink">משקה</SelectItem>
              </SelectContent>
            </Select>
            {errors?.itemType && (
              <p className="text-sm text-destructive">{errors.itemType}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-foreground">
              מרכיבים עיקריים <span className="text-xs text-muted-foreground">(אופציונלי)</span>
            </Label>
            <Textarea 
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="פרט את המרכיבים העיקריים של הפריט"
              rows={3}
              className="bg-background/50 resize-none"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialNotes" className="text-sm font-medium text-foreground">
              הערות מיוחדות <span className="text-xs text-muted-foreground">(אופציונלי)</span>
            </Label>
            <Textarea 
              id="specialNotes"
              name="specialNotes"
              value={formData.specialNotes}
              onChange={handleChange}
              placeholder="הערות מיוחדות לצילום או עיבוד"
              rows={3}
              className="bg-background/50 resize-none"
              maxLength={300}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ItemDetailsStep; 