import React, { useState } from "react";
import { Lead, LEAD_STATUS_OPTIONS } from "@/types/lead";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Loader2, Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "./StatusBadge";
import { Package, MOCK_PACKAGES } from "@/types/package";
import { useLeads } from "@/hooks/useLeads";
import { checkClientExists, createClientFromLead } from "@/api/clientsApi";

// UI Components
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Form,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RefreshCw } from "lucide-react";

// Zod schema for form validation
const leadFormSchema = z.object({
  restaurant_name: z.string().min(1, { message: "שם מסעדה הוא שדה חובה" }),
  contact_name: z.string().min(1, { message: "שם איש קשר הוא שדה חובה" }),
  phone_number: z.string().min(1, { message: "מספר טלפון הוא שדה חובה" }),
  email: z.string().email({ message: "נא להזין כתובת אימייל תקינה" }),
  lead_status: z.string(),
  lead_source: z.string().nullable(),
  notes: z.string().nullable(),
  reminder_at: z.date().nullable(),
  reminder_details: z.string().nullable(),
  free_sample_package_active: z.boolean()
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface LeadDetailsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onUpdate: (id: string, updates: Partial<Lead>) => Promise<void>;
  onDeleteLeadConfirm: (leadId: string) => Promise<void>;
}

export const LeadDetailsSheet: React.FC<LeadDetailsSheetProps> = ({
  isOpen,
  onOpenChange,
  lead,
  onUpdate,
  onDeleteLeadConfirm
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { updateLeadStatus } = useLeads();

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      restaurant_name: lead?.restaurant_name || "",
      contact_name: lead?.contact_name || "",
      phone_number: lead?.phone_number || "",
      email: lead?.email || "",
      lead_status: lead?.lead_status || "ליד חדש",
      lead_source: lead?.lead_source || null,
      notes: lead?.notes || "",
      reminder_at: lead?.reminder_at ? new Date(lead.reminder_at) : null,
      reminder_details: lead?.reminder_details || "",
      free_sample_package_active: lead?.free_sample_package_active || false
    }
  });

  // Reset form when lead changes
  React.useEffect(() => {
    if (lead) {
      form.reset({
        restaurant_name: lead.restaurant_name,
        contact_name: lead.contact_name,
        phone_number: lead.phone_number,
        email: lead.email,
        lead_status: lead.lead_status,
        lead_source: lead.lead_source,
        notes: lead.notes || "",
        reminder_at: lead.reminder_at ? new Date(lead.reminder_at) : null,
        reminder_details: lead.reminder_details || "",
        free_sample_package_active: lead.free_sample_package_active
      });
    } else {
      setSelectedPackage(null);
    }
  }, [lead, form]);

  const handleSubmit = async (values: LeadFormValues) => {
    if (!lead) return;

    try {
      setIsSubmitting(true);
      
      const updates: Partial<Lead> = {
        restaurant_name: values.restaurant_name,
        contact_name: values.contact_name,
        phone_number: values.phone_number,
        email: values.email,
        lead_status: values.lead_status as any,
        lead_source: values.lead_source as any,
        notes: values.notes,
        reminder_at: values.reminder_details && values.reminder_at ? values.reminder_at.toISOString() : null,
        reminder_details: values.reminder_details ? values.reminder_details : null,
        free_sample_package_active: values.free_sample_package_active
      };

      await onUpdate(lead.id, updates);
      toast.success("הליד עודכן בהצלחה");
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("שגיאה בעדכון הליד");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!lead) return;
    
    try {
      await updateLeadStatus(lead.id, status as any);
      form.setValue("lead_status", status);
      toast.success("סטטוס הליד עודכן בהצלחה");
    } catch (error) {
      console.error("Error updating lead status:", error);
      toast.error("שגיאה בעדכון סטטוס הליד");
    }
  };

  const handleConvertToClient = async () => {
    if (!lead) return;

    try {
      // First check if a client with this email already exists
      const exists = await checkClientExists(lead.email);
      if (exists) {
        toast.error("לקוח עם אותו אימייל כבר קיים במערכת");
        setShowConvertDialog(false);
        setSelectedPackage(null);
        return;
      }

      if (!selectedPackage) {
        toast.error("נא לבחור חבילה ראשונית");
        return;
      }

      // Create new client
      await createClientFromLead(
        lead,
        selectedPackage.package_id,
        selectedPackage.total_servings
      );

      // Update lead status
      await updateLeadStatus(lead.id, "הפך ללקוח");
      
      // Update form and clear reminder if exists
      form.setValue("lead_status", "הפך ללקוח");
      if (form.getValues("reminder_at")) {
        form.setValue("reminder_at", null);
        form.setValue("reminder_details", null);
        
        // Also update in database
        await onUpdate(lead.id, {
          reminder_at: null,
          reminder_details: null
        });
      }

      setShowConvertDialog(false);
      setSelectedPackage(null);
      toast.success("הליד הומר ללקוח בהצלחה");
    } catch (error) {
      console.error("Error converting lead to client:", error);
      toast.error("שגיאה בהמרת הליד ללקוח");
    }
  };

  const openDeleteConfirmationDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteLead = async () => {
    if (!lead) return;
    setIsDeleting(true);
    try {
      await onDeleteLeadConfirm(lead.id);
      toast.success('הליד נמחק בהצלחה');
      setIsDeleteDialogOpen(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('שגיאה במחיקת הליד');
      setIsDeleteDialogOpen(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  const isClientConversionDisabled = 
    !lead || lead.lead_status === "הפך ללקוח";

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => {
          onOpenChange(open);
          if (!open) {
              setSelectedPackage(null);
              setShowConvertDialog(false);
          }
      }}>
        <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl">פרטי ליד</SheetTitle>
            <SheetDescription>
              צפייה ועריכת פרטי הליד
            </SheetDescription>
          </SheetHeader>

          {lead && (
            <div className="space-y-6">
              {/* Status Badge and Created/Updated dates */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">סטטוס:</p>
                  <StatusBadge status={lead.lead_status} />
                </div>
                <div className="text-left">
                  <p className="text-sm text-muted-foreground">
                    נוצר: {formatDate(lead.created_at)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    עודכן: {formatDate(lead.last_updated_at)}
                  </p>
                </div>
              </div>

              {/* Main Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  {/* Basic Details Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>פרטים בסיסיים</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="restaurant_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>שם מסעדה/עסק</FormLabel>
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
                            <FormLabel>שם איש קשר</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="phone_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>מספר טלפון</FormLabel>
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
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Status and Source Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>סטטוס ומקור</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="lead_status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>סטטוס ליד</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleStatusChange(value);
                              }}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="בחר סטטוס" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {LEAD_STATUS_OPTIONS.map((status) => (
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
                        name="lead_source"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>מקור הליד</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value || undefined}
                              value={field.value || undefined}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="בחר מקור" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="אתר">אתר</SelectItem>
                                <SelectItem value="הפניה">הפניה</SelectItem>
                                <SelectItem value="פייסבוק">פייסבוק</SelectItem>
                                <SelectItem value="אינסטגרם">אינסטגרם</SelectItem>
                                <SelectItem value="אחר">אחר</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="free_sample_package_active"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>חבילת טעימה פעילה</FormLabel>
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
                    </CardContent>
                  </Card>

                  {/* Reminder Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>תזכורת מעקב</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="reminder_at"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>תאריך תזכורת</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={`w-full pl-3 text-right font-normal ${
                                      !field.value ? "text-muted-foreground" : ""
                                    }`}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd/MM/yyyy")
                                    ) : (
                                      <span>בחר תאריך</span>
                                    )}
                                    <Calendar className="mr-auto h-4 w-4" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value || undefined}
                                  onSelect={(date) => {
                                    field.onChange(date);
                                    if (!date) {
                                      form.setValue("reminder_details", null);
                                    }
                                  }}
                                  disabled={(date) =>
                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            {field.value && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2 w-fit"
                                onClick={() => {
                                  form.setValue("reminder_at", null);
                                  form.setValue("reminder_details", null);
                                }}
                              >
                                נקה תזכורת
                              </Button>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("reminder_at") && (
                        <FormField
                          control={form.control}
                          name="reminder_details"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>פרטי תזכורת</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="הוסף פרטים לתזכורת"
                                  className="resize-none"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </CardContent>
                  </Card>

                  {/* Notes Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>הערות וסיכומי שיחה</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="הוסף הערות או סיכומי שיחה כאן..."
                                className="resize-none min-h-[150px]"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <SheetFooter className="mt-8 sticky bottom-0 bg-background py-4 px-6 border-t" data-testid="lead-details-sheet-footer">
                    <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-3">
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={openDeleteConfirmationDialog}
                            className="w-full sm:w-auto"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            מחק ליד
                        </Button>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowConvertDialog(true)}
                                disabled={isClientConversionDisabled}
                                className="w-full sm:w-auto"
                            >
                                המר ללקוח
                            </Button>
                            <SheetClose asChild>
                                <Button type="button" variant="outline" className="w-full sm:w-auto">
                                ביטול
                                </Button>
                            </SheetClose>
                            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                                {isSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                שמור שינויים
                            </Button>
                        </div>
                    </div>
                   </SheetFooter>
                </form>
              </Form>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Convert to Client Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={(open) => {
          setShowConvertDialog(open);
          if (!open) setSelectedPackage(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>המרת ליד ללקוח חדש</DialogTitle>
            <DialogDescription>
              בחר חבילה ראשונית עבור הלקוח החדש
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              {MOCK_PACKAGES.map((pkg) => (
                <Card 
                  key={pkg.package_id}
                  className={`cursor-pointer transition-all ${
                    selectedPackage?.package_id === pkg.package_id ? "border-primary ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between">
                      {pkg.package_name}
                      <Badge variant="outline">{pkg.total_servings} מנות</Badge>
                    </CardTitle>
                    <CardDescription>
                      {pkg.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-0">
                    <p className="text-lg font-semibold">₪{pkg.price}</p>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                  setShowConvertDialog(false);
                  setSelectedPackage(null);
              }}
            >
              ביטול
            </Button>
            <Button 
              onClick={handleConvertToClient}
              disabled={!selectedPackage}
            >
              המר ללקוח
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>אישור מחיקת ליד</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את הליד "{lead?.restaurant_name}"? לא ניתן לשחזר פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLead} disabled={isDeleting}>
              {isDeleting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
              מחק ליד
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
