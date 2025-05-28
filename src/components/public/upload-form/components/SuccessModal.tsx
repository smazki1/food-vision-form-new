
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Plus } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewSubmission: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, onNewSubmission }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center" dir="rtl">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
            תודה! הפרטים נשלחו בהצלחה
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-600">
            הבקשה שלכם התקבלה במערכת ותטופל בהקדם האפשרי
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 mt-6">
          <Button
            onClick={onNewSubmission}
            className="w-full bg-[#8B1E3F] hover:bg-[#721832] text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            העלאה נוספת
          </Button>
          
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg"
          >
            סגור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessModal;
