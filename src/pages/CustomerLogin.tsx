
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandHeader from '@/components/customer-login/BrandHeader';
import PricingSection from '@/components/customer-login/PricingSection';
import FeaturesGrid from '@/components/customer-login/FeaturesGrid';
import HowItWorksModal from '@/components/customer-login/HowItWorksModal';
import WhatsAppButton from '@/components/customer-login/WhatsAppButton';
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
    <div dir="rtl" className="min-h-screen relative flex flex-col items-center justify-center px-6 py-8 sm:px-8 overflow-hidden">
      
      {/* Split Background */}
      <div className="absolute inset-0 flex">
        {/* Left side - Salmon Bowl */}
        <div 
          className="flex-1 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(251, 146, 60, 0.3), rgba(245, 158, 11, 0.3)), url('/lovable-uploads/8c083378-a07b-471b-a45f-68c496fa099f.png')`
          }}
        />
        
        {/* Right side - Chocolate Cake */}
        <div 
          className="flex-1 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(225deg, rgba(245, 158, 11, 0.3), rgba(251, 146, 60, 0.3)), url('/lovable-uploads/2afb683b-feda-4b83-897e-15fd3bab53b4.png')`
          }}
        />
      </div>

      {/* Enhanced Overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/15 to-black/25 backdrop-blur-[0.5px]"></div>

      {/* Floating geometric elements with warm colors */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-amber-400/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-orange-400/25 rounded-full blur-xl"></div>
        <div className="absolute top-1/3 right-1/3 w-28 h-28 bg-yellow-400/20 rounded-full blur-2xl"></div>
      </div>

      <WhatsAppButton onClick={openWhatsApp} />

      <div className="w-full max-w-md sm:max-w-lg flex-1 flex flex-col justify-center relative z-10">
        
        <BrandHeader />
        
        {/* Enhanced Main Card with improved glass effect */}
        <div className="bg-white/92 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden hover:shadow-3xl transition-all duration-500 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/60 to-white/40 pointer-events-none"></div>
          
          {/* Warm border glow */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-amber-400/25 via-orange-400/25 to-yellow-400/25 opacity-0 hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
          
          <div className="p-8 relative z-10">
            
            <PricingSection />
            
            <FeaturesGrid />
            
            {/* Enhanced Guarantee Section with warm colors */}
            <div className="flex items-center justify-center gap-2 text-amber-700 mb-6 bg-gradient-to-r from-white/85 to-white/70 rounded-xl py-3 px-4 backdrop-blur-sm border border-amber-200/40 shadow-sm">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-semibold">ערבות החזר מלא 100%</span>
            </div>
            
            {/* Enhanced Main CTA Button with warm gradient */}
            <Button 
              onClick={redirectToUpload}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-6 px-4 text-lg font-bold rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] border-0 min-h-[60px] relative overflow-hidden group mb-6"
              style={{
                boxShadow: '0 10px 30px rgba(245, 158, 11, 0.4)'
              }}
            >
              <span className="relative z-10">קבלו תמונות מקצועיות לעסק שלכם</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            </Button>

            {/* Enhanced How It Works Button */}
            <Button
              onClick={() => setShowHowItWorks(true)}
              variant="ghost"
              className="w-full text-amber-700 hover:text-amber-800 hover:bg-white/60 backdrop-blur-sm py-3 px-4 text-base font-medium rounded-xl transition-all duration-300 min-h-[44px] mb-4 border border-white/40 hover:border-amber-200/60"
            >
              איך זה עובד?
            </Button>

            {/* Enhanced Existing Customers */}
            <div className="flex justify-center">
              <Button
                onClick={goToLogin}
                variant="ghost"
                className="px-6 py-2 text-sm font-normal text-slate-600 hover:text-amber-700 hover:bg-white/50 transition-all duration-300 rounded-xl backdrop-blur-sm border border-transparent hover:border-white/50"
              >
                התחברות ללקוחות קיימים
              </Button>
            </div>
          </div>
        </div>
        
        {/* Enhanced Footer */}
        <div className="text-center mt-8">
          <p className="text-white/95 font-medium text-sm drop-shadow-lg backdrop-blur-sm bg-black/20 rounded-xl py-2 px-4 inline-block">
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
