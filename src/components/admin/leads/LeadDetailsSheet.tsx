import React, { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client"; // For getPublicUrl
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Edit3, Trash2, UserPlus, DollarSign, TrendingUp, FileText, Activity, MessageSquare, Eye, LinkIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Lead, 
  LeadStatusEnum, 
  LeadSourceEnum, 
  LEAD_STATUS_DISPLAY, 
  LEAD_SOURCE_DISPLAY,
  mapHebrewToLeadStatusEnum,
  mapLeadStatusToHebrew,
  mapHebrewToLeadSourceEnum,
  mapLeadSourceToHebrew
} from "@/types/lead"; // Added all necessary imports
import { formatDate, formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";

// Define the Zod schema for the form
const formSchema = z.object({
  restaurant_name: z.string().min(1, { message: "שם מסעדה הוא שדה חובה" }),
  contact_name: z.string().min(1, { message: "שם איש קשר הוא שדה חובה" }),
  phone: z.string().min(1, { message: "מספר טלפון הוא שדה חובה" }),
  email: z.string().email({ message: "נא להזין כתובת אימייל תקינה" }),
  website_url: z.string().url({ message: "נא להזין URL תקין" }).or(z.literal('')).nullable(),
  address: z.string().nullable(),
  lead_status: z.nativeEnum(LeadStatusEnum), // Use nativeEnum for enums
  lead_source: z.nativeEnum(LeadSourceEnum).nullable(),
  notes: z.string().nullable(),
  next_follow_up_date: z.date().nullable(),
  next_follow_up_notes: z.string().nullable(),
  free_sample_package_active: z.boolean(),
  // AI Cost fields - these might be handled in a separate form/tab
  ai_trainings_count: z.number().int().min(0).optional(),
  ai_training_cost_per_unit: z.number().min(0).optional(),
  ai_prompts_count: z.number().int().min(0).optional(),
  ai_prompt_cost_per_unit: z.number().min(0).optional(),
  revenue_from_lead_local: z.number().min(0).optional(),
  exchange_rate_at_conversion: z.number().min(0).optional(),
});

interface LeadDetailsSheetProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (leadId: string, updates: Partial<Lead>) => Promise<void>;
  onDelete: (leadId: string) => Promise<void>;
  // onConvertToClient: (leadId: string) => Promise<void>; // This logic will use onUpdate
}

