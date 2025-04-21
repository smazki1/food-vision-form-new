
import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { CollapsibleFoodItem } from "@/components/admin/CollapsibleFoodItem";

interface DrinksTabContentProps {
  drinks: Array<{
    drink_id: string;
    name: string;
    ingredients: string;
    description: string;
    notes: string;
    reference_image_urls: string[];
  }>;
}

export const DrinksTabContent: React.FC<DrinksTabContentProps> = ({ drinks }) => {
  return (
    <>
      {drinks.length > 0 ? (
        <div className="space-y-4">
          {drinks.map((drink, index) => (
            <CollapsibleFoodItem
              key={drink.drink_id}
              title={`משקה ${index + 1}: ${drink.name}`}
              name={drink.name}
              ingredients={drink.ingredients}
              description={drink.description}
              notes={drink.notes}
              images={drink.reference_image_urls}
            />
          ))}
          <Button
            className="w-full bg-[#F3752B] hover:bg-[#F3752B]/90 mt-4"
            onClick={() => window.location.href = '/'}
          >
            <PlusCircle className="h-4 w-4 ml-2" />
            הוסף משקה חדש
          </Button>
        </div>
      ) : (
        <div className="text-center py-8 space-y-4">
          <p className="text-muted-foreground">לא נוספו משקאות</p>
          <Button
            className="bg-[#F3752B] hover:bg-[#F3752B]/90"
            onClick={() => window.location.href = '/'}
          >
            <PlusCircle className="h-4 w-4 ml-2" />
            הוסף משקה חדש
          </Button>
        </div>
      )}
    </>
  );
};
