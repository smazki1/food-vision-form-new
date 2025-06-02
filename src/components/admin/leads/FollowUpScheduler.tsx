import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, Plus, Save } from 'lucide-react';
import { useUpdateLead, useAddLeadActivity } from '@/hooks/useEnhancedLeads';
import { Lead } from '@/types/lead';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface FollowUpSchedulerProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

const FOLLOW_UP_PRESETS = [
  { label: 'מחר', days: 1 },
  { label: 'בעוד 3 ימים', days: 3 },
  { label: 'בעוד שבוע', days: 7 },
  { label: 'בעוד שבועיים', days: 14 },
  { label: 'בעוד חודש', days: 30 },
];

const FOLLOW_UP_TEMPLATES = [
  { label: 'בדיקת עניין', text: 'בדיקת עניין נוספת בשירותים שלנו' },
  { label: 'שליחת הצעת מחיר', text: 'זמן לשלוח הצעת מחיר מפורטת' },
  { label: 'מעקב אחרי דמו', text: 'מעקב אחרי הדגמה - בדיקת משוב והתקדמות' },
  { label: 'חידוש קשר', text: 'חידוש קשר עם הליד לאחר תקופה ללא מגע' },
  { label: 'אישור הזמנה', text: 'בדיקה אם הליד מוכן לעבור להזמנה' },
];

export const FollowUpScheduler: React.FC<FollowUpSchedulerProps> = ({
  lead,
  isOpen,
  onClose,
}) => {
  const [followUpDate, setFollowUpDate] = useState(
    lead.next_follow_up_date?.split('T')[0] || ''
  );
  const [followUpNotes, setFollowUpNotes] = useState(
    lead.next_follow_up_notes || ''
  );

  const queryClient = useQueryClient();
  const updateLead = useUpdateLead();
  const addActivity = useAddLeadActivity();

  const handlePresetSelect = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setFollowUpDate(date.toISOString().split('T')[0]);
  };

  const handleTemplateSelect = (template: string) => {
    setFollowUpNotes(template);
  };

  const handleSave = async () => {
    if (!followUpDate) {
      toast.error('אנא בחר תאריך למעקב');
      return;
    }

    try {
      // Update lead with follow-up details
      await updateLead.mutateAsync({
        lead_id: lead.lead_id,
        next_follow_up_date: followUpDate,
        next_follow_up_notes: followUpNotes,
      });

      // Log activity
      await addActivity.mutateAsync({
        lead_id: lead.lead_id,
        activity_description: `נקבע מעקב ל-${followUpDate}${followUpNotes ? ': ' + followUpNotes : ''}`,
      });

      toast.success('מעקב נקבע בהצלחה!');
      queryClient.invalidateQueries({ queryKey: ['lead', lead.lead_id] });
      onClose();
    } catch (error) {
      toast.error('שגיאה בקביעת מעקב');
      console.error('Error scheduling follow-up:', error);
    }
  };

  const handleClearFollowUp = async () => {
    try {
      await updateLead.mutateAsync({
        lead_id: lead.lead_id,
        next_follow_up_date: null,
        next_follow_up_notes: null,
      });

      await addActivity.mutateAsync({
        lead_id: lead.lead_id,
        activity_description: 'מעקב בוטל',
      });

      toast.success('מעקב בוטל בהצלחה');
      queryClient.invalidateQueries({ queryKey: ['lead', lead.lead_id] });
      onClose();
    } catch (error) {
      toast.error('שגיאה בביטול מעקב');
      console.error('Error clearing follow-up:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            תזמון מעקב
          </DialogTitle>
          <DialogDescription>
            קבע תאריך למעקב עם {lead.restaurant_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Presets */}
          <div className="space-y-3">
            <Label>קביעה מהירה</Label>
            <div className="flex flex-wrap gap-2">
              {FOLLOW_UP_PRESETS.map((preset) => (
                <Button
                  key={preset.days}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetSelect(preset.days)}
                  className="text-xs"
                >
                  <Clock className="h-3 w-3 ml-1" />
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Manual Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="followUpDate">תאריך מעקב</Label>
            <Input
              id="followUpDate"
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Templates */}
          <div className="space-y-3">
            <Label>תבניות נוספות</Label>
            <Select onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="בחר תבנית..." />
              </SelectTrigger>
              <SelectContent>
                {FOLLOW_UP_TEMPLATES.map((template, index) => (
                  <SelectItem key={index} value={template.text}>
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="followUpNotes">הערות למעקב</Label>
            <Textarea
              id="followUpNotes"
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              placeholder="מה צריך לעשות במעקב הזה?"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <div>
              {lead.next_follow_up_date && (
                <Button
                  variant="outline"
                  onClick={handleClearFollowUp}
                  disabled={updateLead.isPending}
                >
                  בטל מעקב
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                ביטול
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateLead.isPending || !followUpDate}
              >
                <Save className="h-4 w-4 ml-1" />
                שמור
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 