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
}
export const DishItem: React.FC<DishItemProps> = ({
  dish,
  index,
  onDelete,
  onChange,
  onFileChange
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const handleRemoveImage = (removeIdx: number) => {
    const newFiles = dish.referenceImages?.filter((_, idx) => idx !== removeIdx) || [];
    onFileChange(dish.id, newFiles.length ? newFiles : undefined);
  };
  return <div className="p-4 border border-input rounded-md mb-4 bg-white">
      <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <h3 className="font-medium flex items-center gap-2">
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          מנה {index + 1}: {dish.name || 'מנה חדשה'}
        </h3>
        <Button type="button" variant="ghost" size="sm" onClick={e => {
        e.stopPropagation();
        onDelete(dish.id);
      }} className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4 ml-2" />
          הסר/י
        </Button>
      </div>

      {isOpen && <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`dish-name-${dish.id}`}>שם המנה *</Label>
            <Input id={`dish-name-${dish.id}`} value={dish.name} onChange={e => onChange(dish.id, "name", e.target.value)} placeholder="הזן/י את שם המנה" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`dish-ingredients-${dish.id}`}> רשימת מרכיבים עיקריים (אופציונלי)</Label>
            <Textarea id={`dish-ingredients-${dish.id}`} value={dish.ingredients} onChange={e => onChange(dish.id, "ingredients", e.target.value)} placeholder="הזן/י את המרכיבים העיקריים (אופציונלי)" />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`dish-description-${dish.id}`}>תיאור קצר (אופציונלי)</Label>
            <Textarea id={`dish-description-${dish.id}`} value={dish.description} onChange={e => onChange(dish.id, "description", e.target.value)} placeholder="הזן/י תיאור קצר כולל מרכיבים (אופציונלי)" />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`dish-notes-${dish.id}`}>(אופציונלי) הערות מיוחדות</Label>
            <Textarea id={`dish-notes-${dish.id}`} value={dish.notes} onChange={e => onChange(dish.id, "notes", e.target.value)} placeholder="הזן/י הערות מיוחדות" />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`dish-image-${dish.id}`}>תמונות ייחוס</Label>
            <div className="flex items-center gap-2">
              <Input id={`dish-image-${dish.id}`} type="file" accept="image/*" multiple onChange={e => {
            const files = Array.from(e.target.files || []);
            const validFiles = files.filter(file => {
              if (file.size > 5 * 1024 * 1024) {
                alert("גודל הקובץ גדול מ-5MB");
                return false;
              }
              return true;
            });
            onFileChange(dish.id, validFiles.length > 0 ? validFiles : undefined);
          }} className="hidden" />
              <Button type="button" variant="outline" onClick={() => {
            document.getElementById(`dish-image-${dish.id}`)?.click();
          }}>
                <ImageIcon className="h-4 w-4 ml-2" />
                {dish.referenceImages?.length ? "החלף/י תמונות" : "העלה/י תמונות"}
              </Button>
              {dish.referenceImages?.length ? <span className="text-sm text-muted-foreground">
                  {dish.referenceImages.length} תמונות נבחרו
                </span> : null}
            </div>
            <FilePreviewGrid files={dish.referenceImages || []} onRemove={handleRemoveImage} />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>הצג/י מספר זויות שונות וברורות של המנה ללא פרטים נוספים</p>
              <p className="text-[11px] opacity-75">מקסימום 5MB לתמונה, עד 4 תמונות</p>
            </div>
          </div>
        </div>}
    </div>;
};