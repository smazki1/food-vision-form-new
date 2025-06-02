
import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Lead, 
  LeadStatusEnum, 
  LeadSourceEnum, 
  LEAD_STATUS_DISPLAY,
  LEAD_SOURCE_DISPLAY,
  mapHebrewToLeadSourceEnum,
  mapLeadSourceToHebrew
} from "@/types/lead";

const leadFormSchema = z.object({
  restaurant_name: z.string().min(1, "שם המסעדה נדרש"),
  contact_name: z.string().min(1, "שם איש הקשר נדרש"),
  phone: z.string().min(1, "מספר טלפון נדרש"),
  email: z.string().email("כתובת אימייל לא תקינה"),
  website_url: z.string().optional(),
  address: z.string().optional(),
  lead_status: z.nativeEnum(LeadStatusEnum),
  lead_source: z.nativeEnum(LeadSourceEnum).optional(),
  notes: z.string().optional(),
  next_follow_up_date: z.string().optional(),
  free_sample_package_active: z.boolean(),
  ai_trainings_count: z.number().min(0),
  ai_training_cost_per_unit: z.number().min(0),
  ai_prompts_count: z.number().min(0),
  ai_prompt_cost_per_unit: z.number().min(0),
  revenue_from_lead_local: z.number().min(0),
  exchange_rate_at_conversion: z.number().min(0),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

interface LeadDetailsSheetProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (leadData: Partial<Lead>) => void;
}

export function LeadDetailsSheet({ lead, isOpen, onClose, onSave }: LeadDetailsSheetProps) {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      restaurant_name: lead?.restaurant_name || "",
      contact_name: lead?.contact_name || "",
      phone: lead?.phone || "",
      email: lead?.email || "",
      website_url: lead?.website_url || "",
      address: lead?.address || "",
      lead_status: lead?.lead_status || LeadStatusEnum.NEW,
      lead_source: lead?.lead_source || undefined,
      notes: lead?.notes || "",
      next_follow_up_date: lead?.next_follow_up_date ? new Date(lead.next_follow_up_date).toISOString().split('T')[0] : "",
      free_sample_package_active: lead?.free_sample_package_active || false,
      ai_trainings_count: lead?.ai_trainings_count || 0,
      ai_training_cost_per_unit: lead?.ai_training_cost_per_unit || 1.5,
      ai_prompts_count: lead?.ai_prompts_count || 0,
      ai_prompt_cost_per_unit: lead?.ai_prompt_cost_per_unit || 0.16,
      revenue_from_lead_local: lead?.revenue_from_lead_local || 0,
      exchange_rate_at_conversion: lead?.exchange_rate_at_conversion || 3.6,
    },
  });

  const onSubmit = (data: LeadFormData) => {
    onSave(data);
    setIsEditing(false);
  };

  if (!lead) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>פרטי ליד</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Form fields would go here */}
                <div className="flex gap-2">
                  <Button type="submit">שמור</Button>
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    ביטול
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">פרטי ליד</h3>
                <p>מסעדה: {lead.restaurant_name}</p>
                <p>איש קשר: {lead.contact_name}</p>
                <p>טלפון: {lead.phone}</p>
                <p>אימייל: {lead.email}</p>
              </div>
              
              <Button onClick={() => setIsEditing(true)}>
                ערוך
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default LeadDetailsSheet;
