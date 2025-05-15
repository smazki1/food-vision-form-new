
import React from "react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";

export const ServingsCountField: React.FC = () => {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name="servingsCount"
      render={({ field }) => (
        <FormItem>
          <FormLabel>מספר מנות</FormLabel>
          <FormControl>
            <Input
              type="number"
              {...field}
              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
            />
          </FormControl>
          <FormDescription>
            ניתן להגדיר מספר מנות שונה מהמוגדר בחבילה
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
