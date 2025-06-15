
import { Sparkles, Award } from 'lucide-react';

const BrandHeader = () => {
  return (
    <div className="text-center mb-8">
      {/* Beta Badge with warm colors */}
      <div className="mb-6">
        <span className="inline-flex items-center bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold px-6 py-3 rounded-full shadow-lg tracking-wide animate-pulse">
          <Sparkles className="w-4 h-4 ml-2" />
          Beta גרסת
        </span>
      </div>
      
      {/* Brand Logo & Title with warm colors */}
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
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-l from-amber-500 to-orange-500 bg-clip-text text-transparent tracking-tight leading-none">
              Food Vision
            </h1>
            <p className="text-lg text-slate-600 font-medium mt-2">
              תמונות מקצועיות למסעדות
            </p>
          </div>
        </div>
      </div>
      
      {/* Promotional Banner with warm colors */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white rounded-3xl p-6 mb-6 shadow-2xl border border-amber-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12"></div>
        <div className="text-center relative z-10">
          <div className="inline-flex items-center bg-orange-600 text-white px-5 py-3 rounded-full text-sm font-bold mb-4 shadow-lg">
            <Award className="w-4 h-4 ml-2" />
            חסכו 80% מעלויות צילום
          </div>
          <p className="text-lg font-semibold leading-relaxed">
            <span className="text-yellow-100 font-bold text-xl">ללא צלם וללא סטודיו<br />תוך 72 שעות בלבד</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BrandHeader;
