
import React, { useEffect } from "react";
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
  // Ensure dishes is always an array
  useEffect(() => {
    if (!Array.isArray(dishes)) {
      console.log("Dishes is not an array, initializing to empty array");
      setDishes([]);
    }
  }, [dishes, setDishes]);
  
  // Ensure we're working with an array for all operations
  const safeDishes = Array.isArray(dishes) ? dishes : [];
  
  console.log("DishesTab rendered with dishes:", safeDishes);
  
  const addDish = () => {
    if (safeDishes.length >= 100) {
      return;
    }
    
    const newDish = {
      id: generateId(),
      name: "",
      ingredients: "",
      description: "",
      notes: "",
      referenceImages: [],
    };
    
    setDishes(currentDishes => {
      // Make sure we're always working with arrays
      const currentArray = Array.isArray(currentDishes) ? currentDishes : [];
      return [...currentArray, newDish];
    });
  };

  const removeDish = (id: string) => {
    setDishes(currentDishes => {
      const currentArray = Array.isArray(currentDishes) ? currentDishes : [];
      return currentArray.filter(dish => dish.id !== id);
    });
  };

  const handleDishChange = (
    id: string,
    field: keyof FoodItem,
    value: string
  ) => {
    setDishes(currentDishes => {
      const currentArray = Array.isArray(currentDishes) ? currentDishes : [];
      return currentArray.map(dish =>
        dish.id === id ? { ...dish, [field]: value } : dish
      );
    });
  };

  const handleFileChange = (id: string, files: File[] | undefined) => {
    setDishes(currentDishes => {
      const currentArray = Array.isArray(currentDishes) ? currentDishes : [];
      return currentArray.map(dish =>
        dish.id === id ? { ...dish, referenceImages: files || [] } : dish
      );
    });
  };

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
