import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export function TotalServingsDisplayField() {
  const { control, watch } = useFormContext();
  const totalServings = watch("total_servings_from_package");

  return (
    <FormField
      control={control}
      name="total_servings_from_package" // Still need a name for RHF to connect, even if not directly editable
      render={({ field }) => (
        <FormItem>
          <FormLabel>סך כל המנות בחבילה</FormLabel>
          <FormControl>
            <Input 
              {...field} 
              value={totalServings !== undefined && totalServings !== null ? String(totalServings) : "N/A"} 
              disabled 
              placeholder="יתעדכן לאחר בחירת חבילה"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
} 