
import React from "react";
import ProcessedImagesGrid from "./ProcessedImagesGrid";
import ImageUploader from "./ImageUploader";

interface ProcessedImagesSectionProps {
  processedImageUrls: string[];
  mainProcessedImageUrl: string | null;
  onSelectMainImage: (imageUrl: string) => void;
  onRemoveImage: (imageUrl: string) => void;
  onLightboxOpen: (imageUrl: string) => void;
  onImageUploaded: (url: string) => Promise<boolean>;
}

const ProcessedImagesSection: React.FC<ProcessedImagesSectionProps> = ({
  processedImageUrls,
  mainProcessedImageUrl,
  onSelectMainImage,
  onRemoveImage,
  onLightboxOpen,
  onImageUploaded,
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">תמונות מעובדות</h3>
      <ProcessedImagesGrid
        processedImageUrls={processedImageUrls}
        mainProcessedImageUrl={mainProcessedImageUrl}
        onSelectMainImage={onSelectMainImage}
        onRemoveImage={onRemoveImage}
        onLightboxOpen={onLightboxOpen}
      />
      <ImageUploader onImageUploaded={onImageUploaded} />
    </div>
  );
};

export default ProcessedImagesSection;
