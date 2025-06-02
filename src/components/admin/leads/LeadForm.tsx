import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Lead, 
  LeadStatusEnum, 
  LeadSourceEnum,
  LEAD_STATUS_DISPLAY, 
  LEAD_SOURCE_DISPLAY,
  LEAD_SOURCE_OPTIONS 
} from '@/types/lead';

interface LeadFormProps {
  lead?: Lead;
  onSubmit: (data: Partial<Lead>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormData {
  restaurant_name: string;
  contact_name: string;
  phone: string;
  email: string;
  website_url: string;
  address: string;
  lead_status: LeadStatusEnum;
  lead_source: LeadSourceEnum | null;
  notes: string;
  reminder_date: string;
  reminder_details: string;
  free_sample_package_active: boolean;
}

export const LeadForm: React.FC<LeadFormProps> = ({ lead, onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState<FormData>({
    restaurant_name: '',
    contact_name: '',
    phone: '',
    email: '',
    website_url: '',
    address: '',
    lead_status: LeadStatusEnum.NEW,
    lead_source: null,
    notes: '',
    reminder_date: '',
    reminder_details: '',
    free_sample_package_active: false,
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        restaurant_name: lead.restaurant_name || '',
        contact_name: lead.contact_name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        website_url: lead.website_url || '',
        address: lead.address || '',
        lead_status: lead.lead_status,
        lead_source: lead.lead_source || null,
        notes: lead.notes || '',
        reminder_date: lead.reminder_at ? new Date(lead.reminder_at).toISOString().split('T')[0] : '',
        reminder_details: lead.reminder_details || '',
        free_sample_package_active: lead.free_sample_package_active || false,
      });
    }
  }, [lead]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: LeadStatusEnum | LeadSourceEnum | null) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSave: Partial<Lead> = {
      ...formData,
      reminder_at: formData.reminder_date ? new Date(formData.reminder_date).toISOString() : undefined,
      lead_source: formData.lead_source || null,
    };

    onSubmit(dataToSave);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{lead ? 'Edit Lead' : 'Create Lead'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="restaurant_name">Restaurant Name</Label>
            <Input
              type="text"
              id="restaurant_name"
              name="restaurant_name"
              value={formData.restaurant_name}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="contact_name">Contact Name</Label>
            <Input
              type="text"
              id="contact_name"
              name="contact_name"
              value={formData.contact_name}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="website_url">Website URL</Label>
            <Input
              type="text"
              id="website_url"
              name="website_url"
              value={formData.website_url}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="lead_status">Lead Status</Label>
            <Select onValueChange={(value) => handleSelectChange('lead_status', value as LeadStatusEnum)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LEAD_STATUS_DISPLAY).map(([key, value]) => (
                  <SelectItem key={key} value={key as LeadStatusEnum}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="lead_source">Lead Source</Label>
            <Select onValueChange={(value) => handleSelectChange('lead_source', value as LeadSourceEnum)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a source" />
              </SelectTrigger>
              <SelectContent>
                {LEAD_SOURCE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="reminder_date">Reminder Date</Label>
            <Input
              type="date"
              id="reminder_date"
              name="reminder_date"
              value={formData.reminder_date}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="reminder_details">Reminder Details</Label>
            <Textarea
              id="reminder_details"
              name="reminder_details"
              value={formData.reminder_details}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="free_sample_package_active">Free Sample Package Active</Label>
            <Switch
              id="free_sample_package_active"
              name="free_sample_package_active"
              checked={formData.free_sample_package_active}
              onCheckedChange={(checked) => handleSwitchChange('free_sample_package_active', checked)}
            />
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LeadForm;
