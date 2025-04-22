
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, ImageIcon, ChevronDown } from "lucide-react";
import { FoodItem } from "@/types/food-vision";
import { FilePreviewGrid } from "../FilePreviewGrid";

interface DishItemProps {
  dish: FoodItem;
  index: number;
  onDelete: (id: string) => void;
  onChange: (id: string, field: keyof FoodItem, value: string) => void;
  onFileChange: (id: string, files: File[] | undefined) => void;
  onAddNew: () => void;
}

export const DishItem: React.FC<DishItemProps> = ({
  dish,
  index,
  onDelete,
  onChange,
  onFileChange,
  onAddNew
}) => {
  const [isOpen, setIsOpen] = useState(true);
  
  // Ensure dish has required properties with proper defaults
  const safeDish = {
    id: dish?.id || "",
    name: dish?.name || "",
    ingredients: dish?.ingredients || "",
    description: dish?.description || "",
    notes: dish?.notes || "",
    referenceImages: Array.isArray(dish?.referenceImages) ? 
      dish.referenceImages.filter(img => img instanceof File) : []
  };
  
  console.log(`DishItem ${index} rendered with referenceImages:`, 
    Array.isArray(safeDish.referenceImages) ? safeDish.referenceImages.length : 'not an array');

  const handleRemoveImage = (removeIdx: number) => {
    if (!Array.isArray(safeDish.referenceImages)) {
      console.error("referenceImages is not an array");
      return;
    }
    
    const newFiles = safeDish.referenceImages.filter((_, idx) => idx !== removeIdx);
    onFileChange(safeDish.id, newFiles.length ? newFiles : undefined);
  };

  return (
    <div className="p-4 border border-input rounded-md mb-4 bg-white">
      <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <h3 className="font-medium flex items-center gap-2">
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          מנה {index + 1}: {safeDish.name || 'מנה חדשה'}
        </h3>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={e => {
            e.stopPropagation();
            onDelete(safeDish.id);
          }} 
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 ml-2" />
          הסר/י
        </Button>
      </div>

      {isOpen && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`dish-name-${safeDish.id}`}>שם המנה *</Label>
            <Input 
              id={`dish-name-${safeDish.id}`} 
              value={safeDish.name} 
              onChange={e => onChange(safeDish.id, "name", e.target.value)} 
              placeholder="הזן/י את שם המנה" 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`dish-ingredients-${safeDish.id}`}> רשימת מרכיבים עיקריים (אופציונלי)</Label>
            <Textarea 
              id={`dish-ingredients-${safeDish.id}`} 
              value={safeDish.ingredients} 
              onChange={e => onChange(safeDish.id, "ingredients", e.target.value)} 
              placeholder="הזן/י את המרכיבים העיקריים (אופציונלי)" 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`dish-description-${safeDish.id}`}>תיאור קצר (אופציונלי)</Label>
            <Textarea 
              id={`dish-description-${safeDish.id}`} 
              value={safeDish.description} 
              onChange={e => onChange(safeDish.id, "description", e.target.value)} 
              placeholder="הזן/י תיאור קצר כולל מרכיבים (אופציונלי)" 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`dish-notes-${safeDish.id}`}>(אופציונלי) הערות מיוחדות</Label>
            <Textarea 
              id={`dish-notes-${safeDish.id}`} 
              value={safeDish.notes} 
              onChange={e => onChange(safeDish.id, "notes", e.target.value)} 
              placeholder="הזן/י הערות מיוחדות" 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`dish-image-${safeDish.id}`}>תמונות ייחוס</Label>
            <div className="flex items-center gap-2">
              <Input 
                id={`dish-image-${safeDish.id}`} 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={e => {
                  const fileList = e.target.files;
                  if (!fileList || fileList.length === 0) return;
                  
                  const files = Array.from(fileList);
                  const validFiles = files.filter(file => {
                    if (file.size > 5 * 1024 * 1024) {
                      alert("גודל הקובץ גדול מ-5MB");
                      return false;
                    }
                    return true;
                  });
                  
                  if (validFiles.length > 0) {
                    onFileChange(safeDish.id, validFiles);
                  }
                  
                  // Clear the input value to allow uploading the same file again
                  e.target.value = '';
                }} 
                className="hidden" 
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  document.getElementById(`dish-image-${safeDish.id}`)?.click();
                }}
              >
                <ImageIcon className="h-4 w-4 ml-2" />
                {Array.isArray(safeDish.referenceImages) && safeDish.referenceImages.length 
                  ? "החלף/י תמונות" 
                  : "העלה/י תמונות"
                }
              </Button>
              {Array.isArray(safeDish.referenceImages) && safeDish.referenceImages.length > 0 ? (
                <span className="text-sm text-muted-foreground">
                  {safeDish.referenceImages.length} תמונות נבחרו
                </span>
              ) : null}
            </div>
            
            {Array.isArray(safeDish.referenceImages) && safeDish.referenceImages.length > 0 && (
              <FilePreviewGrid 
                files={safeDish.referenceImages} 
                onRemove={handleRemoveImage} 
              />
            )}
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>הצג/י מספר זויות שונות וברורות של המנה ללא פרטים נוספים</p>
              <p className="text-[11px] opacity-75">מקסימום 5MB לתמונה, עד 4 תמונות</p>
            </div>
          </div>

          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onAddNew();
            }}
            className="w-full mt-6 bg-[#F3752B] hover:bg-[#F3752B]/90"
          >
            הוסף/י מנה נוספת
          </Button>
        </div>
      )}
    </div>
  );
};
