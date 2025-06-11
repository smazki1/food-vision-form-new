import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle, Plus, X, ArrowLeft } from 'lucide-react';
import { useClientAuth } from '@/hooks/useClientAuth';

interface CustomerSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewSubmission: () => void;
}

const CustomerSuccessModal: React.FC<CustomerSuccessModalProps> = ({ isOpen, onClose, onNewSubmission }) => {
  const { originalLeadId } = useClientAuth();
  
  // Log when the modal state changes
  useEffect(() => {
    console.log('[CustomerSuccessModal] isOpen changed:', isOpen);
  }, [isOpen]);

  // Check if user is a lead (chose "not first time") - they shouldn't see add another dish
  const isLead = !!originalLeadId;
  
  console.log('[CustomerSuccessModal] User is lead:', isLead, 'originalLeadId:', originalLeadId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log('[CustomerSuccessModal] Dialog onOpenChange:', open);
      if (!open) onClose();
    }}>
      <DialogContent 
        className="sm:max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border-0 p-0 animate-fadeIn" 
        dir="rtl"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            console.log('[CustomerSuccessModal] Close button clicked');
            onClose();
          }}
          aria-label="Close success modal"
          className="absolute left-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Content */}
        <div className="p-8 text-center space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center animate-pulse">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </div>
              <div className="absolute -top-2 -right-2 text-4xl animate-bounce">
                🎉
              </div>
            </div>
          </div>

          {/* Title */}
          <DialogTitle asChild>
            <h2 className="text-3xl font-bold text-[#333333] mb-4">
              הגשה נשלחה בהצלחה!
            </h2>
          </DialogTitle>

          {/* Description */}
          <DialogDescription asChild>
            <p className="text-xl text-gray-600 leading-relaxed max-w-md mx-auto">
              תודה רבה! הפרטים נשלחו בהצלחה. <br />
              נעבד את התמונות שלכם ונחזור אליכם בקרוב.
            </p>
          </DialogDescription>

          {/* Action Buttons */}
          <div className="space-y-4 pt-6">
            {/* Show "Add Another Dish" only if user is NOT a lead */}
            {!isLead && (
              <button
                onClick={() => {
                  console.log('[CustomerSuccessModal] Add another dish button clicked');
                  onNewSubmission();
                }}
                className="w-full bg-[#8B1E3F] hover:bg-[#8B1E3F]/90 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center space-x-3 rtl:space-x-reverse"
              >
                <Plus className="w-6 h-6" />
                <span className="text-lg">העלאת מנה נוספת</span>
              </button>
            )}
            
            <button
              onClick={() => {
                console.log('[CustomerSuccessModal] Go to dashboard button clicked');
                onClose();
              }}
              className="w-full bg-[#F3752B] hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center space-x-3 rtl:space-x-reverse"
            >
              <ArrowLeft className="w-6 h-6" />
              <span className="text-lg">חזרה לדף הבית</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerSuccessModal; 