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
import { Download } from "lucide-react";

interface LightboxDialogProps {
  imageUrl: string | null;
  onClose: () => void;
  open: boolean;
}

const LightboxDialog: React.FC<LightboxDialogProps> = ({ imageUrl, onClose, open }) => {
  const handleDownload = () => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `food-vision-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-auto">
        <DialogHeader>
          <DialogTitle>תצוגה מקדימה</DialogTitle>
          <DialogDescription>תצוגה מוגדלת של התמונה שנבחרה</DialogDescription>
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
