import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ThankYouModalProps {
  open: boolean;
  onClose: () => void;
}

const ThankYouModal: React.FC<ThankYouModalProps> = ({ open, onClose }) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="text-center">
      <DialogHeader className="text-center">
        <DialogTitle asChild>
        <h2 className="text-2xl font-bold text-[#F97316] mb-2">תודה רבה!</h2>
        </DialogTitle>
        <DialogDescription asChild>
        <p className="text-lg text-gray-800 font-medium">
          הפרטים נקלטו בהצלחה.<br />
          נציגנו יצרו איתך קשר במהלך 24 השעות הקרובות.
        </p>
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col items-center space-y-2 p-2 mt-4">
        <span role="img" aria-label="success" className="text-4xl mb-2">🎉</span>
        <button
          className="mt-4 px-6 py-2 rounded bg-[#8B1E3F] text-white font-semibold hover:bg-[#a72958] transition"
          onClick={onClose}
        >
          חזרה לטופס
        </button>
      </div>
    </DialogContent>
  </Dialog>
);

export default ThankYouModal;
