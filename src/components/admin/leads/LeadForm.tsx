import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Lead, LEAD_SOURCE_OPTIONS } from "@/types/lead";

// Define the schema for the form
const leadFormSchema = z.object({
  restaurant_name: z.string().min(1, { message: "שם מסעדה הוא שדה חובה" }),
  contact_name: z.string().min(1, { message: "שם איש קשר הוא שדה חובה" }),
  phone: z.string().min(9, { message: "יש להזין מספר טלפון תקין" }),
  email: z.string().email({ message: "יש להזין כתובת אימייל תקינה" }),
  lead_source: z.string().nullable(),
  notes: z.string().nullable(),
  reminder_at: z.date().nullable(),
  reminder_details: z.string().nullable(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface LeadFormProps {
  lead?: Lead;
  onSubmit: (data: LeadFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const LeadForm: React.FC<LeadFormProps> = ({ 
  lead, 
  onSubmit, 
  onCancel,
  isLoading = false 
}) => {
  // Initialize form with default values or existing lead data
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      restaurant_name: lead?.restaurant_name || "",
      contact_name: lead?.contact_name || "",
      phone: lead?.phone || "",
      email: lead?.email || "",
      lead_source: lead?.lead_source || null,
      notes: lead?.notes || null,
      reminder_at: lead?.reminder_at ? new Date(lead.reminder_at) : null,
      reminder_details: lead?.reminder_details || null,
    },
  });

  // Handle form submission
  const handleSubmit = (values: LeadFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="restaurant_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>שם מסעדה/עסק *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="הזן שם מסעדה או עסק" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>שם איש קשר *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="הזן שם איש קשר" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>מספר טלפון *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="הזן מספר טלפון" type="tel" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>אימייל *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="הזן כתובת אימייל" type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lead_source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>מקור</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר מקור" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LEAD_SOURCE_OPTIONS.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>הערות</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="הוסף הערות"
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reminder_at"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>תזכורת</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "dd/MM/yyyy")
                      ) : (
                        <span>בחר תאריך לתזכורת</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value || undefined}
                    onSelect={field.onChange}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reminder_details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>פרטי תזכורת</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="פרטים נוספים לתזכורת"
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            ביטול
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "שומר..." : lead ? "עדכון" : "יצירה"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default LeadForm;
