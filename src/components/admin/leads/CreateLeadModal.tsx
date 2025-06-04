import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalCloseButton,
} from "@/components/ui/modal"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateLead } from '@/hooks/useEnhancedLeads';
import { toast } from 'sonner';
import { 
  LeadStatusEnum,
  LeadSourceEnum,
  LEAD_SOURCE_OPTIONS
} from '@/types/lead';

// Status options including the new one
const EXTENDED_STATUS_OPTIONS = [
  'ליד חדש',
  'פנייה ראשונית בוצעה', 
  'בטיפול',
  'מעוניין',
  'לא מעוניין',
  'הפך ללקוח',
  'ארכיון',
  'להתעדכן'
];

// Business type options
const BUSINESS_TYPE_OPTIONS = [
  'מסעדה',
  'בית קפה',
  'מאפייה',
  'קייטרינג',
  'פיצרייה',
  'בר',
  'מזון רחוב',
  'בית חולים',
  'בית ספר',
  'משרד',
  'מלון',
  'אירועים',
  'אחר'
];

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    restaurant_name: '',
    contact_name: '',
    phone: '',
    email: '',
    lead_status: 'ליד חדש',
    lead_source: 'אתר',
    website_url: '',
    address: '',
    business_type: '',
    notes: '',
    free_sample_package_active: false,
  });

  const createLeadMutation = useCreateLead();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: checked,
    }));
  };

  const resetForm = () => {
    setFormData({
      restaurant_name: '',
      contact_name: '',
      phone: '',
      email: '',
      lead_status: 'ליד חדש',
      lead_source: 'אתר',
      website_url: '',
      address: '',
      business_type: '',
      notes: '',
      free_sample_package_active: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const leadData = {
        restaurant_name: formData.restaurant_name,
        contact_name: formData.contact_name,
        phone: formData.phone,
        email: formData.email,
        lead_status: formData.lead_status || 'ליד חדש',
        lead_source: formData.lead_source,
        website_url: formData.website_url || '',
        address: formData.address || '',
        business_type: formData.business_type || '',
        notes: formData.notes || '',
        free_sample_package_active: formData.free_sample_package_active || false,
      };

      await createLeadMutation.mutateAsync(leadData);
      toast.success('הליד נוצר בהצלחה');
      onClose();
      resetForm();
    } catch (error) {
      toast.error('שגיאה ביצירת הליד');
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>
          <h2>ליד חדש</h2>
        </ModalHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="restaurant_name">שם המסעדה</Label>
              <Input
                type="text"
                id="restaurant_name"
                name="restaurant_name"
                value={formData.restaurant_name}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="contact_name">שם איש קשר</Label>
              <Input
                type="text"
                id="contact_name"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="phone">טלפון</Label>
              <Input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="email">אימייל</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="website_url">אתר אינטרנט</Label>
              <Input
                type="url"
                id="website_url"
                name="website_url"
                value={formData.website_url}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="address">כתובת</Label>
              <Input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lead_status">סטטוס ליד</Label>
              <Select
                value={formData.lead_status}
                onValueChange={(value) => handleSelectChange('lead_status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  {EXTENDED_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="lead_source">מקור ליד</Label>
              <Select
                value={formData.lead_source}
                onValueChange={(value) => handleSelectChange('lead_source', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר מקור" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="אתר">אתר</SelectItem>
                  <SelectItem value="הפניה">הפניה</SelectItem>
                  <SelectItem value="פייסבוק">פייסבוק</SelectItem>
                  <SelectItem value="אינסטגרם">אינסטגרם</SelectItem>
                  <SelectItem value="גוגל">גוגל</SelectItem>
                  <SelectItem value="לינקדאין">לינקדאין</SelectItem>
                  <SelectItem value="טלמרקטינג">טלמרקטינג</SelectItem>
                  <SelectItem value="פה לאוזן">פה לאוזן</SelectItem>
                  <SelectItem value="אחר">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="business_type">סוג עסק</Label>
            <Select
              value={formData.business_type}
              onValueChange={(value) => handleSelectChange('business_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר סוג עסק" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPE_OPTIONS.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">הערות</Label>
            <Input
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="free_sample_package_active"
              name="free_sample_package_active"
              checked={formData.free_sample_package_active}
              onCheckedChange={(checked) => handleSwitchChange('free_sample_package_active', checked)}
            />
            <Label htmlFor="free_sample_package_active">חבילת התנסות פעילה</Label>
          </div>

          <ModalFooter>
            <Button type="submit">צור ליד</Button>
          </ModalFooter>
        </form>

        <ModalCloseButton />
      </ModalContent>
    </Modal>
  );
};
