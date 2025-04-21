
import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { CollapsibleFoodItem } from "@/components/admin/CollapsibleFoodItem";

interface BaseItem {
  id: string;
  name: string;
  ingredients: string;
  description: string;
  notes: string;
  reference_image_urls: string[];
}

interface BaseItemListProps<T extends BaseItem> {
  items: T[];
  itemType: "dish" | "cocktail" | "drink";
  itemTypeHebrew: string;
  onAddClick: () => void;
}

export const BaseItemList = <T extends BaseItem>({
  items,
  itemType,
  itemTypeHebrew,
  onAddClick,
}: BaseItemListProps<T>) => {
  const getTitle = (index: number, name: string) => {
    return `${itemTypeHebrew} ${index + 1}: ${name}`;
  };

  return (
    <>
      {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item, index) => (
            <CollapsibleFoodItem
              key={item.id}
              title={getTitle(index, item.name)}
              name={item.name}
              ingredients={item.ingredients}
              description={item.description}
              notes={item.notes}
              images={item.reference_image_urls}
            />
          ))}
          <Button
            className="w-full bg-[#F3752B] hover:bg-[#F3752B]/90 mt-4"
            onClick={onAddClick}
          >
            <PlusCircle className="h-4 w-4 ml-2" />
            הוסף {itemTypeHebrew} חדש
          </Button>
        </div>
      ) : (
        <div className="text-center py-8 space-y-4">
          <p className="text-muted-foreground">לא נוספו {itemTypeHebrew}ים</p>
          <Button
            className="bg-[#F3752B] hover:bg-[#F3752B]/90"
            onClick={onAddClick}
          >
            <PlusCircle className="h-4 w-4 ml-2" />
            הוסף {itemTypeHebrew} חדש
          </Button>
        </div>
      )}
    </>
  );
};
