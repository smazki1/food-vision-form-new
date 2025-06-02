import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { useUpdateLead, useAddLeadActivity } from '@/hooks/useEnhancedLeads';
import { Lead } from '@/types/lead';

interface FollowUpSchedulerProps {
  lead: Lead;
  onClose: () => void;
}

interface FollowUpFormData {
  reminderDate: string;
  reminderDetails: string;
}

export const FollowUpScheduler: React.FC<FollowUpSchedulerProps> = ({ lead, onClose }) => {
  const [reminderDate, setReminderDate] = useState<Date | undefined>(lead.reminder_at ? new Date(lead.reminder_at) : undefined);
  const [reminderDetails, setReminderDetails] = useState(lead.reminder_details || '');
  const updateLeadMutation = useUpdateLead();
  const addActivityMutation = useAddLeadActivity();

  const handleScheduleFollowUp = async (data: FollowUpFormData) => {
    try {
      await updateLeadMutation.mutateAsync({
        leadId: lead.lead_id,
        updates: {
          reminder_at: data.reminderDate,
          reminder_details: data.reminderDetails
        }
      });

      await addActivityMutation.mutateAsync({
        leadId: lead.lead_id,
        description: `נקבעה תזכורת לטיפול: ${data.reminderDetails || 'ללא פרטים נוספים'}`
      });

      toast.success('התזכורת נשמרה בהצלחה');
      onClose();
    } catch (error) {
      toast.error('שגיאה בשמירת התזכורת');
    }
  };

  const handleCancelReminder = async () => {
    try {
      await updateLeadMutation.mutateAsync({
        leadId: lead.lead_id,
        updates: {
          reminder_at: null,
          reminder_details: null
        }
      });

      await addActivityMutation.mutateAsync({
        leadId: lead.lead_id,
        description: 'התזכורת בוטלה'
      });

      toast.success('התזכורת בוטלה בהצלחה');
      onClose();
    } catch (error) {
      toast.error('שגיאה בביטול התזכורת');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">תזכורת מעקב</h2>
      
      <div className="grid gap-2">
        <Label htmlFor="reminderDate">תאריך תזכורת</Label>
        <DatePicker
          id="reminderDate"
          mode="single"
          selected={reminderDate}
          onSelect={(date) => setReminderDate(date)}
          placeholder="בחר תאריך"
          className="w-full"
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="reminderDetails">פרטי תזכורת</Label>
        <Textarea
          id="reminderDetails"
          placeholder="הוסף פרטים על התזכורת..."
          value={reminderDetails}
          onChange={(e) => setReminderDetails(e.target.value)}
        />
      </div>

      <div className="flex justify-end space-x-2 space-x-reverse">
        <Button variant="ghost" onClick={onClose}>
          ביטול
        </Button>
        {lead.reminder_at ? (
          <Button variant="destructive" onClick={handleCancelReminder}>
            בטל תזכורת
          </Button>
        ) : (
          <Button onClick={() => {
            if (reminderDate) {
              handleScheduleFollowUp({
                reminderDate: format(reminderDate, 'yyyy-MM-dd'),
                reminderDetails: reminderDetails
              });
            } else {
              toast.error('יש לבחור תאריך תזכורת');
            }
          }}>
            שמור תזכורת
          </Button>
        )}
      </div>
    </div>
  );
};
