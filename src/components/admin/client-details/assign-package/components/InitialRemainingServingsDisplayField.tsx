import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export function InitialRemainingServingsDisplayField() {
  const { control, watch } = useFormContext();
  const initialRemaining = watch("initial_remaining_servings");

  return (
    <FormField
      control={control}
      name="initial_remaining_servings" // RHF connection
      render={({ field }) => (
        <FormItem>
          <FormLabel>מנות שיוקצו (לאחר ניכוי מנות שנוצלו)</FormLabel>
          <FormControl>
            <Input 
              {...field} 
              value={initialRemaining !== undefined && initialRemaining !== null ? String(initialRemaining) : "N/A"} 
              disabled 
              placeholder="יתעדכן אוטומטית"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
} 