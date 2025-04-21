import React from "react";
import { DrinkItem } from "./DrinkItem";
import { FoodItem } from "@/types/food-vision";

interface DrinksListProps {
  drinks: FoodItem[];
  onDelete: (id: string) => void;
  onChange: (id: string, field: keyof FoodItem, value: string) => void;
  onFileChange: (id: string, files: File[] | undefined) => void;
}

export const DrinksList: React.FC<DrinksListProps> = ({
  drinks,
  onDelete,
  onChange,
  onFileChange,
}) => {
  if (drinks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        לא נוספו משקאות עדיין. לחץ/י על "הוסף/י שתייה" כדי להתחיל.
      </div>
    );
  }

  return (
    <>
      {drinks.map((drink, index) => (
        <DrinkItem
          key={drink.id}
          drink={drink}
          index={index}
          onDelete={onDelete}
          onChange={onChange}
          onFileChange={onFileChange}
        />
      ))}
    </>
  );
};