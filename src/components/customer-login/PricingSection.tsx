
import { Shield } from 'lucide-react';

const PricingSection = () => {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center bg-white/90 backdrop-blur-sm border-2 border-[#f3752b] text-[#8b1e3f] px-5 py-3 rounded-full text-sm font-bold mb-6 shadow-xl">
        <Shield className="w-5 h-5 ml-2" />
        מוגבל ל-30 עסקים בלבד
      </div>
      
              <div className="bg-gradient-to-br from-[#f3f4f6] via-white to-[#f3752b]/5 rounded-3xl p-8 mb-6 border-2 border-[#f3f4f6] shadow-xl">
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            <div className="text-6xl sm:text-7xl font-bold text-[#8b1e3f] leading-none mb-2 drop-shadow-lg">
              249
              <span className="text-3xl text-[#f3752b] font-bold">₪</span>
            </div>
            <div className="absolute -top-3 -right-8 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full transform rotate-12 shadow-lg">
              50% הנחה
            </div>
          </div>
          <div className="text-xl text-slate-400 line-through font-medium">499₪</div>
        </div>
      </div>
    </div>
  );
};

export default PricingSection;
