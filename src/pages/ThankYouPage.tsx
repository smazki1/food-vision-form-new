import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, Phone, Clock, Sparkles, Camera, MessageCircle, FileText, Palette } from 'lucide-react';
import { useEffect } from 'react';

const ThankYouPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  const nextSteps = [
    {
      icon: Sparkles,
      title: "נתחיל להפיק את התמונות",
      description: "המערכת שלנו תתחיל לעבוד",
      color: "text-[#f3752b] bg-[#f3752b]/10"
    },
    {
      icon: Clock,
      title: "תוצאות תוך 48 שעות",
      description: "תמונות מקצועיות מוכנות לפרסום",
      color: "text-blue-600 bg-blue-100"
    }
  ];

  const preparationItems = [
    {
      icon: FileText,
      title: "רשימת 3-5 המנות החשובות ביותר",
      description: "המנות שהכי חשוב לכם שיוצגו בצורה מושלמת"
    },
    {
      icon: Camera,
      title: "תמונות נוספות מזוויות שונות",
      description: "כל תמונה נוספת עוזרת למערכת ליצור תוצאות טובות יותר"
    },
    {
      icon: Palette,
      title: "חומרי מיתוג",
      description: "לוגו, צבעי המקום, סגנון עיצוב - כל מה שמייצג את המותג שלכם"
    }
  ];

  const openWhatsApp = () => {
    window.open('https://wa.me/972527772807', '_blank');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#8b1e3f]/10 to-[#f3752b]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-[#f3752b]/10 to-[#8b1e3f]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <img 
              src="/lovable-uploads/9f3cbbc2-d21d-46aa-a455-196f08dbe887.png" 
              alt="Food Vision Logo" 
              className="w-16 h-16 sm:w-20 sm:h-20 mr-4 drop-shadow-lg"
            />
            <div className="text-right">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-l from-[#8b1e3f] to-[#a91e4f] bg-clip-text text-transparent">
                Food Vision
              </h1>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-3xl p-8 mb-8 shadow-2xl">
            <CheckCircle className="w-20 h-20 mx-auto mb-4 animate-bounce" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              מעולה! התחלנו לעבוד בשבילכם
            </h2>
            <p className="text-xl opacity-90">
              תודה שבחרתם ב-Food Vision - נעשה הכל כדי שתהיו מרוצים מהתוצאות
            </p>
          </div>
        </div>

        {/* What's Happening Now */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-[#8b1e3f] mb-8 text-center">
            מה קורה עכשיו?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {nextSteps.map((step, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
                <div className={`w-14 h-14 rounded-full ${step.color} flex items-center justify-center mb-4 mx-auto`}>
                  <step.icon className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-2 text-center">
                  {step.title}
                </h4>
                <p className="text-slate-600 text-center">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-[#8b1e3f] to-[#a91e4f] text-white rounded-3xl p-8 text-center shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">
              שאלות? פנו אלינו:
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={openWhatsApp}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-lg font-bold rounded-2xl flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <MessageCircle className="w-6 h-6" />
                וואטסאפ: 052-777-2807
              </Button>
              <div className="text-lg">
                או בטלפון: <span className="font-bold">052-777-2807</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center">
          <Button
            onClick={() => navigate('/customer-login')}
            variant="outline"
            className="border-2 border-[#8b1e3f] text-[#8b1e3f] hover:bg-[#8b1e3f] hover:text-white px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-300"
          >
            חזרה לעמוד הבית
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-slate-500 font-medium text-sm">
            © 2025 Food Vision - פלטפורמה מתקדמת לעיבוד תמונות מזון
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
