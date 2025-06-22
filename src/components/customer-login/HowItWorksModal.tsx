import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Award, Users, TrendingUp, Zap, Calendar, Clock, Sparkles, Shield, MessageCircle, Camera, Settings, FileImage, Database } from 'lucide-react';

interface HowItWorksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWhatsAppClick: () => void;
}

const HowItWorksModal = ({ open, onOpenChange, onWhatsAppClick }: HowItWorksModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-[#8b1e3f] text-center mb-2">
            מה זה בעצם Food Vision?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8 mt-6">
          
          {/* What is Food Vision */}
          <div className="bg-gradient-to-r from-[#8b1e3f] to-[#a91e4f] text-white rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12"></div>
            <div className="relative z-10">
              <p className="text-lg leading-relaxed text-center">
                החלטנו ליצור מערכת AI מתקדמת שלומדת את המנות שלכם ויוצרת תמונות מקצועיות תוך ימים, במחיר צפוי, כל פעם שאתם צריכים. בעצם יצרנו לכם "צלם דיגיטלי" פנימי שתמיד זמין.
              </p>
            </div>
          </div>

          {/* Why it's different */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-blue-800 mb-6 text-center flex items-center justify-center gap-3">
              <Camera className="w-8 h-8" />
              למה זה שונה?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                <h4 className="text-xl font-bold text-red-700 mb-4">צלם רגיל:</h4>
                <p className="text-red-600 text-lg">יום צילום → עריכה → נגמר → צריכים עוד? מתחילים מהתחלה</p>
              </div>
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6">
                <h4 className="text-xl font-bold text-green-700 mb-4">המערכת שלנו:</h4>
                <p className="text-green-600 text-lg">תמיד זמינה, מחירים קבועים, אפשר להוסיף מנות בכל זמן</p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div>
            <h3 className="text-2xl font-bold text-[#8b1e3f] mb-6 text-center flex items-center justify-center gap-3">
              <Settings className="w-8 h-8" />
              איך זה עובד:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { 
                  step: "1", 
                  title: "העלאת מידע", 
                  description: "אתם מעלים תמונות קיימות של המנות + תיאור המרכיבים. ככל שהתמונות יותר מגוונות (זוויות שונות, תאורה שונה), התוצאה טובה יותר.", 
                  icon: <FileImage className="w-6 h-6" /> 
                },
                { 
                  step: "2", 
                  title: "אפיון הסגנון", 
                  description: "שיחה קצרה איתנו להבנת המותג שלכם - צבעוניות, סגנון צילום, סוג הוואירה שמתאים לאווירה של המקום.", 
                  icon: <Settings className="w-6 h-6" /> 
                },
                { 
                  step: "3", 
                  title: "הפקה", 
                  description: "המערכת יוצרת וריאציות שונות של כל מנה - זוויות צילום שונות, עיצוב השולחן, תאורה. אתם בוחרים מה מתאים לכם.", 
                  icon: <Sparkles className="w-6 h-6" /> 
                },
                { 
                  step: "4", 
                  title: "בנק התמונות שלכם", 
                  description: "כל התמונות נשמרות במערכת. תוכלו לחזור בכל זמן, להזמין וריאציות נוספות, להוסיף מנות חדשות, או לבקש עדכונים עונתיים.", 
                  icon: <Database className="w-6 h-6" /> 
                }
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4 p-6 bg-gradient-to-r from-slate-50 to-white rounded-xl border-2 border-slate-200 hover:border-[#8b1e3f]/30 transition-colors">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-[#8b1e3f] to-[#a91e4f] text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-[#8b1e3f] mb-2 flex items-center gap-2">
                      {item.icon}
                      {item.title}
                    </h4>
                    <p className="text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What it solves */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-orange-800 mb-6 text-center">
              מה זה פותר לכם:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "מנות עם תמונות שלא עושות להן צדק",
                "עדכונים עונתיים יקרים", 
                "תלות בזמינות צלמים",
                "מחירים לא צפויים"
              ].map((problem, index) => (
                <div key={index} className="bg-white rounded-2xl p-4 shadow-md flex items-center gap-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></div>
                  <p className="text-orange-700 font-medium">{problem}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tasting package */}
          <div className="bg-gradient-to-r from-[#f3752b]/10 to-[#f3752b]/5 border-2 border-[#f3752b] rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-[#f3752b] mb-6 text-center">
              חבילת הטעימה (249₪):
            </h3>
            <p className="text-lg text-slate-700 leading-relaxed text-center">
              במקום להחליט בעיוורון - תבדקו איך המערכת עובדת עם המנות שלכם. 1-3 מנות מעוצבות, תראו תוצאות, תחליטו אם להמשיך. 
              <br /><br />
              <strong>כמו לנסות לפני קנייה + זיכוי מלא.</strong>
            </p>
          </div>

          {/* Why now */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-purple-800 mb-6 text-center">
              למה עכשיו?
            </h3>
            <div className="text-center space-y-4">
              <p className="text-lg text-purple-700">
                כמה פעמים השנה אתם צריכים תמונות חדשות? כמה זה עולה עכשיו?
              </p>
              <p className="text-lg text-purple-700">
                ב-249₪ אתם קונים פתרון לבעיה הבאה שתהיה לכם - במקום לשלם 3,000₪ לצלם או להיתקע עם תמונות ישנות.
              </p>
              <p className="text-xl font-bold text-purple-800">
                זה לא עוד כלי - זה העתיד של התוכן הויזואלי במסעדות - והוא כבר כאן. מוכנים לטעום?
              </p>
            </div>
          </div>

          {/* Start now button */}
          <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-8 text-center">
            <h3 className="text-2xl font-bold text-green-800 mb-6">
              מוכנים לטעום?
            </h3>
            <Button
              onClick={() => {
                onOpenChange(false);
                window.location.href = '/public-upload';
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-lg font-bold rounded-2xl flex items-center gap-3 mx-auto mb-4"
            >
              <Sparkles className="w-6 h-6" />
              מתחילים עכשיו
            </Button>
            <Button
              onClick={onWhatsAppClick}
              variant="outline"
              className="border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white px-8 py-3 text-base font-semibold rounded-2xl flex items-center gap-3 mx-auto"
            >
              <MessageCircle className="w-5 h-5" />
              דבר איתנו ישירות
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HowItWorksModal;
