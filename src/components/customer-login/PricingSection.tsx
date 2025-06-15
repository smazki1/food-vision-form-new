
import { Shield } from 'lucide-react';

const PricingSection = () => {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center bg-gradient-to-r from-[#f3752b]/10 to-[#f3752b]/5 border-2 border-[#f3752b] text-[#f3752b] px-5 py-3 rounded-full text-sm font-bold mb-6 shadow-lg">
        <Shield className="w-5 h-5 ml-2" />
        מוגבל ל-30 עסקים בלבד
      </div>
      
      <div className="bg-gradient-to-br from-slate-50 via-white to-[#f3752b]/5 rounded-3xl p-8 mb-6 border-2 border-slate-100 shadow-inner">
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            <div className="text-6xl sm:text-7xl font-bold bg-gradient-to-b from-[#8b1e3f] to-[#a91e4f] bg-clip-text text-transparent leading-none mb-2">
              249
              <span className="text-3xl text-[#f3752b] font-bold">₪</span>
            </div>
            <div className="absolute -top-3 -right-8 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full transform rotate-12 shadow-lg">
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
