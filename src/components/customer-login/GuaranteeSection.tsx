
import { Shield } from 'lucide-react';

const GuaranteeSection = () => {
  return (
    <div className="bg-gradient-to-r from-slate-100 to-slate-50 border-2 border-[#8b1e3f]/20 text-[#8b1e3f] rounded-2xl p-5 mb-8 text-center shadow-inner relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#8b1e3f]/5 to-transparent transform -skew-x-12"></div>
      <p className="font-bold text-lg flex items-center justify-center gap-3 relative z-10">
        <Shield className="w-6 h-6" />
        ערבות החזר מלא 100%
      </p>
    </div>
  );
};

export default GuaranteeSection;
