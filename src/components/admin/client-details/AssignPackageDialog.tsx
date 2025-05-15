
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import * as z from "zod";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { usePackages } from "@/hooks/usePackages";
import { Client } from "@/types/client";
import { Package } from "@/types/package";
import PackagesLoadingState from "@/components/admin/packages/components/PackagesLoadingState";

// Define the form schema with Zod
const assignPackageSchema = z.object({
  packageId: z.string().min(1, { message: "יש לבחור חבילה" }),
  servingsCount: z.coerce.number().int().min(0, { message: "יש להזין מספר מנות תקין" }),
  paymentStatus: z.enum(["paid", "unpaid", "partial"]),
  notes: z.string().optional(),
  expirationDate: z.date().optional(),
});

// Type for form values
type AssignPackageFormValues = z.infer<typeof assignPackageSchema>;

interface AssignPackageDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssignPackage: (values: AssignPackageFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function AssignPackageDialog({
  client,
  open,
  onOpenChange,
  onAssignPackage,
  isSubmitting,
}: AssignPackageDialogProps) {
  const { packages, isLoading } = usePackages();
  const [selectedPackage, setSelectedPackage] = React.useState<Package | null>(null);

  // Initialize form with default values
  const form = useForm<AssignPackageFormValues>({
    resolver: zodResolver(assignPackageSchema),
    defaultValues: {
      packageId: client.current_package_id || "",
      servingsCount: client.remaining_servings || 0,
      paymentStatus: "unpaid",
      notes: "",
    },
  });

  // Update servings count when package selection changes
  React.useEffect(() => {
    const packageId = form.getValues("packageId");
    if (packageId) {
      const selectedPkg = packages.find((pkg) => pkg.package_id === packageId);
      if (selectedPkg) {
        setSelectedPackage(selectedPkg);
        form.setValue("servingsCount", selectedPkg.total_servings);
      }
    }
  }, [packages, form]);

  // Handle form submission
  const onSubmit = async (values: AssignPackageFormValues) => {
    await onAssignPackage(values);
  };

  // Map payment status values to display text
  const paymentStatusOptions = [
    { value: "paid", label: "שולם" },
    { value: "unpaid", label: "טרם שולם" },
    { value: "partial", label: "חלקי" }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>הקצאת חבילה</DialogTitle>
          <DialogDescription>
            ניתן להקצות חבילה חדשה או לשנות את החבילה הקיימת של הלקוח.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Package Selection */}
            <FormField
              control={form.control}
              name="packageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>חבילה</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      const selectedPkg = packages.find((pkg) => pkg.package_id === value);
                      if (selectedPkg) {
                        setSelectedPackage(selectedPkg);
                        form.setValue("servingsCount", selectedPkg.total_servings);
                      }
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר חבילה" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoading ? (
                        <PackagesLoadingState />
                      ) : (
                        packages
                          .filter((pkg) => pkg.is_active)
                          .map((pkg) => (
                            <SelectItem key={pkg.package_id} value={pkg.package_id}>
                              {pkg.package_name} - ₪{pkg.price}
                            </SelectItem>
                          ))
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

            {/* Servings Count Override */}
            <FormField
              control={form.control}
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

            {/* Payment Status */}
            <FormField
              control={form.control}
              name="paymentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>סטטוס תשלום</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            {/* Expiration Date */}
            <FormField
              control={form.control}
              name="expirationDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>תאריך תפוגה (אופציונלי)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-right font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>בחר תאריך</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    ניתן להגדיר תאריך תפוגה לחבילה (אופציונלי)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
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

            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "מקצה..." : "הקצה חבילה"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
