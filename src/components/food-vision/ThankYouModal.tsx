import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ThankYouModalProps {
  open: boolean;
  onClose: () => void;
  isLeadSubmission?: boolean;
}

const PAYMENT_URL = "https://app.icount.co.il/m/c2d28/c12db4pa2u68489a290?utm_source=iCount&utm_medium=paypage&utm_campaign=162";

const ThankYouModal: React.FC<ThankYouModalProps> = ({ open, onClose, isLeadSubmission = false }) => {
  // Auto-redirect leads to payment after showing thank you message briefly
  useEffect(() => {
    if (open && isLeadSubmission) {
      const timer = setTimeout(() => {
        window.location.href = PAYMENT_URL;
      }, 3000); // 3 second delay to show thank you message

      return () => clearTimeout(timer);
    }
  }, [open, isLeadSubmission]);

  const handleButtonClick = () => {
    if (isLeadSubmission) {
      // Immediate redirect for leads when button is clicked
      window.location.href = PAYMENT_URL;
    } else {
      // Regular behavior for existing clients
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="text-center">
        <DialogHeader className="text-center">
          <DialogTitle asChild>
          <h2 className="text-2xl font-bold text-[#F97316] mb-2">תודה רבה!</h2>
          </DialogTitle>
          <DialogDescription asChild>
          <p className="text-lg text-gray-800 font-medium">
            הפרטים נקלטו בהצלחה.<br />
            {isLeadSubmission ? (
              <>נעביר אותך לדף התשלום כדי להתחיל בתהליך.</>
            ) : (
              <>נציגנו יצרו איתך קשר במהלך 24 השעות הקרובות.</>
            )}
          </p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-2 p-2 mt-4">
          <span role="img" aria-label="success" className="text-4xl mb-2">🎉</span>
          <button
            className="mt-4 px-6 py-2 rounded bg-[#8B1E3F] text-white font-semibold hover:bg-[#a72958] transition"
            onClick={handleButtonClick}
          >
            {isLeadSubmission ? "המשך לתשלום" : "חזרה לטופס"}
          </button>
          {isLeadSubmission && (
            <p className="text-sm text-gray-500 mt-2">
              מועבר אוטומטית תוך 3 שניות...
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThankYouModal;
