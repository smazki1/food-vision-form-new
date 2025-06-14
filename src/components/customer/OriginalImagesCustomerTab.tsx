
import React from 'react';
import { CustomerSubmission } from '@/types/submission';
import { Card } from '@/components/ui/card';

interface OriginalImagesCustomerTabProps {
  submission: CustomerSubmission;
  onImageClick: (url: string) => void;
}

const OriginalImagesCustomerTab: React.FC<OriginalImagesCustomerTabProps> = ({ submission, onImageClick }) => {
  const images = submission.original_image_urls || [];

  if (images.length === 0) {
    return (
      <Card className="flex items-center justify-center h-64">
        <div className="text-center text-muted-foreground">
          <p>לא הועלו תמונות מקור עבור הגשה זו.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {images.map((url, index) => (
        <div 
          key={index} 
          className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md"
          onClick={() => onImageClick(url)}
        >
          <img 
            src={url} 
            alt={`Original image ${index + 1}`} 
            className="w-full h-full object-cover aspect-square transition-transform duration-300 group-hover:scale-110" 
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-300 flex items-center justify-center">
            <p className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">צפה בתמונה</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OriginalImagesCustomerTab;
