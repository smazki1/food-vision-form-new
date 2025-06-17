
import React from 'react';
import { CustomerSubmission } from '@/types/submission';

interface OriginalImagesCustomerTabProps {
  submission: CustomerSubmission;
  onImageClick: (url: string) => void;
}

const OriginalImagesCustomerTab: React.FC<OriginalImagesCustomerTabProps> = ({ submission, onImageClick }) => {
  const images = submission.original_image_urls || [];

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <p>לא הועלו תמונות מקור עבור הגשה זו.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {images.map((url, index) => (
        <div 
          key={index} 
          className="relative group cursor-pointer overflow-hidden rounded-lg shadow-sm border border-gray-200"
          onClick={() => onImageClick(url)}
        >
          <img 
            src={url} 
            alt={`Original image ${index + 1}`} 
            className="w-full aspect-video object-cover transition-transform duration-200 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-white/90 text-gray-900 px-3 py-1 rounded-full text-sm font-medium">
                צפה בתמונה
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OriginalImagesCustomerTab;
