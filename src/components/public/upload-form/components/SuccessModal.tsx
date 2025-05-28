
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CheckCircle, Plus, X } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewSubmission: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, onNewSubmission }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border-0 p-0 animate-fadeIn" 
        dir="rtl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
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
          <h2 className="text-3xl font-bold text-[#333333] mb-4">
            תודה רבה!
          </h2>

          {/* Description */}
          <p className="text-xl text-gray-600 leading-relaxed max-w-md mx-auto">
            הפרטים נשלחו בהצלחה. נחזור אליכם בהקדם עם התמונות המעוצבות.
          </p>

          {/* Action Buttons */}
          <div className="space-y-4 pt-6">
            <button
              onClick={onNewSubmission}
              className="w-full bg-[#F3752B] hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center space-x-3 rtl:space-x-reverse"
            >
              <Plus className="w-6 h-6" />
              <span className="text-lg">העלאת מנה נוספת</span>
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              סגור
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessModal;
