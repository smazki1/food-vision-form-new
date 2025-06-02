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
    lead_status: LeadStatusEnum.NEW,
    lead_source: LeadSourceEnum.WEBSITE,
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
      lead_status: LeadStatusEnum.NEW,
      lead_source: LeadSourceEnum.WEBSITE,
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
        lead_status: formData.lead_status || LeadStatusEnum.NEW,
        lead_source: formData.lead_source as LeadSourceEnum,
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
                onValueChange={(value) => handleSelectChange('lead_status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={LeadStatusEnum.NEW}>{LeadStatusEnum.NEW}</SelectItem>
                  <SelectItem value={LeadStatusEnum.IN_TREATMENT}>{LeadStatusEnum.IN_TREATMENT}</SelectItem>
                  <SelectItem value={LeadStatusEnum.INTERESTED}>{LeadStatusEnum.INTERESTED}</SelectItem>
                  <SelectItem value={LeadStatusEnum.NOT_INTERESTED}>{LeadStatusEnum.NOT_INTERESTED}</SelectItem>
                  <SelectItem value={LeadStatusEnum.CONVERTED_TO_CLIENT}>{LeadStatusEnum.CONVERTED_TO_CLIENT}</SelectItem>
                  <SelectItem value={LeadStatusEnum.ARCHIVED}>{LeadStatusEnum.ARCHIVED}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="lead_source">מקור ליד</Label>
              <Select
                onValueChange={(value) => handleSelectChange('lead_source', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר מקור" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCE_OPTIONS.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="business_type">סוג עסק</Label>
            <Input
              type="text"
              id="business_type"
              name="business_type"
              value={formData.business_type}
              onChange={handleChange}
            />
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
