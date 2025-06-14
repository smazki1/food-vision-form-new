import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check } from 'lucide-react';

interface ExistingBusinessSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExistingBusinessSuccessDialog: React.FC<ExistingBusinessSuccessDialogProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] text-center">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            תודה!
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-600 leading-relaxed">
            המנות נשלחו בהצלחה<br />
            נהיה אתכם בקשר בקרוב
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}; 