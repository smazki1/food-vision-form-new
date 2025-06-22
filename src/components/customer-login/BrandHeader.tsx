
import { Award } from 'lucide-react';

const BrandHeader = () => {
  return (
    <div className="text-center mb-8">
      {/* Beta Badge with warm colors - removed animation and fixed text order */}
      <div className="mb-6">
        <span className="inline-flex items-center bg-gradient-to-r from-[#8b1e3f] to-[#a91e4f] text-white text-sm font-bold px-6 py-3 rounded-full shadow-xl tracking-wide border-2 border-white/20">
          Beta
        </span>
      </div>
      
      {/* Brand Logo & Title - simplified for inside card */}
      <div className="mb-8">
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <img 
              src="/lovable-uploads/9f3cbbc2-d21d-46aa-a455-196f08dbe887.png" 
              alt="Food Vision Logo" 
              className="w-16 h-16 sm:w-20 sm:h-20 mr-4"
            />
          </div>
          <div className="text-right">
            <h1 className="text-4xl sm:text-5xl font-bold text-[#8b1e3f] tracking-tight leading-none drop-shadow-lg bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/50">
              Food Vision
            </h1>
            <p className="text-lg text-slate-700 font-medium mt-2">
              תמונות מקצועיות למסעדות
            </p>
          </div>
        </div>
      </div>
      
      {/* Promotional Banner with enhanced design */}
      <div className="bg-gradient-to-r from-[#8b1e3f] via-[#a91e4f] to-[#8b1e3f] text-white rounded-3xl p-6 mb-6 shadow-2xl border-4 border-white/40 relative overflow-hidden">
        {/* Inner decorative frame */}
        <div className="absolute inset-2 border-2 border-white/20 rounded-2xl pointer-events-none"></div>
        
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12"></div>
        <div className="text-center relative z-10">
          <div className="inline-flex items-center bg-[#f3752b] text-white px-5 py-3 rounded-full text-sm font-bold mb-4 shadow-xl border-2 border-white/30">
            <Award className="w-4 h-4 ml-2" />
            חסכו 80% מעלויות צילום
          </div>
          <p className="text-lg font-semibold leading-relaxed">
            <span className="text-white font-bold text-xl drop-shadow-lg">ללא צלם וללא סטודיו<br />תוך 48 שעות בלבד</span>
          </p>
        </div>
        
        {/* Corner decorative elements */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-white/30"></div>
        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-white/30"></div>
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-white/30"></div>
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-white/30"></div>
      </div>
    </div>
  );
};

export default BrandHeader;
