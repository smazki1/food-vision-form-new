import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserPlus } from "lucide-react";
import { useCreateClient } from "@/hooks/useCreateClient";
import { CLIENT_STATUS_OPTIONS } from "@/types/client";

const createClientSchema = z.object({
  restaurant_name: z.string().min(1, "שם המסעדה הוא שדה חובה"),
  contact_name: z.string().min(1, "שם איש הקשר הוא שדה חובה"),
  phone: z.string().min(9, "מספר טלפון חייב להכיל לפחות 9 ספרות"),
  email: z.string().email("כתובת אימייל לא תקינה"),
  client_status: z.string().default("פעיל"),
  business_type: z.string().optional(),
  address: z.string().optional(),
  website_url: z.string().url("כתובת אתר לא תקינה").optional().or(z.literal("")),
  internal_notes: z.string().optional(),
  email_notifications: z.boolean().default(true),
  app_notifications: z.boolean().default(true),
});

type CreateClientFormValues = z.infer<typeof createClientSchema>;

interface NewClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BUSINESS_TYPES = [
  "מסעדה",
  "בית קפה",
  "בר",
  "פאב",
  "מקום אירועים",
  "קייטרינג",
  "מאפייה",
  "חנות מזון",
  "אחר",
];

export function NewClientDialog({ open, onOpenChange }: NewClientDialogProps) {
  const createClientMutation = useCreateClient();

  const form = useForm<CreateClientFormValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      restaurant_name: "",
      contact_name: "",
      phone: "",
      email: "",
      client_status: "פעיל",
      business_type: "",
      address: "",
      website_url: "",
      internal_notes: "",
      email_notifications: true,
      app_notifications: true,
    },
  });

  const onSubmit = async (values: CreateClientFormValues) => {
    try {
      // Convert form values to the expected format
      const clientData = {
        restaurant_name: values.restaurant_name,
        contact_name: values.contact_name,
        phone: values.phone,
        email: values.email,
        client_status: values.client_status,
        business_type: values.business_type,
        address: values.address,
        website_url: values.website_url,
        internal_notes: values.internal_notes,
        email_notifications: values.email_notifications,
        app_notifications: values.app_notifications,
      };
      
      await createClientMutation.mutateAsync(clientData);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  const isSubmitting = createClientMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            הוספת לקוח חדש
          </DialogTitle>
          <DialogDescription>
            מלא את הפרטים ליצירת לקוח חדש במערכת. שדות עם כוכבית (*) הם חובה.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="restaurant_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם המסעדה/עסק *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="שם העסק" />
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
                    <FormLabel>איש קשר *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="שם איש הקשר" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>טלפון *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="05X-XXXXXXX" />
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
                      <Input {...field} type="email" placeholder="email@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="business_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סוג עסק</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר סוג עסק" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BUSINESS_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
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
                        {CLIENT_STATUS_OPTIONS.filter(status => status !== "ארכיון").map((status) => (
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
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>כתובת</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="כתובת העסק" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>אתר אינטרנט</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://website.com" />
                  </FormControl>
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
                    <Textarea {...field} placeholder="הערות פנימיות על הלקוח..." rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormField
                control={form.control}
                name="email_notifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">קבלת התראות באימייל</FormLabel>
                      <FormDescription>
                        האם הלקוח מעוניין לקבל עדכונים והתראות למייל?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="app_notifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">קבלת התראות באפליקציה</FormLabel>
                      <FormDescription>
                        האם הלקוח מעוניין לקבל עדכונים והתראות במערכת?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel} 
                disabled={isSubmitting}
              >
                ביטול
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                צור לקוח
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 