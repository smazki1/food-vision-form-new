
import React from "react";
import ImagesTab from "@/components/editor/submission/images";
import { Submission } from "@/api/submissionApi";

interface ImagesTabContentProps {
  submission: Submission;
  handleSelectMainImage: (imageUrl: string) => Promise<boolean>;
  handleRemoveProcessedImage: (imageUrl: string) => Promise<boolean>;
  addProcessedImage: (url: string) => Promise<boolean>;
  setLightboxImage: (imageUrl: string | null) => void;
}

const ImagesTabContent: React.FC<ImagesTabContentProps> = ({
  submission,
  handleSelectMainImage,
  handleRemoveProcessedImage,
  addProcessedImage,
  setLightboxImage,
}) => {
  return (
    <ImagesTab
      submission={submission}
      handleSelectMainImage={handleSelectMainImage}
      handleRemoveProcessedImage={handleRemoveProcessedImage}
      addProcessedImage={addProcessedImage}
      setLightboxImage={setLightboxImage}
    />
  );
};

export default ImagesTabContent;
