
import React from "react";
import { Button } from "@/components/ui/button";
import { FoodItem } from "@/types/food-vision";
import { PlusCircle } from "lucide-react";
import { generateId } from "@/utils/generateId";
import { CocktailsList } from "./cocktails/CocktailsList";

interface CocktailsTabProps {
  cocktails: FoodItem[];
  setCocktails: React.Dispatch<React.SetStateAction<FoodItem[]>>;
}

const CocktailsTab: React.FC<CocktailsTabProps> = ({ cocktails, setCocktails }) => {
  const addCocktail = () => {
    if (cocktails.length >= 50) {
      return;
    }
    
    setCocktails([
      ...cocktails,
      {
        id: generateId(),
        name: "",
        ingredients: "",
        description: "",
        notes: "",
      },
    ]);
  };

  const removeCocktail = (id: string) => {
    setCocktails(cocktails.filter((cocktail) => cocktail.id !== id));
  };

  const handleCocktailChange = (
    id: string,
    field: keyof FoodItem,
    value: string
  ) => {
    setCocktails(
      cocktails.map((cocktail) =>
        cocktail.id === id ? { ...cocktail, [field]: value } : cocktail
      )
    );
  };

  const handleFileChange = (id: string, files: File[] | undefined) => {
    setCocktails(
      cocktails.map((cocktail) =>
        cocktail.id === id ? { ...cocktail, referenceImages: files } : cocktail
      )
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-muted/20 p-4 rounded-md mb-6">
        <p className="text-sm text-muted-foreground text-center">
          מלא/י את פרטי הקוקטיילים שלך – לחץ/י על 'הוסף/י קוקטייל' כדי להוסיף קוקטייל חדש.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-4 mb-4">
        <p className="text-sm font-medium text-center">
          מספר הקוקטיילים שנוספו: {cocktails.length}
        </p>
        <Button
          id="add-cocktail-button"
          type="button"
          onClick={addCocktail}
          className="bg-[#F3752B] hover:bg-[#F3752B]/90"
          disabled={cocktails.length >= 50}
        >
          <PlusCircle className="h-4 w-4 ml-2" />
          הוסף/י קוקטייל
        </Button>
      </div>

      <CocktailsList
        cocktails={cocktails}
        onDelete={removeCocktail}
        onChange={handleCocktailChange}
        onFileChange={handleFileChange}
        onAddNew={addCocktail}
      />
    </div>
  );
};

export default CocktailsTab;
