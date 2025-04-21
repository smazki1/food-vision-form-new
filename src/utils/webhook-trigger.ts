
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ClientDetails, FoodItem, AdditionalDetails } from "@/types/food-vision";

interface FormData {
  clientDetails: ClientDetails;
  dishes: FoodItem[];
  cocktails: FoodItem[];
  drinks: FoodItem[];
  additionalDetails: AdditionalDetails;
}

const uploadFileToStorage = async (file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from('food-vision-images')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('food-vision-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}

export const triggerMakeWebhook = async (formData: FormData) => {
  try {
    // First, save client details to get client_id
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert({
        restaurant_name: formData.clientDetails.restaurantName,
        contact_name: formData.clientDetails.contactName,
        phone: formData.clientDetails.phoneNumber,
        email: formData.clientDetails.email
      })
      .select()
      .single();

    if (clientError) throw clientError;

    const client_id = clientData.client_id;

    // Upload and save dishes with multiple images
    const dishPromises = formData.dishes.map(async (dish) => {
      const imageUrls = [];
      if (dish.referenceImages) {
        for (const image of dish.referenceImages) {
          const imageUrl = await uploadFileToStorage(image);
          if (imageUrl) imageUrls.push(imageUrl);
        }
      }
      return {
        client_id,
        name: dish.name,
        ingredients: dish.ingredients,
        description: dish.description,
        notes: dish.notes,
        reference_image_urls: imageUrls
      };
    });
    const dishes = await Promise.all(dishPromises);
    if (dishes.length > 0) {
      await supabase.from('dishes').insert(dishes);
    }

    // Upload and save cocktails with multiple images
    const cocktailPromises = formData.cocktails.map(async (cocktail) => {
      const imageUrls = [];
      if (cocktail.referenceImages) {
        for (const image of cocktail.referenceImages) {
          const imageUrl = await uploadFileToStorage(image);
          if (imageUrl) imageUrls.push(imageUrl);
        }
      }
      return {
        client_id,
        name: cocktail.name,
        ingredients: cocktail.ingredients,
        description: cocktail.description,
        notes: cocktail.notes,
        reference_image_urls: imageUrls
      };
    });
    const cocktails = await Promise.all(cocktailPromises);
    if (cocktails.length > 0) {
      await supabase.from('cocktails').insert(cocktails);
    }

    // Upload and save drinks with multiple images
    const drinkPromises = formData.drinks.map(async (drink) => {
      const imageUrls = [];
      if (drink.referenceImages) {
        for (const image of drink.referenceImages) {
          const imageUrl = await uploadFileToStorage(image);
          if (imageUrl) imageUrls.push(imageUrl);
        }
      }
      return {
        client_id,
        name: drink.name,
        ingredients: drink.ingredients,
        description: drink.description,
        notes: drink.notes,
        reference_image_urls: imageUrls
      };
    });
    const drinks = await Promise.all(drinkPromises);
    if (drinks.length > 0) {
      await supabase.from('drinks').insert(drinks);
    }

    // Upload branding materials and save additional details
    const brandingMaterialsUrl = formData.additionalDetails.brandingMaterials 
      ? await uploadFileToStorage(formData.additionalDetails.brandingMaterials) 
      : null;

    await supabase.from('additional_details').insert({
      client_id,
      visual_style: formData.additionalDetails.visualStyle,
      brand_colors: formData.additionalDetails.brandColors,
      branding_materials_url: brandingMaterialsUrl,
      general_notes: formData.additionalDetails.generalNotes
    });

    // Format data for Make.com webhook
    const webhookPayload = {
      restaurant_name: formData.clientDetails.restaurantName,
      contact_name: formData.clientDetails.contactName,
      phone: formData.clientDetails.phoneNumber,
      email: formData.clientDetails.email,
      dishes: dishes.map(d => ({
        name: d.name,
        ingredients: d.ingredients,
        description: d.description,
        notes: d.notes,
        reference_image_urls: d.reference_image_urls
      })),
      cocktails: cocktails.map(c => ({
        name: c.name,
        ingredients: c.ingredients,
        description: c.description,
        notes: c.notes,
        reference_image_urls: c.reference_image_urls
      })),
      drinks: drinks.map(d => ({
        name: d.name,
        ingredients: d.ingredients,
        description: d.description,
        notes: d.notes,
        reference_image_urls: d.reference_image_urls
      })),
      additional_details: {
        visual_style: formData.additionalDetails.visualStyle,
        brand_colors: formData.additionalDetails.brandColors,
        branding_materials_url: brandingMaterialsUrl,
        general_notes: formData.additionalDetails.generalNotes
      }
    };

    const response = await fetch('https://hook.eu2.make.com/h15kqbjphouh5wvmsnvxopkl7tff8o7u', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
    }

    toast.success('Form submitted successfully');
    console.log('Webhook response:', await response.text());
    return true;
  } catch (error) {
    console.error('Error processing form submission:', error);
    toast.error('Error submitting form. Please try again.');
    throw error;
  }
};
