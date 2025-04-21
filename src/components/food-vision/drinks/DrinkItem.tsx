import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, ImageIcon } from "lucide-react";
import { FoodItem } from "@/types/food-vision";
import { FilePreviewGrid } from "../FilePreviewGrid";

interface DrinkItemProps {
  drink: FoodItem;
  index: number;
  onDelete: (id: string) => void;
  onChange: (id: string, field: keyof FoodItem, value: string) => void;
  onFileChange: (id: string, files: File[] | undefined) => void;
}

export const DrinkItem: React.FC<DrinkItemProps> = ({
  drink,
  index,
  onDelete,
  onChange,
  onFileChange,
}) => {
  const handleRemoveImage = (removeIdx: number) => {
    const newFiles =
      drink.referenceImages?.filter((_, idx) => idx !== removeIdx) || [];
    onFileChange(drink.id, newFiles.length ? newFiles : undefined);
  };

  return (
    <div className="p-4 border border-input rounded-md mb-4 bg-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">משקה {index + 1}</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDelete(drink.id)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 ml-2" />
          הסר/י
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`drink-name-${drink.id}`}>שם המשקה *</Label>
          <Input
            id={`drink-name-${drink.id}`}
            value={drink.name}
            onChange={(e) => onChange(drink.id, "name", e.target.value)}
            placeholder="הזן/י את שם המשקה"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`drink-ingredients-${drink.id}`}>רשימת מרכיבים עיקריים *</Label>
          <Textarea
            id={`drink-ingredients-${drink.id}`}
            value={drink.ingredients}
            onChange={(e) => onChange(drink.id, "ingredients", e.target.value)}
            placeholder="הזן/י את המרכיבים העיקריים"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`drink-description-${drink.id}`}>תיאור קצר</Label>
          <Textarea
            id={`drink-description-${drink.id}`}
            value={drink.description}
            onChange={(e) => onChange(drink.id, "description", e.target.value)}
            placeholder="הזן/י תיאור קצר כולל מרכיבים (אופציונלי)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`drink-notes-${drink.id}`}>הערות מיוחדות</Label>
          <Textarea
            id={`drink-notes-${drink.id}`}
            value={drink.notes}
            onChange={(e) => onChange(drink.id, "notes", e.target.value)}
            placeholder="הזן/י הערות מיוחדות"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`drink-image-${drink.id}`}>תמונות ייחוס</Label>
          <div className="flex items-center gap-2">
            <Input
              id={`drink-image-${drink.id}`}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                const validFiles = files.filter(file => {
                  if (file.size > 5 * 1024 * 1024) {
                    alert("גודל הקובץ גדול מ-5MB");
                    return false;
                  }
                  return true;
                });
                onFileChange(
                  drink.id,
                  validFiles.length > 0 ? validFiles : undefined
                );
              }}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                document.getElementById(`drink-image-${drink.id}`)?.click();
              }}
            >
              <ImageIcon className="h-4 w-4 ml-2" />
              {drink.referenceImages?.length ? "החלף/י תמונות" : "העלה/י תמונות"}
            </Button>
            {drink.referenceImages?.length && (
              <span className="text-sm text-muted-foreground">
                {drink.referenceImages.length} תמונות נבחרו
              </span>
            )}
          </div>
          <FilePreviewGrid
            files={drink.referenceImages || []}
            onRemove={handleRemoveImage}
          />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>הצג מספר זויות שונות וברורות של המשקה, בלבד ללא פרטים נוספים</p>
            <p className="text-[11px] opacity-75">מקסימום 5MB לתמונה, עד 4 תמונות</p>
          </div>
        </div>
      </div>
    </div>
  );
};
