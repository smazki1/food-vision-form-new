import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Shield, Clock, Award } from 'lucide-react';

const CustomerLogin = () => {
  const navigate = useNavigate();
  
  const redirectToUpload = () => {
    navigate('/public-upload');
  };
  
  const goToLogin = () => {
    navigate('/customer/auth');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex flex-col items-center justify-center px-6 py-8 sm:px-8">
      <div className="w-full max-w-md sm:max-w-lg flex-1 flex flex-col justify-center">
        
        {/* Brand Header - Professional Typography */}
        <div className="text-center mb-4">
          {/* Beta Badge - Fixed */}
          <div className="mb-5">
            <span className="inline-flex items-center bg-[#8b1e3f] text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-sm tracking-wide">
              Beta
            </span>
          </div>
          
          {/* Brand Logo & Title */}
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/lovable-uploads/9f3cbbc2-d21d-46aa-a455-196f08dbe887.png" 
                alt="Food Vision Logo" 
                className="w-14 h-14 sm:w-16 sm:h-16 mr-3"
              />
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight" style={{ lineHeight: '1.4' }}>
                Food Vision
              </h1>
            </div>
            <p className="text-lg text-slate-600 font-medium max-w-sm mx-auto mb-3" style={{ lineHeight: '1.4' }}>
              פלטפורמה מתקדמת לעיבוד תמונות מזון
            </p>
          </div>
          
          {/* Promotional Banner - Enhanced */}
          <div className="bg-gradient-to-r from-[#8b1e3f] to-[#a91e4f] text-white rounded-2xl p-5 mb-4 shadow-lg border border-[#8b1e3f]/20">
            <div className="text-center">
              <div className="inline-flex items-center bg-[#f3752b] text-white px-4 py-2.5 rounded-full text-sm font-bold mb-3 shadow-md">
                חסכו/י 80% מעלויות צילום
              </div>
              <p className="text-base font-medium" style={{ lineHeight: '1.4' }}>
                תמונות מקצועיות למסעדה שלכם תוך 72 שעות<br />
                <span className="text-[#f3752b] font-bold">ללא צלם וללא סטודיו</span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Main Card - Professional Design */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden hover:shadow-2xl transition-all duration-500">
          <div className="p-6 sm:p-8">
            
            {/* Pricing Section - Clean Hierarchy */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center bg-[#f3752b]/10 border border-[#f3752b] text-[#f3752b] px-4 py-2.5 rounded-full text-sm font-semibold mb-4 shadow-sm">
                <Shield className="w-4 h-4 ml-2" />
                מוגבל ל-30 עסקים בלבד
              </div>
              
              <div className="bg-gradient-to-br from-[#8b1e3f]/5 via-slate-50 to-[#f3752b]/5 rounded-2xl p-6 mb-5 border border-slate-200">
                <div className="flex flex-col items-center justify-center">
                  <div className="text-5xl sm:text-6xl font-bold text-[#8b1e3f] leading-none mb-2">
                    249<span className="text-2xl text-[#f3752b] font-bold">₪</span>
                  </div>
                  <div className="text-xl text-slate-400 line-through font-medium">499₪</div>
                </div>
              </div>
            </div>
            
            {/* Features Grid - Professional Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center hover:bg-[#8b1e3f]/5 hover:border-[#8b1e3f]/30 transition-all duration-300 group">
                <div className="bg-[#8b1e3f] rounded-full p-2.5 mx-auto mb-3 w-fit group-hover:scale-110 transition-transform duration-300">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-slate-700 font-semibold" style={{ lineHeight: '1.4' }}>3-5 מנות נבחרות מהתפריט</span>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center hover:bg-[#8b1e3f]/5 hover:border-[#8b1e3f]/30 transition-all duration-300 group">
                <div className="bg-[#f3752b] rounded-full p-2.5 mx-auto mb-3 w-fit group-hover:scale-110 transition-transform duration-300">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-slate-700 font-semibold" style={{ lineHeight: '1.4' }}>10 תמונות איכותיות מוכנות לפרסום</span>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center hover:bg-[#8b1e3f]/5 hover:border-[#8b1e3f]/30 transition-all duration-300 group">
                <div className="bg-[#8b1e3f] rounded-full p-2.5 mx-auto mb-3 w-fit group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-slate-700 font-semibold" style={{ lineHeight: '1.4' }}>מסירה תוך 72 שעות</span>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center hover:bg-[#8b1e3f]/5 hover:border-[#8b1e3f]/30 transition-all duration-300 group">
                <div className="bg-[#f3752b] rounded-full p-2.5 mx-auto mb-3 w-fit group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-slate-700 font-semibold" style={{ lineHeight: '1.4' }}>זיכוי מלא לחבילה מתקדמת</span>
              </div>
            </div>
            
            {/* Guarantee - Enhanced */}
            <div className="bg-gradient-to-r from-[#8b1e3f] to-[#a91e4f] text-white rounded-2xl p-4 mb-6 text-center shadow-lg">
              <p className="text-white font-bold text-base flex items-center justify-center gap-2" style={{ lineHeight: '1.4' }}>
                <Shield className="w-5 h-5" />
                ערבות החזר מלא 100%
              </p>
            </div>
            
            {/* CTA Button - Fixed Orange */}
            <Button 
              onClick={redirectToUpload}
              className="w-full bg-gradient-to-r from-[#f3752b] to-[#ff6b35] hover:from-[#e8621f] hover:to-[#f3752b] text-white py-5 px-3 text-base font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] border-0 min-h-[52px]"
              style={{ lineHeight: '1.4' }}
            >
              קבלו תמונות מקצועיות לעסק שלכם
            </Button>
          </div>
        </div>
        
        {/* Existing Customers - Minimalist */}
        <div className="mt-5 flex justify-center">
          <Button
            onClick={goToLogin}
            variant="ghost"
            className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-[#8b1e3f] hover:bg-slate-50 transition-all duration-300 rounded-xl min-h-[44px]"
            style={{ lineHeight: '1.4' }}
          >
            התחברות ללקוחות קיימים
          </Button>
        </div>

        {/* Footer - Clean Typography */}
        <div className="text-center mt-6">
          <p className="text-slate-500 font-medium text-sm" style={{ lineHeight: '1.4' }}>
            © 2025 Food Vision
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
