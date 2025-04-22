
import React from "react";
import { DishItem } from "./DishItem";
import { FoodItem } from "@/types/food-vision";

interface DishesListProps {
  dishes: FoodItem[];
  onDelete: (id: string) => void;
  onChange: (id: string, field: keyof FoodItem, value: string) => void;
  onFileChange: (id: string, files: File[] | undefined) => void;
  onAddNew: () => void;
}

export const DishesList: React.FC<DishesListProps> = ({
  dishes,
  onDelete,
  onChange,
  onFileChange,
  onAddNew,
}) => {
  // Ensure we're working with an array
  const safeItems = Array.isArray(dishes) ? dishes : [];

  return (
    <div>
      {safeItems.length === 0 ? (
        <div className="text-center py-8 space-y-4">
          <p className="text-muted-foreground">
            לא נוספו מנות עדיין. לחץ/י על "הוסף/י מנה" כדי להתחיל.
          </p>
        </div>
      ) : (
        safeItems.map((dish, index) => (
          <DishItem
            key={dish.id || index}
            dish={dish}
            index={index}
            onDelete={onDelete}
            onChange={onChange}
            onFileChange={onFileChange}
            onAddNew={onAddNew}
          />
        ))
      )}
    </div>
  );
};
