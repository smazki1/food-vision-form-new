
import React from "react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useFormContext } from "react-hook-form";

export const NotesField: React.FC = () => {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>הערות מיוחדות</FormLabel>
          <FormControl>
            <Textarea
              placeholder="הערות מיוחדות לגבי הקצאת החבילה"
              className="resize-none"
              {...field}
            />
          </FormControl>
          <FormDescription>
            למשל: "הנחה מיוחדת", "תנאים מיוחדים" וכו'
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
