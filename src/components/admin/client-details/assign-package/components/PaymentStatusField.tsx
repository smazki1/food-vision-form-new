
import React from "react";
import {
  FormControl,
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
import { paymentStatusOptions } from "../schema";

export const PaymentStatusField: React.FC = () => {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name="paymentStatus"
      render={({ field }) => (
        <FormItem>
          <FormLabel>סטטוס תשלום</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="בחר סטטוס תשלום" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {paymentStatusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
