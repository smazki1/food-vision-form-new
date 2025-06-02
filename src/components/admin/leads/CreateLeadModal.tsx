import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Lead, 
  LeadStatusEnum, 
  LeadSourceEnum, 
  LEAD_STATUS_DISPLAY, 
  LEAD_SOURCE_DISPLAY 
} from '@/types/lead';
import { Spinner } from '@/components/ui/spinner';
import { useCreateLead } from '@/hooks/useEnhancedLeads';

// Schema for lead form validation
const leadFormSchema = z.object({
  restaurant_name: z.string().min(2, 'נדרש שם מסעדה עם לפחות 2 תווים'),
  contact_name: z.string().min(2, 'נדרש שם איש קשר עם לפחות 2 תווים'),
  phone: z.string().min(9, 'נדרש מספר טלפון תקין'),
  email: z.string().email('נדרשת כתובת אימייל תקינה'),
  website_url: z.string().url('נדרשת כתובת אתר תקינה').optional().or(z.literal('')),
  address: z.string().optional(),
  status: z.nativeEnum(LeadStatusEnum, {
    errorMap: () => ({ message: 'נדרש לבחור סטטוס' }),
  }),
  lead_source: z.nativeEnum(LeadSourceEnum, {
    errorMap: () => ({ message: 'נדרש לבחור מקור' }),
  }).optional(),
  notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const createLead = useCreateLead();
  
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      restaurant_name: '',
      contact_name: '',
      phone: '',
      email: '',
      website_url: '',
      address: '',
      status: LeadStatusEnum.NEW,
      notes: '',
    },
  });
  
  const handleSubmit = async (values: LeadFormValues) => {
    createLead.mutate({
      ...values,
      ai_trainings_count: 0,
      ai_prompts_count: 0,
      ai_training_cost_per_unit: 1.5,
      ai_prompt_cost_per_unit: 0.16,
    }, {
      onSuccess: () => {
        form.reset();
        onClose();
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>הוספת ליד חדש</DialogTitle>
          <DialogDescription>
            הוסף את פרטי הליד החדש. שדות המסומנים ב-* הם שדות חובה.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="restaurant_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם מסעדה / עסק *</FormLabel>
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
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>טלפון *</FormLabel>
                    <FormControl>
                      <Input placeholder="מספר טלפון" {...field} />
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
                      <Input placeholder="כתובת אימייל" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="website_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>אתר אינטרנט</FormLabel>
                  <FormControl>
                    <Input placeholder="כתובת אתר (כולל https://)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>כתובת</FormLabel>
                  <FormControl>
                    <Input placeholder="כתובת פיזית" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סטטוס *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר סטטוס" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(LeadStatusEnum)
                          .filter(status => status !== LeadStatusEnum.ARCHIVED && status !== LeadStatusEnum.CONVERTED_TO_CLIENT)
                          .map(status => (
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
              
              <FormField
                control={form.control}
                name="lead_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מקור</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר מקור" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(LeadSourceEnum).map(source => (
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
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>הערות</FormLabel>
                  <FormControl>
                    <Input placeholder="הערות כלליות" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={createLead.isPending}
              >
                ביטול
              </Button>
              <Button 
                type="submit"
                disabled={createLead.isPending}
              >
                {createLead.isPending ? (
                  <>
                    <Spinner size="sm" className="ml-2" />
                    שומר...
                  </>
                ) : 'שמירה'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}; 