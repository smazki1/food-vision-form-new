
import React from "react";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface FoodItemProps {
  title: string;
  name: string;
  ingredients: string;
  description: string;
  notes: string;
  images?: string[];
}

export const CollapsibleFoodItem: React.FC<FoodItemProps> = ({
  title,
  name,
  ingredients,
  description,
  notes,
  images = [], // Provide default empty array if images is undefined
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const downloadAllImages = () => {
    images.forEach((url, index) => {
      const filename = `${name.replace(/\s+/g, '-')}-${index + 1}.jpg`;
      downloadImage(url, filename);
    });
  };

  return (
    <Card className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary">
              <h3 className="font-medium">{title}</h3>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            {images && images.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadAllImages();
                }}
              >
                <Download className="h-4 w-4 ml-2" />
                הורד תמונות
              </Button>
            )}
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            {ingredients && (
              <div>
                <h4 className="font-semibold mb-1">מרכיבים:</h4>
                <p>{ingredients}</p>
              </div>
            )}
            
            {description && (
              <div>
                <h4 className="font-semibold mb-1">תיאור:</h4>
                <p>{description}</p>
              </div>
            )}
            
            {notes && (
              <div>
                <h4 className="font-semibold mb-1">הערות:</h4>
                <p>{notes}</p>
              </div>
            )}
            
            {images && images.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">תמונות:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {images.map((url, index) => (
                    <div key={index} className="relative rounded-md overflow-hidden border">
                      <AspectRatio ratio={4/3}>
                        <img 
                          src={url} 
                          alt={`${name} ${index + 1}`}
                          className="object-cover w-full h-full" 
                        />
                      </AspectRatio>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
