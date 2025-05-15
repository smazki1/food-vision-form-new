
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

export const triggerMakeWebhook = async (formData: FormData): Promise<boolean> => {
  try {
    // First, check if client already exists by email to prevent duplicates
    const { data: existingClients } = await supabase
      .from('clients')
      .select('client_id, remaining_servings')
      .eq('email', formData.clientDetails.email)
      .limit(1);
      
    let client_id: string;
    
    // If client doesn't exist, create a new one
    if (!existingClients || existingClients.length === 0) {
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
      client_id = clientData.client_id;
    } else {
      // Use existing client ID
      client_id = existingClients[0].client_id;
      console.log("Using existing client:", client_id);
      
      // If client has no remaining servings, we might want to prevent submission in a production app
      if (existingClients[0].remaining_servings <= 0) {
        console.warn("Client has no remaining servings:", client_id);
        // Note: In a production app, you'd implement further logic here
      }
    }

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
    let dishIds: string[] = [];
    if (dishes.length > 0) {
      const { data: insertedDishes, error } = await supabase.from('dishes').insert(dishes).select('dish_id');
      if (error) throw error;
      dishIds = insertedDishes.map(dish => dish.dish_id);
    }

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
    let cocktailIds: string[] = [];
    if (cocktails.length > 0) {
      const { data: insertedCocktails, error } = await supabase.from('cocktails').insert(cocktails).select('cocktail_id');
      if (error) throw error;
      cocktailIds = insertedCocktails.map(cocktail => cocktail.cocktail_id);
    }

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
    let drinkIds: string[] = [];
    if (drinks.length > 0) {
      const { data: insertedDrinks, error } = await supabase.from('drinks').insert(drinks).select('drink_id');
      if (error) throw error;
      drinkIds = insertedDrinks.map(drink => drink.drink_id);
    }

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

    const webhookPayload = {
      restaurant_name: formData.clientDetails.restaurantName,
      contact_name: formData.clientDetails.contactName,
      phone: formData.clientDetails.phoneNumber,
      email: formData.clientDetails.email,
      client_id: client_id,
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
      console.error('Original webhook error:', response.status, response.statusText);
    }

    try {
      const newWebhookResponse = await fetch('https://hook.eu2.make.com/cnsjuuxruo9guhu23d7fh7p655qrnngo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      });

      if (!newWebhookResponse.ok) {
        console.error('New webhook error:', newWebhookResponse.status, newWebhookResponse.statusText);
      } else {
        console.log('New webhook triggered successfully');
      }
    } catch (webhookError) {
      console.error('Error triggering new webhook:', webhookError);
    }

    toast.success('Form submitted successfully');
    console.log('Webhook responses processed');
    return true;
  } catch (error) {
    console.error('Error processing form submission:', error);
    toast.error('Error submitting form. Please try again.');
    throw error;
  }
};
