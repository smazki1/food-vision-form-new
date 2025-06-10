import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Shield, Clock, Award, MessageCircle, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
      
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#8b1e3f]/10 to-[#f3752b]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-[#f3752b]/10 to-[#8b1e3f]/5 rounded-full blur-3xl"></div>
      </div>

      {/* WhatsApp Floating Button */}
      <button
        onClick={openWhatsApp}
        className="fixed left-6 bottom-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 group"
        aria-label="צור קשר בוואטסאפ"
      >
        <MessageCircle className="w-6 h-6" />
        <div className="absolute left-full ml-3 bottom-1/2 translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          צור קשר בוואטסאפ
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
        </div>
      </button>

      {/* How It Works Button */}
      <button
        onClick={() => setShowHowItWorks(true)}
        className="fixed right-6 bottom-6 z-50 bg-[#8b1e3f] hover:bg-[#a91e4f] text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 group"
        aria-label="איך זה עובד"
      >
        <Info className="w-6 h-6" />
        <div className="absolute right-full mr-3 bottom-1/2 translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          איך זה עובד?
          <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
        </div>
      </button>

      <div className="w-full max-w-md sm:max-w-lg flex-1 flex flex-col justify-center relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          {/* Beta Badge */}
          <div className="mb-6">
            <span className="inline-flex items-center bg-gradient-to-r from-[#8b1e3f] to-[#a91e4f] text-white text-sm font-bold px-6 py-3 rounded-full shadow-lg tracking-wide animate-pulse">
              <Sparkles className="w-4 h-4 ml-2" />
              Beta גרסת
            </span>
          </div>
          
          {/* Brand Logo & Title */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <img 
                  src="/lovable-uploads/9f3cbbc2-d21d-46aa-a455-196f08dbe887.png" 
                  alt="Food Vision Logo" 
                  className="w-16 h-16 sm:w-20 sm:h-20 mr-4 drop-shadow-lg"
                />
                <div className="absolute -inset-2 bg-gradient-to-r from-[#8b1e3f] to-[#f3752b] rounded-full opacity-20 blur-lg"></div>
              </div>
              <div className="text-right">
                <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-l from-[#8b1e3f] to-[#a91e4f] bg-clip-text text-transparent tracking-tight leading-none">
                  Food Vision
                </h1>
                <p className="text-lg text-slate-600 font-medium mt-2">
                  AI לעיבוד תמונות מזון
                </p>
              </div>
            </div>
          </div>
          
          {/* Promotional Banner */}
          <div className="bg-gradient-to-r from-[#8b1e3f] via-[#a91e4f] to-[#8b1e3f] text-white rounded-3xl p-6 mb-6 shadow-2xl border border-[#8b1e3f]/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12"></div>
            <div className="text-center relative z-10">
              <div className="inline-flex items-center bg-[#f3752b] text-white px-5 py-3 rounded-full text-sm font-bold mb-4 shadow-lg">
                <Award className="w-4 h-4 ml-2" />
                חסכו 80% מעלויות צילום
              </div>
              <p className="text-lg font-semibold leading-relaxed">
                תמונות מקצועיות למסעדה שלכם תוך 72 שעות<br />
                <span className="text-[#f3752b] font-bold text-xl">ללא צלם וללא סטודיו</span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 overflow-hidden hover:shadow-3xl transition-all duration-500 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>
          <div className="p-8 relative z-10">
            
            {/* Pricing Section */}
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
            
            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                { icon: Check, text: "3-5 מנות נבחרות מהתפריט", color: "bg-[#8b1e3f]" },
                { icon: Award, text: "10 תמונות איכותיות מוכנות לפרסום", color: "bg-[#f3752b]" },
                { icon: Clock, text: "מסירה תוך 72 שעות", color: "bg-[#8b1e3f]" },
                { icon: Sparkles, text: "זיכוי מלא לחבילה מתקדמת", color: "bg-[#f3752b]" }
              ].map((feature, index) => (
                <div key={index} className="bg-gradient-to-br from-slate-50 to-white border-2 border-slate-100 rounded-2xl p-5 text-center hover:shadow-lg hover:border-slate-200 transition-all duration-300 group">
                  <div className={`${feature.color} rounded-full p-3 mx-auto mb-4 w-fit group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-slate-700 font-semibold leading-relaxed">{feature.text}</span>
                </div>
              ))}
            </div>
            
            {/* Guarantee */}
            <div className="bg-gradient-to-r from-[#8b1e3f] to-[#a91e4f] text-white rounded-2xl p-5 mb-8 text-center shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12"></div>
              <p className="text-white font-bold text-lg flex items-center justify-center gap-3 relative z-10">
                <Shield className="w-6 h-6" />
                ערבות החזר מלא 100%
              </p>
            </div>
            
            {/* CTA Button */}
            <Button 
              onClick={redirectToUpload}
              className="w-full bg-gradient-to-r from-[#f3752b] to-[#ff6b35] hover:from-[#e8621f] hover:to-[#f3752b] text-white py-6 px-4 text-lg font-bold rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] border-0 min-h-[56px] relative overflow-hidden group"
            >
              <span className="relative z-10">קבלו תמונות מקצועיות לעסק שלכם</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </Button>
          </div>
        </div>
        
        {/* Existing Customers */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={goToLogin}
            variant="ghost"
            className="px-8 py-4 text-base font-medium text-slate-600 hover:text-[#8b1e3f] hover:bg-white/50 transition-all duration-300 rounded-2xl backdrop-blur-sm border border-transparent hover:border-white/30 min-h-[48px]"
          >
            התחברות ללקוחות קיימים
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-500 font-medium text-sm">
            © 2025 Food Vision - פלטפורמה מתקדמת לעיבוד תמונות מזון
          </p>
        </div>
      </div>

      {/* How It Works Modal */}
      <Dialog open={showHowItWorks} onOpenChange={setShowHowItWorks}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#8b1e3f] text-center">
              איך התהליך עובד?
            </DialogTitle>
            <DialogDescription className="text-center text-lg text-slate-600">
              המדריך המלא לקבלת תמונות מקצועיות למסעדה שלכם
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-6">
            {[
              {
                step: "1",
                title: "העלאת תמונות",
                description: "צלמו את המנות שלכם בטלפון והעלו אותן למערכת",
                icon: "📸"
              },
              {
                step: "2", 
                title: "עיבוד AI מתקדם",
                description: "המערכת שלנו מעבדת את התמונות עם טכנולוגיית בינה מלאכותית מתקדמת",
                icon: "🤖"
              },
              {
                step: "3",
                title: "עריכה מקצועית",
                description: "הצוות שלנו מבצע עריכה מקצועית וליטוש של התמונות",
                icon: "✨"
              },
              {
                step: "4",
                title: "קבלת התוצר הסופי",
                description: "תוך 72 שעות תקבלו 10 תמונות מקצועיות מוכנות לפרסום",
                icon: "🎯"
              }
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-[#8b1e3f] to-[#a91e4f] text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#8b1e3f] mb-2 flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    {item.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-[#8b1e3f] to-[#a91e4f] text-white rounded-xl text-center">
            <h3 className="text-xl font-bold mb-2">מוכנים להתחיל?</h3>
            <p className="text-lg">לחצו על הכפתור למעלה וקבלו תמונות מקצועיות כבר היום!</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerLogin;
