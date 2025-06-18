
import React from "react";
import ImagePreview from "./ImagePreview";

interface ProcessedImagesGridProps {
  processedImageUrls: string[];
  mainProcessedImageUrl: string | null;
  onSelectMainImage: (imageUrl: string) => void;
  onRemoveImage: (imageUrl: string) => void;
  onLightboxOpen: (imageUrl: string) => void;
}

const ProcessedImagesGrid: React.FC<ProcessedImagesGridProps> = ({
  processedImageUrls,
  mainProcessedImageUrl,
  onSelectMainImage,
  onRemoveImage,
  onLightboxOpen,
}) => {
  if (!processedImageUrls?.length) {
    return (
      <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
        <p className="text-muted-foreground">אין תמונות מוכנות</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
      {processedImageUrls.map((url, idx) => (
        <ImagePreview
          key={idx}
          url={url}
          isMainImage={url === mainProcessedImageUrl}
          onSelect={onSelectMainImage}
          onRemove={onRemoveImage}
          onLightboxOpen={onLightboxOpen}
        />
      ))}
    </div>
  );
};

export default ProcessedImagesGrid;
