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

interface LightboxDialogProps {
  imageUrl: string | null;
  onClose: () => void;
  open: boolean;
}

const LightboxDialog: React.FC<LightboxDialogProps> = ({ imageUrl, onClose, open }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-auto">
        <DialogHeader>
          <DialogTitle>תצוגה מקדימה</DialogTitle>
          <DialogDescription>תצוגה מוגדלת של התמונה שנבחרה</DialogDescription>
        </DialogHeader>
        {imageUrl && (
          <img 
            src={imageUrl} 
            alt="תצוגה מקדימה" 
            className="w-full h-auto object-contain max-h-[70vh]" 
          />
        )}
        <DialogFooter>
          <Button onClick={onClose}>סגור</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LightboxDialog;
