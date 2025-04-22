
import { useState } from "react";
import { AdditionalDetails } from "@/types/food-vision";

export const useAdditionalDetails = () => {
  const [additionalDetails, setAdditionalDetails] = useState<AdditionalDetails>({
    visualStyle: "",
    brandColors: "",
    generalNotes: "",
  });

  return { additionalDetails, setAdditionalDetails };
};
