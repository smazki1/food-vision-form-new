
import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { generateId } from "@/utils/generateId";
import { DishesList } from "./dishes/DishesList";
import { FoodItem } from "@/types/food-vision";

interface DishesTabProps {
  dishes: FoodItem[];
  setDishes: React.Dispatch<React.SetStateAction<FoodItem[]>>;
}

const DishesTab: React.FC<DishesTabProps> = ({ dishes, setDishes }) => {
  const addDish = () => {
    if (dishes.length >= 100) {
      return;
    }
    
    setDishes((currentDishes) => [
      ...(Array.isArray(currentDishes) ? currentDishes : []),
      {
        id: generateId(),
        name: "",
        ingredients: "",
        description: "",
        notes: "",
        referenceImages: [],
      },
    ]);
  };

  const removeDish = (id: string) => {
    setDishes((currentDishes) => 
      Array.isArray(currentDishes) 
        ? currentDishes.filter((dish) => dish.id !== id) 
        : []
    );
  };

  const handleDishChange = (
    id: string,
    field: keyof FoodItem,
    value: string
  ) => {
    setDishes((currentDishes) =>
      Array.isArray(currentDishes) 
        ? currentDishes.map((dish) =>
            dish.id === id ? { ...dish, [field]: value } : dish
          )
        : []
    );
  };

  const handleFileChange = (id: string, files: File[] | undefined) => {
    setDishes((currentDishes) =>
      Array.isArray(currentDishes) 
        ? currentDishes.map((dish) =>
            dish.id === id ? { ...dish, referenceImages: files || [] } : dish
          )
        : []
    );
  };

  // Ensure dishes is always an array
  const safeDishes = Array.isArray(dishes) ? dishes : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-muted/20 p-4 rounded-md mb-6">
        <p className="text-sm text-muted-foreground text-center">
          מלא/י את פרטי המנות שלך – לחץ/י על 'הוסף/י מנה' כדי להוסיף מנה חדשה.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-4 mb-4">
        <p className="text-sm font-medium text-center">
          מספר המנות שנוספו: {safeDishes.length}
        </p>
        <Button
          id="add-dish-button"
          type="button"
          onClick={addDish}
          className="bg-[#F3752B] hover:bg-[#F3752B]/90"
          disabled={safeDishes.length >= 100}
        >
          <PlusCircle className="h-4 w-4 ml-2" />
          הוסף/י מנה
        </Button>
      </div>

      <DishesList
        dishes={safeDishes}
        onDelete={removeDish}
        onChange={handleDishChange}
        onFileChange={handleFileChange}
        onAddNew={addDish}
      />
    </div>
  );
};

export default DishesTab;
