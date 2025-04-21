import React from "react";
import { DishItem } from "./DishItem";
import { FoodItem } from "@/types/food-vision";

interface DishesListProps {
  dishes: FoodItem[];
  onDelete: (id: string) => void;
  onChange: (id: string, field: keyof FoodItem, value: string) => void;
  onFileChange: (id: string, files: File[] | undefined) => void;
}

export const DishesList: React.FC<DishesListProps> = ({
  dishes,
  onDelete,
  onChange,
  onFileChange,
}) => {
  if (dishes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        לא נוספו מנות עדיין. לחץ/י על "הוסף/י מנה" כדי להתחיל.
      </div>
    );
  }

  return (
    <>
      {dishes.map((dish, index) => (
        <DishItem
          key={dish.id}
          dish={dish}
          index={index}
          onDelete={onDelete}
          onChange={onChange}
          onFileChange={onFileChange}
        />
      ))}
    </>
  );
};
