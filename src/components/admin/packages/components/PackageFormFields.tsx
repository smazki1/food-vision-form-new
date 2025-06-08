import React from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { PackageFormValues } from "../hooks/usePackageForm";

export const BasicPackageFields = () => {
  const { control } = useFormContext<PackageFormValues>();

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="package_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>שם החבילה</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>תיאור</FormLabel>
            <FormControl>
              <Textarea {...field} />
            </FormControl>
            <FormDescription>תיאור קצר של החבילה</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export const NumericPackageFields = () => {
  const { control } = useFormContext<PackageFormValues>();

  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={control}
        name="total_servings"
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
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>מחיר (₪)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export const LimitsPackageFields = () => {
  const { control } = useFormContext<PackageFormValues>();

  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={control}
        name="max_edits_per_serving"
        render={({ field }) => (
          <FormItem>
            <FormLabel>מספר עריכות מקסימלי למנה</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="total_images"
        render={({ field }) => (
          <FormItem>
            <FormLabel>מספר תמונות</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                value={field.value === null ? "" : field.value}
                onChange={(e) => field.onChange(e.target.value === "" ? null : parseInt(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export const SpecialNotesField = () => {
  const { control } = useFormContext<PackageFormValues>();

  return (
    <FormField
      control={control}
      name="special_notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>הערות מיוחדות</FormLabel>
          <FormControl>
            <Textarea {...field} />
          </FormControl>
          <FormDescription>הערות מיוחדות לגבי החבילה (אופציונלי)</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const TotalImagesField = () => {
  const { control } = useFormContext<PackageFormValues>();

  return (
    <FormField
      control={control}
      name="max_processing_time_days"
      render={({ field }) => (
        <FormItem>
          <FormLabel>זמן עיבוד מקסימלי (ימים)</FormLabel>
          <FormControl>
            <Input
              type="number"
              {...field}
              value={field.value === null ? "" : field.value}
              onChange={(e) => field.onChange(e.target.value === "" ? null : parseInt(e.target.value))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const StatusField = () => {
  const { control } = useFormContext<PackageFormValues>();

  return (
    <FormField
      control={control}
      name="is_active"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">חבילה פעילה</FormLabel>
            <FormDescription>
              האם החבילה זמינה ללקוחות חדשים
            </FormDescription>
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
};
