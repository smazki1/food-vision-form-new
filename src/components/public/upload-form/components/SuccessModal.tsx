import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle, CreditCard, X } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewSubmission: () => void;
}

const PAYMENT_URL = "https://app.icount.co.il/m/c2d28/c12db4pa2u68489a290?utm_source=iCount&utm_medium=paypage&utm_campaign=162";

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, onNewSubmission }) => {
  // Log when the modal state changes
  useEffect(() => {
    console.log('[SuccessModal] isOpen changed:', isOpen);
  }, [isOpen]);

  // Additional check if the modal should be forced open
  useEffect(() => {
    if (isOpen) {
      console.log('[SuccessModal] Modal should be open');
    }
  }, [isOpen]);

  // Auto-redirect to payment after showing thank you message briefly
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        window.location.href = PAYMENT_URL;
      }, 4000); // 4 second delay to show thank you message

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handlePaymentRedirect = () => {
    console.log('[SuccessModal] Redirecting to payment');
    window.location.href = PAYMENT_URL;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log('[SuccessModal] Dialog onOpenChange:', open);
      if (!open) onClose();
    }}>
      <DialogContent 
        className="sm:max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border-0 p-0 animate-fadeIn" 
        dir="rtl"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            console.log('[SuccessModal] Close button clicked');
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
              תודה רבה!
            </h2>
          </DialogTitle>

          {/* Description */}
          <DialogDescription asChild>
            <p className="text-xl text-gray-600 leading-relaxed max-w-md mx-auto">
              הפרטים נשלחו בהצלחה.<br />
              נעביר אותך לדף התשלום כדי להתחיל בתהליך.
            </p>
          </DialogDescription>

          {/* Action Buttons */}
          <div className="space-y-4 pt-6">
            <button
              onClick={handlePaymentRedirect}
              className="w-full bg-[#F3752B] hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center space-x-3 rtl:space-x-reverse"
            >
              <CreditCard className="w-6 h-6" />
              <span className="text-lg">המשך לתשלום</span>
            </button>
            
            <button
              onClick={() => {
                console.log('[SuccessModal] Close button in footer clicked');
                onClose();
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              סגור
            </button>
            
            <p className="text-sm text-gray-500 mt-2">
              מועבר אוטומטית תוך 4 שניות...
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessModal;
