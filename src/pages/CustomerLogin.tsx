
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandHeader from '@/components/customer-login/BrandHeader';
import PricingSection from '@/components/customer-login/PricingSection';
import FeaturesGrid from '@/components/customer-login/FeaturesGrid';
import GuaranteeSection from '@/components/customer-login/GuaranteeSection';
import ActionButtons from '@/components/customer-login/ActionButtons';
import HowItWorksModal from '@/components/customer-login/HowItWorksModal';
import WhatsAppButton from '@/components/customer-login/WhatsAppButton';
import BackgroundElements from '@/components/customer-login/BackgroundElements';

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
            
            <GuaranteeSection />
            
            <ActionButtons 
              onGetPhotos={redirectToUpload}
              onHowItWorks={() => setShowHowItWorks(true)}
              onLogin={goToLogin}
            />
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
