import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export function ServingsUsedField() {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name="servings_used_at_assignment"
      render={({ field }) => (
        <FormItem>
          <FormLabel>מנות שנוצלו (עם הקצאת החבילה)</FormLabel> 
          <FormControl>
            <Input
              type="number"
              {...field}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                field.onChange(isNaN(value) ? 0 : Math.max(0, value));
              }}
              placeholder="לדוגמה: 0"
            />
          </FormControl>
          <FormDescription>
            כמה מנות ייחשבו כנוצלו מיד עם הקצאת חבילה זו.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
} 