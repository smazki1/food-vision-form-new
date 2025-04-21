
import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { CollapsibleFoodItem } from "@/components/admin/CollapsibleFoodItem";

interface CocktailsTabContentProps {
  cocktails: Array<{
    cocktail_id: string;
    name: string;
    ingredients: string;
    description: string;
    notes: string;
    reference_image_urls: string[];
  }>;
}

export const CocktailsTabContent: React.FC<CocktailsTabContentProps> = ({ cocktails }) => {
  return (
    <>
      {cocktails.length > 0 ? (
        <div className="space-y-4">
          {cocktails.map((cocktail, index) => (
            <CollapsibleFoodItem
              key={cocktail.cocktail_id}
              title={`קוקטייל ${index + 1}: ${cocktail.name}`}
              name={cocktail.name}
              ingredients={cocktail.ingredients}
              description={cocktail.description}
              notes={cocktail.notes}
              images={cocktail.reference_image_urls}
            />
          ))}
          <Button
            className="w-full bg-[#F3752B] hover:bg-[#F3752B]/90 mt-4"
            onClick={() => window.location.href = '/'}
          >
            <PlusCircle className="h-4 w-4 ml-2" />
            הוסף קוקטייל חדש
          </Button>
        </div>
      ) : (
        <div className="text-center py-8 space-y-4">
          <p className="text-muted-foreground">לא נוספו קוקטיילים</p>
          <Button
            className="bg-[#F3752B] hover:bg-[#F3752B]/90"
            onClick={() => window.location.href = '/'}
          >
            <PlusCircle className="h-4 w-4 ml-2" />
            הוסף קוקטייל חדש
          </Button>
        </div>
      )}
    </>
  );
};
