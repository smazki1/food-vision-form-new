
import React from "react";
import { Separator } from "@/components/ui/separator";
import OriginalImagesSection from "./OriginalImagesSection";
import ProcessedImagesSection from "./ProcessedImagesSection";
import ImageQualityGuide from "./ImageQualityGuide";

interface ImagesTabProps {
  submission: any;
  handleSelectMainImage: (imageUrl: string) => void;
  handleRemoveProcessedImage: (imageUrl: string) => void;
  addProcessedImage: (url: string) => Promise<boolean>;
  setLightboxImage: (imageUrl: string) => void;
}

const ImagesTab: React.FC<ImagesTabProps> = ({ 
  submission,
  handleSelectMainImage,
  handleRemoveProcessedImage,
  addProcessedImage,
  setLightboxImage
}) => {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Original images section */}
        <OriginalImagesSection 
          originalItemId={submission.original_item_id}
          itemType={submission.item_type}
        />
        
        {/* Processed images section */}
        <ProcessedImagesSection
          processedImageUrls={submission.processed_image_urls || []}
          mainProcessedImageUrl={submission.main_processed_image_url}
          onSelectMainImage={handleSelectMainImage}
          onRemoveImage={handleRemoveProcessedImage}
          onLightboxOpen={setLightboxImage}
          onImageUploaded={addProcessedImage}
        />
      </div>

      <Separator />
      
      {/* Image quality indicator */}
      <ImageQualityGuide 
        hasProcessedImages={Boolean(submission.processed_image_urls?.length)}
      />
    </div>
  );
};

export default ImagesTab;
