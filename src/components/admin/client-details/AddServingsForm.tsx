
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";

interface AddServingsFormProps {
  onAddServings: (amount: number) => void;
  isSubmitting: boolean;
}

export function AddServingsForm({ onAddServings, isSubmitting }: AddServingsFormProps) {
  const [amount, setAmount] = useState<number>(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount > 0) {
      onAddServings(amount);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
      <Label htmlFor="servings-amount">מספר מנות להוספה</Label>
      <div className="flex space-x-2">
        <Input
          id="servings-amount"
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="ml-2"
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="ml-2 h-4 w-4" />
          )}
          הוסף מנות
        </Button>
      </div>
    </form>
  );
}
