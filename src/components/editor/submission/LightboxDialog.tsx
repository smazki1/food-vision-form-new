import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";

interface LightboxDialogProps {
  imageUrl: string | null;
  images?: string[];
  currentIndex?: number;
  onClose: () => void;
  onNavigate?: (index: number) => void;
  open: boolean;
}

const LightboxDialog: React.FC<LightboxDialogProps> = ({ 
  imageUrl, 
  images = [], 
  currentIndex = 0, 
  onClose, 
  onNavigate,
  open 
}) => {
  const handleDownload = () => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `food-vision-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrevious = () => {
    if (!onNavigate || images.length <= 1) return;
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    onNavigate(prevIndex);
  };

  const handleNext = () => {
    if (!onNavigate || images.length <= 1) return;
    const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    onNavigate(nextIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  const hasMultipleImages = images.length > 1;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl h-auto"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <DialogHeader>
          <DialogTitle>תצוגה מקדימה</DialogTitle>
          <DialogDescription>
            {hasMultipleImages 
              ? `תמונה ${currentIndex + 1} מתוך ${images.length}` 
              : "תצוגה מוגדלת של התמונה שנבחרה"
            }
          </DialogDescription>
        </DialogHeader>
        {imageUrl && (
          <div className="relative">
            <img 
              src={imageUrl} 
              alt="תצוגה מקדימה" 
              className="w-full h-auto object-contain max-h-[70vh]" 
            />
            
            {/* Download button overlay */}
            <Button
              onClick={handleDownload}
              variant="secondary"
              size="icon"
              className="absolute top-2 left-2 bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm"
              aria-label="הורד תמונה"
            >
              <Download className="h-4 w-4" />
            </Button>

            {/* Navigation arrows - only show if there are multiple images */}
            {hasMultipleImages && onNavigate && (
              <>
                <Button
                  onClick={handlePrevious}
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm"
                  aria-label="תמונה קודמת"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  onClick={handleNext}
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm"
                  aria-label="תמונה הבאה"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        )}
        <DialogFooter>
          <Button onClick={onClose}>סגור</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LightboxDialog;
