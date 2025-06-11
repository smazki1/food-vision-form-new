
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandHeader from '@/components/customer-login/BrandHeader';
import PricingSection from '@/components/customer-login/PricingSection';
import FeaturesGrid from '@/components/customer-login/FeaturesGrid';
import HowItWorksModal from '@/components/customer-login/HowItWorksModal';
import WhatsAppButton from '@/components/customer-login/WhatsAppButton';
import BackgroundElements from '@/components/customer-login/BackgroundElements';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

const CustomerLogin = () => {
  const navigate = useNavigate();
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  
  const redirectToUpload = () => {
    navigate('/public-upload');
  };
  
  const goToLogin = () => {
    navigate('/customer/auth');
  };

  const openWhatsApp = () => {
    window.open('https://wa.me/972527772807', '_blank');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col items-center justify-center px-6 py-8 sm:px-8 relative overflow-hidden">
      
      <BackgroundElements />

      <WhatsAppButton onClick={openWhatsApp} />

      <div className="w-full max-w-md sm:max-w-lg flex-1 flex flex-col justify-center relative z-10">
        
        <BrandHeader />
        
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 overflow-hidden hover:shadow-3xl transition-all duration-500 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>
          <div className="p-8 relative z-10">
            
            <PricingSection />
            
            <FeaturesGrid />
            
            {/* Minimized Guarantee Section */}
            <div className="flex items-center justify-center gap-2 text-[#8b1e3f] mb-6">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">ערבות החזר מלא 100%</span>
            </div>
            
            {/* Enhanced Main CTA Button - Reduced Animation */}
            <Button 
              onClick={redirectToUpload}
              className="w-full bg-gradient-to-r from-[#f3752b] to-[#ff6b35] hover:from-[#e8621f] hover:to-[#f3752b] text-white py-6 px-4 text-lg font-bold rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] border-0 min-h-[60px] relative overflow-hidden group mb-6"
              style={{
                animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
            >
              <span className="relative z-10">קבלו תמונות מקצועיות לעסק שלכם</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff6b35]/15 to-[#f3752b]/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Button>

            {/* Simplified How It Works Button */}
            <Button
              onClick={() => setShowHowItWorks(true)}
              variant="ghost"
              className="w-full text-[#8b1e3f] hover:text-[#8b1e3f] hover:bg-[#8b1e3f]/5 py-3 px-4 text-base font-medium rounded-xl transition-all duration-300 min-h-[44px] mb-4"
            >
              איך זה עובד?
            </Button>

            {/* Existing Customers - Subtle */}
            <div className="flex justify-center">
              <Button
                onClick={goToLogin}
                variant="ghost"
                className="px-6 py-2 text-sm font-normal text-slate-500 hover:text-[#8b1e3f] hover:bg-white/30 transition-all duration-300 rounded-xl backdrop-blur-sm border border-transparent hover:border-white/20"
              >
                התחברות ללקוחות קיימים
              </Button>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-500 font-medium text-sm">
            © 2025 Food Vision - פלטפורמה מתקדמת לעיבוד תמונות מזון
          </p>
        </div>
      </div>

      <HowItWorksModal 
        open={showHowItWorks} 
        onOpenChange={setShowHowItWorks}
        onWhatsAppClick={openWhatsApp}
      />
    </div>
  );
};

export default CustomerLogin;
