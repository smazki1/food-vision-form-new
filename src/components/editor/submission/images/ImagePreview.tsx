
import React from "react";
import { Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ImagePreviewProps {
  url: string;
  isMainImage: boolean;
  onSelect: (imageUrl: string) => void;
  onRemove: (imageUrl: string) => void;
  onLightboxOpen: (imageUrl: string) => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  url,
  isMainImage,
  onSelect,
  onRemove,
  onLightboxOpen,
}) => {
  return (
    <div className="relative group">
      <img
        src={url}
        alt={`תמונה מעובדת`}
        className={`aspect-square object-cover rounded-md border cursor-pointer
          ${isMainImage ? 'border-2 border-primary' : 'border-gray-200'}`}
        onClick={() => onLightboxOpen(url)}
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(url);
            }}
            className="w-8 h-8 p-0 rounded-full"
            disabled={isMainImage}
            title="הגדר כתמונה ראשית"
          >
            <Star className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(url);
            }}
            className="w-8 h-8 p-0 rounded-full"
            title="הסר תמונה"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {isMainImage && (
        <Badge 
          className="absolute top-2 right-2"
          variant="default"
        >
          ראשית
        </Badge>
      )}
    </div>
  );
};

export default ImagePreview;
