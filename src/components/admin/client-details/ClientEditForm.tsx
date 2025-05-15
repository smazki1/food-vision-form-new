
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client, CLIENT_STATUS_OPTIONS } from "@/types/client";
import { Loader2 } from "lucide-react";

const clientFormSchema = z.object({
  restaurant_name: z.string().min(1, "שם המסעדה הוא שדה חובה"),
  contact_name: z.string().min(1, "שם איש הקשר הוא שדה חובה"),
  phone: z.string().min(1, "מספר טלפון הוא שדה חובה"),
  email: z.string().email("כתובת אימייל לא תקינה"),
  client_status: z.enum(["פעיל", "לא פעיל", "בהמתנה"]),
  internal_notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientEditFormProps {
  client: Client;
  onSubmit: (data: Partial<Client>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function ClientEditForm({ client, onSubmit, onCancel, isSubmitting }: ClientEditFormProps) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      restaurant_name: client.restaurant_name,
      contact_name: client.contact_name,
      phone: client.phone,
      email: client.email,
      client_status: client.client_status,
      internal_notes: client.internal_notes || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="restaurant_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>שם מסעדה</FormLabel>
              <FormControl>
                <Input {...field} />
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
              <FormLabel>איש קשר</FormLabel>
              <FormControl>
                <Input {...field} />
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
              <FormLabel>טלפון</FormLabel>
              <FormControl>
                <Input {...field} />
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
              <FormLabel>אימייל</FormLabel>
              <FormControl>
                <Input {...field} type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="client_status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>סטטוס</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סטטוס" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CLIENT_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
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
          name="internal_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>הערות פנימיות</FormLabel>
              <FormControl>
                <Textarea {...field} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} className="ml-2">
            ביטול
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            שמור שינויים
          </Button>
        </div>
      </form>
    </Form>
  );
}
