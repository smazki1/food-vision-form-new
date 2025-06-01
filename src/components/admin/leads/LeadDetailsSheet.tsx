
import React, { useState } from "react";
import { Lead } from "@/types/models";
import { LeadStatus } from "@/constants/statusTypes";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";

interface LeadDetailsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onUpdate: (id: string, updates: Partial<Lead>) => Promise<void>;
  onDeleteLeadConfirm: (id: string) => Promise<void>;
}

export const LeadDetailsSheet: React.FC<LeadDetailsSheetProps> = ({
  isOpen,
  onOpenChange,
  lead,
  onUpdate,
  onDeleteLeadConfirm,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Lead>>({});

  React.useEffect(() => {
    if (lead) {
      setFormData({
        restaurant_name: lead.restaurant_name,
        contact_name: lead.contact_name,
        phone: lead.phone,
        email: lead.email,
        lead_status: lead.lead_status,
        lead_source: lead.lead_source,
        notes: lead.notes,
        next_follow_up_date: lead.next_follow_up_date,
        next_follow_up_notes: lead.next_follow_up_notes,
      });
    }
  }, [lead]);

  const handleSave = async () => {
    if (!lead) return;

    try {
      await onUpdate(lead.lead_id, formData);
      setIsEditing(false);
      toast.success("הליד עודכן בהצלחה");
    } catch (error) {
      toast.error("שגיאה בעדכון הליד");
    }
  };

  const handleDelete = async () => {
    if (!lead) return;

    try {
      await onDeleteLeadConfirm(lead.lead_id);
      onOpenChange(false);
      toast.success("הליד נמחק בהצלחה");
    } catch (error) {
      toast.error("שגיאה במחיקת הליד");
    }
  };

  if (!lead) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>פרטי ליד</SheetTitle>
          <SheetDescription>
            עריכה וצפייה בפרטי הליד
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="restaurant_name">שם מסעדה</Label>
              <Input
                id="restaurant_name"
                value={formData.restaurant_name || ''}
                onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="contact_name">איש קשר</Label>
              <Input
                id="contact_name"
                value={formData.contact_name || ''}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="lead_status">סטטוס</Label>
            <Select
              value={formData.lead_status || ''}
              onValueChange={(value) => setFormData({ ...formData, lead_status: value as LeadStatus })}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ליד חדש">ליד חדש</SelectItem>
                <SelectItem value="פנייה ראשונית בוצעה">פנייה ראשונית בוצעה</SelectItem>
                <SelectItem value="מעוניין">מעוניין</SelectItem>
                <SelectItem value="לא מעוניין">לא מעוניין</SelectItem>
                <SelectItem value="הפך ללקוח">הפך ללקוח</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={!isEditing}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            {!isEditing ? (
              <>
                <Button onClick={() => setIsEditing(true)}>
                  עריכה
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  מחיקה
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleSave}>
                  שמירה
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  ביטול
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
