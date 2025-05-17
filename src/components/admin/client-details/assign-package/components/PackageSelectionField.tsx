
import React from "react";
import { Package } from "@/types/package";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormContext } from "react-hook-form";
import { usePackageForm } from "../hooks/usePackageForm";

interface PackageSelectionFieldProps {
  selectedPackage: Package | null;
}

export const PackageSelectionField: React.FC<PackageSelectionFieldProps> = ({ selectedPackage }) => {
  const { control } = useFormContext();
  const { packages, isLoading } = usePackageForm({} as any); // We're only using this for packages and isLoading

  return (
    <FormField
      control={control}
      name="packageId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>חבילה</FormLabel>
          <Select
            onValueChange={(value) => {
              field.onChange(value);
              // Package selection logic is handled in the usePackageForm hook
            }}
            defaultValue={field.value}
            value={field.value || undefined} // Ensure we never pass empty string as value
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="בחר חבילה" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {isLoading ? (
                <div className="p-2 text-sm">טוען חבילות...</div>
              ) : packages.length > 0 ? (
                packages.map((pkg) => (
                  <SelectItem key={pkg.package_id} value={pkg.package_id || "default-package"}>
                    {pkg.package_name} - ₪{pkg.price}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground">לא נמצאו חבילות פעילות</div>
              )}
            </SelectContent>
          </Select>
          <FormDescription>
            {selectedPackage
              ? `מחיר: ₪${selectedPackage.price} | מספר מנות סטנדרטי: ${selectedPackage.total_servings}`
              : "בחר חבילה כדי לראות את הפרטים"}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
