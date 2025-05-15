
import React from "react";
import { useFormContext } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PackageFormValues } from "../hooks/usePackageForm";

export const BasicPackageFields = () => {
  const { control } = useFormContext<PackageFormValues>();

  return (
    <>
      <FormField
        control={control}
        name="package_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>שם חבילה</FormLabel>
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
              <Textarea {...field} value={field.value || ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
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
              <Input type="number" {...field} />
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
            <FormLabel>מחיר</FormLabel>
            <FormControl>
              <Input type="number" step="0.01" {...field} />
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
              <Input type="number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="max_processing_time_days"
        render={({ field }) => (
          <FormItem>
            <FormLabel>זמן טיפול מקסימלי (ימים)</FormLabel>
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

export const FeaturesTagsField = () => {
  const { control } = useFormContext<PackageFormValues>();

  return (
    <FormField
      control={control}
      name="features_tags"
      render={({ field }) => (
        <FormItem>
          <FormLabel>תגי תכונות</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormDescription>הפרד תגים באמצעות פסיקים (לדוגמא: "מהירות, איכות גבוהה, עדיפות")</FormDescription>
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
            <FormLabel className="text-base">סטטוס פעיל</FormLabel>
            <FormDescription>
              חבילה פעילה זמינה להצעה ללקוחות חדשים
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
