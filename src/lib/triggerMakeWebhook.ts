export interface MakeWebhookPayload {
  submissionTimestamp: string;
  isAuthenticated: boolean;
  clientId: string | null;
  restaurantName: string;
  submitterName?: string;
  contactEmail?: string;
  contactPhone?: string;
  itemName: string;
  itemType: string;
  description: string;
  specialNotes?: string;
  uploadedImageUrls: string[];
  category?: string | null;
  ingredients?: string[] | null;
  // Add any other potentially important fields you identify
  sourceForm?: string; // e.g., 'unified-public', 'unified-client', 'legacy-customer'
}

const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/h15kqbjphouh5wvmsnvxopkl7tff8o7u';

export const triggerMakeWebhook = async (payload: MakeWebhookPayload): Promise<void> => {
  console.log('[triggerMakeWebhook] Sending data to Make.com:', payload);
  try {
    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      // The Make.com webhook returns "Accepted" with a 200 OK for successful receipts.
      const responseText = await response.text();
      if (responseText.trim().toLowerCase() === 'accepted') {
        console.log('[triggerMakeWebhook] Successfully sent data to Make.com. Response: Accepted');
      } else {
        console.warn('[triggerMakeWebhook] Sent data to Make.com, but response was not \"Accepted\". Response:', responseText);
      }
    } else {
      const errorBody = await response.text();
      console.error(
        `[triggerMakeWebhook] Error sending data to Make.com. Status: ${response.status}. Body:`,
        errorBody
      );
      // Optionally, you could re-throw or handle this more specifically if needed,
      // but for now, we'll just log it and not let it break the main flow.
    }
  } catch (error) {
    console.error('[triggerMakeWebhook] Network or other error sending data to Make.com:', error);
  }
}; 