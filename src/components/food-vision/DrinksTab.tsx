
import React from "react";
import { Button } from "@/components/ui/button";
import { FoodItem } from "@/types/food-vision";
import { PlusCircle } from "lucide-react";
import { generateId } from "@/utils/generateId";
import { DrinksList } from "./drinks/DrinksList";

interface DrinksTabProps {
  drinks: FoodItem[];
  setDrinks: React.Dispatch<React.SetStateAction<FoodItem[]>>;
}

const DrinksTab: React.FC<DrinksTabProps> = ({ drinks, setDrinks }) => {
  const addDrink = () => {
    if (drinks.length >= 50) {
      return;
    }
    
    setDrinks([
      ...drinks,
      {
        id: generateId(),
        name: "",
        ingredients: "",
        description: "",
        notes: "",
      },
    ]);
  };

  const handleDrinkChange = (
    id: string,
    field: keyof FoodItem,
    value: string
  ) => {
    setDrinks(
      drinks.map((drink) =>
        drink.id === id ? { ...drink, [field]: value } : drink
      )
    );
  };

  const handleFileChange = (id: string, files: File[] | undefined) => {
    setDrinks(
      drinks.map((drink) =>
        drink.id === id ? { ...drink, referenceImages: files } : drink
      )
    );
  };

  const removeDrink = (id: string) => {
    setDrinks(drinks.filter((drink) => drink.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-muted/20 p-4 rounded-md mb-6">
        <p className="text-sm text-muted-foreground text-center">
          מלא/י את פרטי המשקאות שלך – לחץ/י על 'הוסף/י שתייה' כדי להוסיף משקה חדש.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-4 mb-4">
        <p className="text-sm font-medium text-center">
          מספר המשקאות שנוספו: {drinks.length}
        </p>
        <Button
          type="button"
          onClick={addDrink}
          className="bg-[#F3752B] hover:bg-[#F3752B]/90"
          disabled={drinks.length >= 50}
        >
          <PlusCircle className="h-4 w-4 ml-2" />
          הוסף/י שתייה
        </Button>
      </div>

      <DrinksList
        drinks={drinks}
        onDelete={removeDrink}
        onChange={handleDrinkChange}
        onFileChange={handleFileChange}
      />
    </div>
  );
};

export default DrinksTab;
