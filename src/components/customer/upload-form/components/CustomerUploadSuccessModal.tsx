import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle, Plus, Home } from 'lucide-react';

interface CustomerUploadSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewSubmission: () => void;
}

const CustomerUploadSuccessModal: React.FC<CustomerUploadSuccessModalProps> = ({
  isOpen,
  onClose,
  onNewSubmission
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <div className="flex flex-col items-center text-center space-y-6 p-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <div className="space-y-2">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              הגשה בוצעה בהצלחה!
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              המנה שלכם נשלחה למערכת ותועבר לעיבוד בקרוב
            </DialogDescription>
          </div>
          
          <div className="space-y-4 pt-6 w-full">
            <button
              onClick={() => {
                console.log('[CustomerUploadSuccessModal] Add another dish button clicked');
                onNewSubmission();
              }}
              className="w-full bg-[#8B1E3F] hover:bg-[#8B1E3F]/90 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center space-x-3 rtl:space-x-reverse"
            >
              <Plus className="w-6 h-6" />
              <span className="text-lg">הוסף מנה נוספת</span>
            </button>
            
            <button
              onClick={() => {
                console.log('[CustomerUploadSuccessModal] Go home button clicked');
                onClose();
              }}
              className="w-full bg-[#F3752B] hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center space-x-3 rtl:space-x-reverse"
            >
              <Home className="w-6 h-6" />
              <span className="text-lg">חזור לדף הבית</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerUploadSuccessModal; 