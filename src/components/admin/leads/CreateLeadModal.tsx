import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { 
  LeadStatusEnum, 
  LeadSourceEnum,
  LEAD_STATUS_DISPLAY,
  LEAD_SOURCE_DISPLAY 
} from '@/types/lead';
import { useCreateLead } from '@/hooks/useEnhancedLeads';
import { toast } from 'sonner';

const createLeadSchema = z.object({
  restaurant_name: z.string().min(1, 'שם מסעדה נדרש'),
  contact_name: z.string().min(1, 'שם איש קשר נדרש'),
  phone: z.string().min(1, 'מספר טלפון נדרש'),
  email: z.string().email('כתובת אימייל לא תקינה'),
  website_url: z.string().url('כתובת אתר לא תקינה').optional().or(z.literal('')),
  address: z.string().optional(),
  business_type: z.string().optional(),
  lead_status: z.nativeEnum(LeadStatusEnum).default(LeadStatusEnum.NEW),
  lead_source: z.nativeEnum(LeadSourceEnum).optional(),
  notes: z.string().optional(),
  free_sample_package_active: z.boolean().default(false),
});

type CreateLeadFormData = z.infer<typeof createLeadSchema>;

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const createLead = useCreateLead();

  const form = useForm<CreateLeadFormData>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      restaurant_name: '',
      contact_name: '',
      phone: '',
      email: '',
      website_url: '',
      address: '',
      business_type: '',
      lead_status: LeadStatusEnum.NEW,
      lead_source: undefined,
      notes: '',
      free_sample_package_active: false,
    },
  });

  const onSubmit = (data: CreateLeadFormData) => {
    // Clean up empty strings to undefined for optional fields
    const cleanedData = {
      ...data,
      website_url: data.website_url || undefined,
      address: data.address || undefined,
      business_type: data.business_type || undefined,
      notes: data.notes || undefined,
    };

    createLead.mutate(cleanedData, {
      onSuccess: () => {
        toast.success('ליד חדש נוצר בהצלחה!');
        form.reset();
        onClose();
      },
      onError: (error) => {
        toast.error(`שגיאה ביצירת ליד: ${error.message}`);
      },
    });
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>יצירת ליד חדש</DialogTitle>
          <DialogDescription>
            הזן את פרטי הליד החדש. שדות המסומנים בכוכבית (*) הם שדות חובה.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">פרטים בסיסיים</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="restaurant_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>שם מסעדה *</FormLabel>
                      <FormControl>
                        <Input placeholder="שם המסעדה או העסק" {...field} />
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
                        <Input placeholder="שם איש הקשר" {...field} />
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
                      <FormLabel>טלפון *</FormLabel>
                      <FormControl>
                        <Input placeholder="050-123-4567" {...field} />
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
                        <Input type="email" placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="business_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>סוג עסק</FormLabel>
                      <FormControl>
                        <Input placeholder="מסעדה, בית קפה, מאפייה..." {...field} />
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
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
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
                      <Input placeholder="כתובת המסעדה או העסק" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Lead Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">ניהול ליד</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lead_status"
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
                          {Object.entries(LEAD_STATUS_DISPLAY).map(([key, display]) => (
                            <SelectItem key={key} value={key}>
                              {display}
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
                      <FormLabel>מקור</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="בחר מקור" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(LEAD_SOURCE_DISPLAY).map(([key, display]) => (
                            <SelectItem key={key} value={key}>
                              {display}
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
                name="free_sample_package_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        חבילת דמו פעילה
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        האם ללקוח יש חבילת דמו פעילה כרגע
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">הערות</h3>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>הערות נוספות</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="הערות, דרישות מיוחדות, או מידע נוסף על הליד..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6">
              <Button type="button" variant="outline" onClick={handleClose}>
                ביטול
              </Button>
              <Button type="submit" disabled={createLead.isPending}>
                {createLead.isPending ? 'יוצר ליד...' : 'צור ליד'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}; 