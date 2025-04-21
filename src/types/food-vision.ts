
export type FoodItem = {
  id: string;
  name: string;
  ingredients: string;
  description: string;
  notes: string;
  referenceImages?: File[];
};

export type ClientDetails = {
  restaurantName: string;
  contactName: string;
  phoneNumber: string;
  email: string;
};

export type AdditionalDetails = {
  visualStyle: string;
  brandColors: string;
  generalNotes: string;
  brandingMaterials?: File;
};
