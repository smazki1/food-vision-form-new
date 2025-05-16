
import { ClientDetails, FoodItem, AdditionalDetails } from "@/types/food-vision";

/**
 * Prepares the webhook payload for the Make.com API
 */
export const prepareWebhookPayload = (
  clientDetails: ClientDetails,
  clientId: string,
  dishes: any[],
  dishIds: string[],
  cocktails: any[],
  cocktailIds: string[],
  drinks: any[],
  drinkIds: string[],
  additionalDetails: AdditionalDetails,
  brandingMaterialsUrl: string | null
): any => {
  return {
    restaurant_name: clientDetails.restaurantName,
    contact_name: clientDetails.contactName,
    phone: clientDetails.phoneNumber,
    email: clientDetails.email,
    client_id: clientId,
    dishes: dishes.map((d, i) => ({
      name: d.name,
      ingredients: d.ingredients,
      description: d.description,
      notes: d.notes,
      reference_image_urls: d.reference_image_urls,
      id: dishIds[i] || null
    })),
    cocktails: cocktails.map((c, i) => ({
      name: c.name,
      ingredients: c.ingredients,
      description: c.description,
      notes: c.notes,
      reference_image_urls: c.reference_image_urls,
      id: cocktailIds[i] || null
    })),
    drinks: drinks.map((d, i) => ({
      name: d.name,
      ingredients: d.ingredients,
      description: d.description,
      notes: d.notes,
      reference_image_urls: d.reference_image_urls,
      id: drinkIds[i] || null
    })),
    additional_details: {
      visual_style: additionalDetails.visualStyle,
      brand_colors: additionalDetails.brandColors,
      branding_materials_url: brandingMaterialsUrl,
      general_notes: additionalDetails.generalNotes
    }
  };
}

/**
 * Triggers the Make.com webhook with the provided payload
 */
export const triggerWebhooks = async (payload: any): Promise<boolean> => {
  try {
    // Trigger original webhook
    const response = await fetch('https://hook.eu2.make.com/h15kqbjphouh5wvmsnvxopkl7tff8o7u', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Original webhook error:', response.status, response.statusText);
    }

    try {
      // Trigger new webhook
      const newWebhookResponse = await fetch('https://hook.eu2.make.com/cnsjuuxruo9guhu23d7fh7p655qrnngo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!newWebhookResponse.ok) {
        console.error('New webhook error:', newWebhookResponse.status, newWebhookResponse.statusText);
      } else {
        console.log('New webhook triggered successfully');
      }
    } catch (webhookError) {
      console.error('Error triggering new webhook:', webhookError);
    }

    console.log('Webhook responses processed');
    return true;
  } catch (error) {
    console.error('Error triggering webhooks:', error);
    return false;
  }
}
