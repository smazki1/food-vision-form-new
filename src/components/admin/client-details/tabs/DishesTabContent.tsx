
import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { CollapsibleFoodItem } from "@/components/admin/CollapsibleFoodItem";

interface DishesTabContentProps {
  dishes: Array<{
    dish_id: string;
    name: string;
    ingredients: string;
    description: string;
    notes: string;
    reference_image_urls: string[];
  }>;
}

export const DishesTabContent: React.FC<DishesTabContentProps> = ({ dishes }) => {
  return (
    <>
      {dishes.length > 0 ? (
        <div className="space-y-4">
          {dishes.map((dish, index) => (
            <CollapsibleFoodItem
              key={dish.dish_id}
              title={`מנה ${index + 1}: ${dish.name}`}
              name={dish.name}
              ingredients={dish.ingredients}
              description={dish.description}
              notes={dish.notes}
              images={dish.reference_image_urls}
            />
          ))}
          <Button
            className="w-full bg-[#F3752B] hover:bg-[#F3752B]/90 mt-4"
            onClick={() => window.location.href = '/'}
          >
            <PlusCircle className="h-4 w-4 ml-2" />
            הוסף מנה חדשה
          </Button>
        </div>
      ) : (
        <div className="text-center py-8 space-y-4">
          <p className="text-muted-foreground">לא נוספו מנות</p>
          <Button
            className="bg-[#F3752B] hover:bg-[#F3752B]/90"
            onClick={() => window.location.href = '/'}
          >
            <PlusCircle className="h-4 w-4 ml-2" />
            הוסף מנה חדשה
          </Button>
        </div>
      )}
    </>
  );
};