const LeadDetailsSheet: React.FC<LeadDetailsSheetProps> = ({
  lead,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  // onConvertToClient,
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (lead) {
      form.reset({
        restaurant_name: lead.restaurant_name || "",
        contact_name: lead.contact_name || "",
        phone: lead.phone || "",
        email: lead.email || "",
        website_url: lead.website_url || "",
        address: lead.address || "",
        lead_status: lead.lead_status || LeadStatusEnum.NEW,
        lead_source: lead.lead_source || null,
        notes: lead.notes || "",
        next_follow_up_date: lead.next_follow_up_date ? new Date(lead.next_follow_up_date) : null,
        next_follow_up_notes: lead.next_follow_up_notes || "",
        free_sample_package_active: lead.free_sample_package_active || false,
        // Initialize AI cost fields if present on lead object
        ai_trainings_count: lead.ai_trainings_count,
        ai_training_cost_per_unit: lead.ai_training_cost_per_unit,
        ai_prompts_count: lead.ai_prompts_count,
        ai_prompt_cost_per_unit: lead.ai_prompt_cost_per_unit,
        revenue_from_lead_local: lead.revenue_from_lead_local,
        exchange_rate_at_conversion: lead.exchange_rate_at_conversion,
      });
    } else {
      form.reset({ // Default for new lead
        restaurant_name: "",
        contact_name: "",
        phone: "",
        email: "",
        website_url: "",
        address: "",
        lead_status: LeadStatusEnum.NEW,
        lead_source: null,
        notes: "",
        next_follow_up_date: null,
        next_follow_up_notes: "",
        free_sample_package_active: false,
        ai_trainings_count: 0,
        ai_training_cost_per_unit: 1.5, // Default or fetch from settings
        ai_prompts_count: 0,
        ai_prompt_cost_per_unit: 0.16, // Default or fetch from settings
        revenue_from_lead_local: 0,
        exchange_rate_at_conversion: 3.7, // Default or fetch from settings
      });
    }
  }, [lead, form, isOpen]); // Added isOpen to reset form when sheet reopens for a new lead

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!lead) return; // Should not happen if form is for an existing lead
    
    const updatedLeadData: Partial<Lead> = {
      // lead_id is not part of form values, it's from the lead object
      restaurant_name: values.restaurant_name,
      contact_name: values.contact_name,
      phone: values.phone,
      email: values.email,
      website_url: values.website_url,
      address: values.address,
      lead_status: values.lead_status, // This is already LeadStatusEnum from form
      lead_source: values.lead_source, // Already LeadSourceEnum from form
      notes: values.notes,
      next_follow_up_date: values.next_follow_up_date ? values.next_follow_up_date.toISOString().split('T')[0] : undefined,
      next_follow_up_notes: values.next_follow_up_notes,
      free_sample_package_active: values.free_sample_package_active,
      // AI cost fields
      ai_trainings_count: values.ai_trainings_count,
      ai_training_cost_per_unit: values.ai_training_cost_per_unit,
      ai_prompts_count: values.ai_prompts_count,
      ai_prompt_cost_per_unit: values.ai_prompt_cost_per_unit,
      revenue_from_lead_local: values.revenue_from_lead_local,
      exchange_rate_at_conversion: values.exchange_rate_at_conversion,
    };

    try {
      await onUpdate(lead.lead_id, updatedLeadData);
      toast.success("הליד עודכן בהצלחה");
      onClose();
    } catch (error) {
      toast.error("שגיאה בעדכון הליד: " + (error as Error).message);
      console.error("Error updating lead:", error);
    }
  };

  const handleConvertToClient = async () => {
    if (!lead) return;
    try {
      // Update status to CONVERTED_TO_CLIENT
      const updates: Partial<Lead> = { lead_status: LeadStatusEnum.CONVERTED_TO_CLIENT };
      // Clear reminder if it exists, as part of conversion
      if (lead.next_follow_up_date) {
        updates.next_follow_up_date = null; // Supabase expects null for empty date
        updates.next_follow_up_notes = null;
      }
      // Potentially create a client record here via another service or RPC call
      // For now, just update the lead status and clear reminder.
      // The onUpdate prop will handle saving these changes to the lead.
      await onUpdate(lead.lead_id, updates);

      // Update form to reflect changes immediately (optional, as sheet will close)
      form.setValue("lead_status", LeadStatusEnum.CONVERTED_TO_CLIENT);
      if (form.getValues("next_follow_up_date")) {
        form.setValue("next_follow_up_date", null);
        form.setValue("next_follow_up_notes", null);
      }
      toast.success("הליד הומר ללקוח בהצלחה!");
      onClose(); // Close sheet
    } catch (error) {
      console.error("Error converting to client:", error);
      toast.error("שגיאה בהמרת ליד ללקוח: " + (error as Error).message);
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (!lead) return;
    try {
      await onDelete(lead.lead_id);
      toast.success('הליד נמחק בהצלחה');
      setIsDeleteDialogOpen(false);
      onClose();
    } catch (error) {
      toast.error("שגיאה במחיקת הליד: " + (error as Error).message);
      console.error("Error deleting lead:", error);
      setIsDeleteDialogOpen(false);
    }
  };

  if (!isOpen) return null;
  // If no lead is provided when isOpen is true (e.g. creating new lead),
  // we need a slightly different setup or ensure `lead` is a new object shell.
  // For now, assuming `lead` is non-null if `isOpen` for edit/view.

  const currentLeadStatusDisplay = lead?.lead_status ? LEAD_STATUS_DISPLAY[lead.lead_status] : 'טוען...';
  const currentLeadSourceDisplay = lead?.lead_source ? LEAD_SOURCE_DISPLAY[lead.lead_source] : 'לא ידוע';

  const renderContent = () => {
    if (!lead) {
        // This case should ideally be for a "Create New Lead" form
        // For now, let's prevent rendering if lead is null but sheet is open for edit/view
        return <p className="text-center py-10">טוען פרטי ליד...</p>;
    }
    // ... (rest of the tab content rendering based on activeTab)
    // For brevity, showing only the form part for "details" tab
    return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
            {/* Restaurant Name */}
            <FormField
              control={form.control}
              name="restaurant_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם מסעדה</FormLabel>
                  <FormControl>
                    <Input placeholder="לדוגמה: פיצה האט" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Name */}
            <FormField
              control={form.control}
              name="contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>איש קשר</FormLabel>
                  <FormControl>
                    <Input placeholder="לדוגמה: ישראל ישראלי" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>טלפון</FormLabel>
                  <FormControl>
                    <Input placeholder="לדוגמה: 050-1234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>אימייל</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="לדוגמה: israel@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Website URL */}
            <FormField
              control={form.control}
              name="website_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>אתר אינטרנט (אופציונלי)</FormLabel>
                  <FormControl>
                    <Input placeholder="לדוגמה: https://example.com" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>כתובת (אופציונלי)</FormLabel>
                  <FormControl>
                    <Input placeholder="לדוגמה: רחוב הראשי 1, תל אביב" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lead Status */}
            <FormField
              control={form.control}
              name="lead_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>סטטוס ליד</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value as LeadStatusEnum)} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר סטטוס" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(LeadStatusEnum).map((status) => (
                        <SelectItem key={status} value={status}>
                          {LEAD_STATUS_DISPLAY[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lead Source */}
            <FormField
              control={form.control}
              name="lead_source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>מקור הליד</FormLabel>
                   <Select 
                    onValueChange={(value) => field.onChange(value === "none" ? null : value as LeadSourceEnum)} 
                    defaultValue={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר מקור" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">ללא</SelectItem>
                      {Object.values(LeadSourceEnum).map((source) => (
                        <SelectItem key={source} value={source}>
                          {LEAD_SOURCE_DISPLAY[source]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Next Follow Up Date */}
            <FormField
              control={form.control}
              name="next_follow_up_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>תאריך תזכורת</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            formatDate(field.value.toISOString())
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
                        onSelect={(date) => {
                          field.onChange(date);
                          if (!date) { // If date is cleared, clear notes
                            form.setValue("next_follow_up_notes", null);
                          }
                        }}
                        disabled={(date) => date < new Date("1900-01-01")} // Allow past dates for notes, but not too far
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {field.value && (
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2 w-fit text-xs"
                      onClick={() => {
                        field.onChange(null); // Clear date
                        form.setValue("next_follow_up_notes", null); // Clear notes
                      }}
                    >
                      נקה תאריך
                    </Button>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Next Follow Up Notes (only show if date is set) */}
            {form.watch("next_follow_up_date") && (
              <FormField
                control={form.control}
                name="next_follow_up_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>פרטי תזכורת</FormLabel>
                    <FormControl>
                      <Textarea placeholder="רשום פרטים לתזכורת..." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* General Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>הערות כלליות</FormLabel>
                  <FormControl>
                    <Textarea placeholder="רשום הערות על הליד..." {...field} value={field.value ?? ""}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Free Sample Package Active */}
            <FormField
              control={form.control}
              name="free_sample_package_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>חבילת דוגמה חינם פעילה?</FormLabel>
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
            
            {/* Placeholder for AI Cost Fields Tab/Section - For brevity, not fully built out here */}
            {/* You would add similar FormField components for:
                ai_trainings_count, ai_training_cost_per_unit, 
                ai_prompts_count, ai_prompt_cost_per_unit,
                revenue_from_lead_local, exchange_rate_at_conversion
            */}

            <SheetFooter className="pt-4">
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  ביטול
                </Button>
              </SheetClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "שומר..." : "שמור שינויים"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
    );
  };


  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {lead ? "עריכת ליד" : "יצירת ליד חדש"}
            {lead && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({lead.restaurant_name})
              </span>
            )}
          </SheetTitle>
          <SheetDescription>
            {lead ? "פרטי הליד. ניתן לערוך את המידע ולשמור שינויים." : "מלא את הפרטים ליצירת ליד חדש."}
            {lead && (
              <div className="text-xs text-muted-foreground mt-2">
                נוצר: {formatDate(lead.created_at)} | עודכן: {formatDate(lead.updated_at)}
              </div>
            )}
          </SheetDescription>
        </SheetHeader>
        
        {/* Tabs for different sections - Conceptual */}
        <div className="my-4">
          <Button variant={activeTab === 'details' ? 'default' : 'outline'} onClick={() => setActiveTab('details')} className="mr-2">פרטים</Button>
          {/* <Button variant={activeTab === 'costs' ? 'default' : 'outline'} onClick={() => setActiveTab('costs')} className="mr-2">עלויות AI</Button> */}
          {/* <Button variant={activeTab === 'activity' ? 'default' : 'outline'} onClick={() => setActiveTab('activity')}>היסטוריית פעילות</Button> */}
        </div>

        {renderContent()}

        {lead && activeTab === 'details' && ( // Show these actions only if a lead exists and on details tab
          <div className="mt-6 border-t pt-6 space-y-3">
            <h3 className="text-lg font-medium">פעולות נוספות</h3>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleConvertToClient}
              disabled={lead.lead_status === LeadStatusEnum.CONVERTED_TO_CLIENT}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              המר ללקוח
            </Button>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full justify-start">
                  <Trash2 className="mr-2 h-4 w-4" />
                  מחק ליד
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
                  <AlertDialogDescription>
                    האם אתה בטוח שברצונך למחוק את הליד "{lead.restaurant_name}"? פעולה זו אינה ניתנת לשחזור.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ביטול</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteConfirm}>
                    מחק
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default LeadDetailsSheet;
