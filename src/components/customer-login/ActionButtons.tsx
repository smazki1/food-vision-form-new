import { Button } from '@/components/ui/button';

interface ActionButtonsProps {
  onGetPhotos: () => void;
  onHowItWorks: () => void;
  onLogin: () => void;
}

const ActionButtons = ({ onGetPhotos, onHowItWorks, onLogin }: ActionButtonsProps) => {
  return (
    <>
      {/* CTA Button */}
      <Button 
        onClick={onGetPhotos}
        className="w-full bg-gradient-to-r from-[#f3752b] to-[#ff6b35] hover:from-[#e8621f] hover:to-[#f3752b] text-white py-6 px-4 text-lg font-bold rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] border-0 min-h-[56px] relative overflow-hidden group mb-4"
      >
        <span className="relative z-10">קבלו תמונות מקצועיות לעסק שלכם</span>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
      </Button>

      {/* How It Works Button */}
      <Button
        onClick={onHowItWorks}
        variant="outline"
        className="w-full border-2 border-[#8b1e3f] text-[#8b1e3f] hover:bg-[#8b1e3f] hover:text-white py-4 px-4 text-base font-semibold rounded-2xl transition-all duration-300 min-h-[48px] mb-4"
      >
        איך זה עובד?
      </Button>

      {/* Existing Customers */}
      <div className="flex justify-center">
        <Button
          onClick={onLogin}
          variant="ghost"
          className="px-8 py-4 text-base font-medium text-slate-600 hover:text-[#8b1e3f] hover:bg-white/50 transition-all duration-300 rounded-2xl backdrop-blur-sm border border-transparent hover:border-white/30 min-h-[48px]"
        >
          התחברות ללקוחות קיימים
        </Button>
      </div>
    </>
  );
};

export default ActionButtons;
