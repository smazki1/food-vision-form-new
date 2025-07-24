import { supabase } from '@/integrations/supabase/client';

export interface EmailNotificationPayload {
  restaurantName: string;
  submitterName: string;
  itemName: string;
  itemType: string;
  itemCount?: number;
  email?: string;
  phone?: string;
  isAuthenticated: boolean;
}

export const sendSubmissionEmailNotification = async (payload: EmailNotificationPayload): Promise<boolean> => {
  try {
    console.log('📧 Sending email notification:', payload);
    
    const { data, error } = await supabase.functions.invoke('submission-email-notification', {
      body: payload
    });

    if (error) {
      console.error('❌ Email notification error:', error);
      return false;
    }

    if (data?.success) {
      console.log('✅ Email notification sent successfully:', data);
      return true;
    } else {
      console.error('❌ Email notification failed:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending email notification:', error);
    return false;
  }
};

// Helper function to create notification payload from form data
export const createEmailNotificationPayload = (
  formData: any,
  isAuthenticated: boolean,
  itemCount: number = 1
): EmailNotificationPayload => {
  return {
    restaurantName: formData.restaurantName || 'לא נמסר',
    submitterName: formData.submitterName || formData.contactName || 'לא נמסר',
    itemName: formData.itemName || 'פריט ללא שם',
    itemType: formData.itemType || 'לא נמסר',
    itemCount,
    email: formData.contactEmail || formData.email,
    phone: formData.contactPhone || formData.phone,
    isAuthenticated
  };
}; 