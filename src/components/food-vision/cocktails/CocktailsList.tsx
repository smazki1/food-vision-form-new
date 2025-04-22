
import React from "react";
import { CocktailItem } from "./CocktailItem";
import { FoodItem } from "@/types/food-vision";

interface CocktailsListProps {
  cocktails: FoodItem[];
  onDelete: (id: string) => void;
  onChange: (id: string, field: keyof FoodItem, value: string) => void;
  onFileChange: (id: string, files: File[] | undefined) => void;
}

export const CocktailsList: React.FC<CocktailsListProps> = ({
  cocktails,
  onDelete,
  onChange,
  onFileChange,
}) => {
  const addCocktail = () => {
    const addButton = document.getElementById('add-cocktail-button');
    if (addButton) {
      addButton.click();
    }
  };

  return (
    <div>
      {cocktails.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">
          לא נוספו קוקטיילים עדיין. לחץ/י על "הוסף/י קוקטייל" כדי להתחיל.
        </p>
      ) : (
        cocktails.map((cocktail, index) => (
          <CocktailItem
            key={cocktail.id}
            cocktail={cocktail}
            index={index}
            onDelete={onDelete}
            onChange={onChange}
            onFileChange={onFileChange}
            onAddNew={addCocktail}
          />
        ))
      )}
    </div>
  );
};
