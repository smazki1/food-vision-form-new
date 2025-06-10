
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
            כל מה שאתה צריך לדעת
          </DialogTitle>
          <DialogDescription className="text-center text-lg text-slate-600 font-medium">
            במקום שיחה ארוכה - כל הפרטים כאן
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-8 mt-6">
          
          {/* What is Food Vision */}
          <div className="bg-gradient-to-r from-[#8b1e3f] to-[#a91e4f] text-white rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-6 flex items-center justify-center gap-3">
                <Sparkles className="w-8 h-8" />
                מה זה בעצם Food Vision?
              </h2>
              <p className="text-lg leading-relaxed text-center">
                פיתחנו מערכת AI מתמחה שלומדת איך נראות המנות שלכם ויוצרת תמונות מקצועיות שנאמנות למקור. 
                זה לא "פילטר" או עריכה - זה יצירה מחדש של התמונה ברמה מקצועית.
              </p>
            </div>
          </div>

          {/* How it's different from regular photographer */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-blue-800 mb-6 text-center flex items-center justify-center gap-3">
              <Camera className="w-8 h-8" />
              איך זה שונה מצלם רגיל?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                <h4 className="text-xl font-bold text-red-700 mb-4">צלם מסורתי:</h4>
                <ul className="space-y-2 text-red-600">
                  <li>• תיאום מראש מסובך</li>
                  <li>• הכנת מנות מיוחד לצילום</li>
                  <li>• פינוי יום שלם במסעדה</li>
                  <li>• עלויות נוספות של חומרי גלם</li>
                  <li>• אם לא מרוצים - אין דרך חזרה</li>
                </ul>
              </div>
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6">
                <h4 className="text-xl font-bold text-green-700 mb-4">המערכת שלנו:</h4>
                <ul className="space-y-2 text-green-600">
                  <li>• תמיד זמינה</li>
                  <li>• אפשר להוסיף מנות בכל זמן</li>
                  <li>• מחירים קבועים וצפויים</li>
                  <li>• ללא הפרעה לפעילות המסעדה</li>
                  <li>• אפשרות לתיקונים ושיפורים</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Full Process */}
          <div>
            <h3 className="text-2xl font-bold text-[#8b1e3f] mb-6 text-center flex items-center justify-center gap-3">
              <Settings className="w-8 h-8" />
              התהליך המלא:
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

          {/* How it solves real problems */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-orange-800 mb-6 text-center">
              איך זה פותר בעיות אמיתיות של מסעדות?
            </h3>
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <h4 className="text-lg font-bold text-orange-700 mb-3">תחשבו על המצב הנוכחי שלכם:</h4>
                <ul className="space-y-2 text-orange-600">
                  <li>• יש לכם מנות שהתמונות שלהן לא פשוט לא מוכרות?</li>
                  <li>• צריכים לעדכן תמונות למנות עונתיות אבל זה יקר מדי?</li>
                  <li>• תלויים בזמינות ובמחירים משתנים של צלמים?</li>
                </ul>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <h4 className="text-lg font-bold text-green-700 mb-3">עם המערכת שלנו:</h4>
                <ul className="space-y-2 text-green-600">
                  <li>• כל פעם שמוסיפים מנה חדשה - תמונות תוך 72 שעות</li>
                  <li>• מחיר צפוי וקבוע לכל תמונה</li>
                  <li>• אפשרות לנסות וריאציות שונות עד שמוצאים את המושלמת</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Why we created the tasting package */}
          <div className="bg-gradient-to-r from-[#f3752b]/10 to-[#f3752b]/5 border-2 border-[#f3752b] rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-[#f3752b] mb-4 text-center">
              זאת הסיבה שיצרנו את חבילת הטעימה (250₪):
            </h3>
            <p className="text-lg text-slate-700 leading-relaxed text-center">
              במקום לקחת החלטה על חבילה גדולה בעיוורון, אתם בעצם "בודקים" איך המערכת עובדת עם המנות שלכם. 
              מקבלים 3-5 מנות מעוצבות מקצועית, רואים את התוצאות, ורק אז מחליטים אם להמשיך.
              <br /><br />
              <strong>זה כמו לנסות לפני שקונים - אבל עם זיכוי מלא אם אתם ממשיכים.</strong>
            </p>
          </div>

          {/* Long term vision */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-purple-800 mb-6 text-center">
              איך זה נראה לטווח ארוך:
            </h3>
            <p className="text-lg text-purple-700 mb-4 text-center">
              תחשבו על זה כמו שיש לכם צלם פנימי שתמיד זמין:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 text-center shadow-md">
                <div className="text-2xl mb-2">🍽️</div>
                <p className="font-semibold text-purple-700">מנה חדשה במתכון מיוחד? תמונות תוך יומיים-שלושה</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-md">
                <div className="text-2xl mb-2">🎄</div>
                <p className="font-semibold text-purple-700">מבצע עונתי? תמונות מותאמות לעונה</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-md">
                <div className="text-2xl mb-2">✨</div>
                <p className="font-semibold text-purple-700">רוצים לשפר תמונה קיימת? וריאציות חדשות בקלות</p>
              </div>
            </div>
            <p className="text-lg text-purple-700 mt-4 text-center">
              במקום לתאם צלם, לחכות לזמינות, ולשלם כל פעם מחיר אחר - יש לכם מערכת שעובדת כמו צוות פנימי.
            </p>
          </div>

          {/* The real question */}
          <div className="bg-gradient-to-r from-[#8b1e3f] to-[#a91e4f] text-white rounded-3xl p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-6">השאלה האמיתית היא:</h3>
              <div className="space-y-4 text-lg">
                <p>כמה פעמים השנה אתם צריכים תמונות חדשות או מעודכנות?</p>
                <p>כמה זה עולה לכם עכשיו בזמן ובכסף?</p>
                <p className="text-[#f3752b] font-bold text-xl">
                  אם התשובות הן "הרבה" ו"יקר", אז חבילת הטעימה תראה לכם בדיוק איך זה יכול לחסוך לכם בעתיד.
                </p>
              </div>
            </div>
          </div>

          {/* Why start now */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-green-800 mb-6 text-center">
              למה להתחיל עכשיו?
            </h3>
            <div className="text-center space-y-4">
              <p className="text-lg text-green-700">
                ב-250₪ אתם בעצם קונים ביטוח נגד הבעיה הבאה שתהיה לכם עם תמונות.
              </p>
              <p className="text-lg text-green-700">
                במקום להיתקע עם אותן תמונות ישנות או לשלם 3,000₪ לצלם בפעם הבאה, יהיה לכם פתרון מוכן.
              </p>
              <p className="text-xl font-bold text-green-800">
                זה לא סתם תמונות - זה שינוי באופן שבו אתם מתמודדים עם התוכן הויזואלי של המקום.
              </p>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-8 text-center">
            <h3 className="text-2xl font-bold text-green-800 mb-6">
              אני מוכן/ה להתחיל
            </h3>
            <Button
              onClick={onWhatsAppClick}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-lg font-bold rounded-2xl flex items-center gap-3 mx-auto"
            >
              <MessageCircle className="w-6 h-6" />
              דבר איתנו ישירות
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HowItWorksModal;
