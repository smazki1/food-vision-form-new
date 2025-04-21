
export type ClientData = {
  client: {
    client_id: string;
    restaurant_name: string;
    contact_name: string;
    phone: string;
    email: string;
    created_at: string;
  } | null;
  dishes: Array<{
    dish_id: string;
    name: string;
    ingredients: string;
    description: string;
    notes: string;
    reference_image_urls: string[];
  }>;
  cocktails: Array<{
    cocktail_id: string;
    name: string;
    ingredients: string;
    description: string;
    notes: string;
    reference_image_urls: string[];
  }>;
  drinks: Array<{
    drink_id: string;
    name: string;
    ingredients: string;
    description: string;
    notes: string;
    reference_image_urls: string[];
  }>;
  additionalDetails: {
    visual_style: string;
    brand_colors: string;
    general_notes: string;
    branding_materials_url: string;
  } | null;
};
