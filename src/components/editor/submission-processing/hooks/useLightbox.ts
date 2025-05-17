
import { useState } from "react";

export function useLightbox() {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  return {
    lightboxImage,
    setLightboxImage
  };
}
