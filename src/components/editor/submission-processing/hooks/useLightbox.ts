import { useState } from "react";

interface LightboxState {
  imageUrl: string | null;
  images: string[];
  currentIndex: number;
}

export function useLightbox() {
  const [lightboxState, setLightboxState] = useState<LightboxState>({
    imageUrl: null,
    images: [],
    currentIndex: 0
  });

  const setLightboxImage = (imageUrl: string | null, images?: string[]) => {
    if (imageUrl === null || imageUrl === undefined) {
      setLightboxState({
        imageUrl: null,
        images: [],
        currentIndex: 0
      });
      return;
    }

    const imageArray = images && images.length > 0 ? images : [imageUrl];
    const currentIndex = imageArray.indexOf(imageUrl);

    setLightboxState({
      imageUrl,
      images: imageArray,
      currentIndex: Math.max(0, currentIndex)
    });
  };

  const navigateToIndex = (index: number) => {
    if (index >= 0 && index < lightboxState.images.length) {
      setLightboxState(prev => ({
        ...prev,
        imageUrl: prev.images[index],
        currentIndex: index
      }));
    }
  };

  return {
    lightboxImage: lightboxState.imageUrl,
    lightboxImages: lightboxState.images,
    currentImageIndex: lightboxState.currentIndex,
    setLightboxImage,
    navigateToIndex
  };
}
