
import { useState } from "react";
import { ClientDetails } from "@/types/food-vision";

export const useClientDetails = () => {
  const [clientDetails, setClientDetails] = useState<ClientDetails>({
    restaurantName: "",
    contactName: "",
    phoneNumber: "",
    email: "",
  });

  return { clientDetails, setClientDetails };
};
