import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { DishesList } from "./dishes/DishesList";
import { FoodItem } from "@/types/food-vision";

interface DishesTabProps {
  dishes: FoodItem[];
  setDishes: React.Dispatch<React.SetStateAction<FoodItem[]>>;
}

const DishesTab: React.FC<DishesTabProps> = ({ dishes, setDishes }) => {
  const addDish = () => {
    if (dishes.length >= 100) {
      return; // Max limit reached
    }
    
    setDishes([
      ...dishes,
      {
        id: uuidv4(),
        name: "",
        ingredients: "",
        description: "",
        notes: "",
      },
    ]);
  };

  const removeDish = (id: string) => {
    setDishes(dishes.filter((dish) => dish.id !== id));
  };

  const handleDishChange = (
    id: string,
    field: keyof FoodItem,
    value: string
  ) => {
    setDishes(
      dishes.map((dish) =>
        dish.id === id ? { ...dish, [field]: value } : dish
      )
    );
  };

  const handleFileChange = (id: string, files: File[] | undefined) => {
    setDishes(
      dishes.map((dish) =>
        dish.id === id ? { ...dish, referenceImages: files } : dish
      )
    );
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
          מספר המנות שנוספו: {dishes.length}
        </p>
        <Button
          type="button"
          onClick={addDish}
          className="bg-[#F3752B] hover:bg-[#F3752B]/90"
          disabled={dishes.length >= 100}
        >
          <PlusCircle className="h-4 w-4 ml-2" />
          הוסף/י מנה
        </Button>
      </div>

      <DishesList
        dishes={dishes}
        onDelete={removeDish}
        onChange={handleDishChange}
        onFileChange={handleFileChange}
      />
    </div>
  );
};

export default DishesTab;
