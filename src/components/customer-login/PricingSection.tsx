
import { Shield } from 'lucide-react';

const PricingSection = () => {
  return (
    <div className="text-center mb-6">
      <div className="inline-flex items-center bg-gradient-to-r from-[#f3752b]/10 to-[#f3752b]/5 border-2 border-[#f3752b] text-[#f3752b] px-5 py-3 rounded-full text-sm font-bold mb-6 shadow-lg">
        <Shield className="w-5 h-5 ml-2" />
        מוגבל ל-30 עסקים בלבד
      </div>
      
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 mb-4 border border-white/60 shadow-lg">
        <div className="flex flex-col items-center justify-center">
          <div className="relative mb-3">
            <div className="text-5xl sm:text-6xl font-bold text-[#8b1e3f] leading-none mb-2">
              249
              <span className="text-2xl text-[#f3752b] font-bold mr-1">₪</span>
            </div>
            <div className="absolute -top-2 -left-6 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1 rounded-full transform -rotate-12 shadow-md">
              50% הנחה
            </div>
          </div>
          <div className="text-lg text-slate-400 line-through font-medium mb-2">499₪</div>
          <div className="text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-full">
            מחיר מיוחד לתקופה מוגבלת
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingSection;
