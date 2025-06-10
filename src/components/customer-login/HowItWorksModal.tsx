
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Award, Users, TrendingUp, Zap, Calendar, Clock, Sparkles, Shield, MessageCircle } from 'lucide-react';

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
            הכל מה שאתה צריך לדעת
          </DialogTitle>
          <DialogDescription className="text-center text-lg text-slate-600 font-medium">
            במקום שיחה ארוכה - כל הפרטים כאן
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-8 mt-6">
          
          {/* Package Details */}
          <div className="bg-gradient-to-r from-[#8b1e3f] to-[#a91e4f] text-white rounded-3xl p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-6 flex items-center justify-center gap-3">
                <Award className="w-8 h-8" />
                חבילת הטעימה - 250₪
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-6 h-6 text-[#f3752b]" />
                    <span className="text-lg font-semibold">3-5 מנות לבחירתך</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <Award className="w-6 h-6 text-[#f3752b]" />
                    <span className="text-lg font-semibold">10-12 תמונות מקצועיות</span>
                  </div>
                </div>
                <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-6 h-6 text-[#f3752b]" />
                    <span className="text-lg font-semibold">זיכוי מלא לחבילה הבאה (בעצם בחינם!)</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="w-6 h-6 text-[#f3752b]" />
                    <span className="text-lg font-semibold">תוצאות תוך 48 שעות</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 6 Steps Process */}
          <div>
            <h3 className="text-2xl font-bold text-[#8b1e3f] mb-6 text-center flex items-center justify-center gap-3">
              <Users className="w-8 h-8" />
              איך זה עובד - 6 שלבים פשוטים:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { step: "1", title: "מילוי טופס והעלאת תמונות", description: "אתה ממלא את הטופס ומעלה תמונות קיימות", icon: "📋" },
                { step: "2", title: "תשלום מיידי", description: "תשלום מיידי של 250₪ (ביט/כרטיס אשראי)", icon: "💳" },
                { step: "3", title: "שיחת תיאום", description: "מעצב שלנו מתקשר אליך לשיחה של 15 דקות", icon: "📞" },
                { step: "4", title: "יצירת תמונות", description: "אנחנו יוצרים את התמונות עם AI מתקדם", icon: "🤖" },
                { step: "5", title: "קבלת תוצאות", description: "אתה מקבל את התוצאות לבדיקה + תיקונים", icon: "🎯" },
                { step: "6", title: "מעבר לחבילה מלאה", description: "מעבר לחבילה מלאה (עם זיכוי!) או סיום", icon: "✨" }
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4 p-6 bg-gradient-to-r from-slate-50 to-white rounded-xl border-2 border-slate-200 hover:border-[#8b1e3f]/30 transition-colors">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-[#8b1e3f] to-[#a91e4f] text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-[#8b1e3f] mb-2 flex items-center gap-2">
                      <span className="text-xl">{item.icon}</span>
                      {item.title}
                    </h4>
                    <p className="text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Savings */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-green-800 mb-6 text-center flex items-center justify-center gap-3">
              <TrendingUp className="w-8 h-8" />
              למה זה חוסך לך כסף:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="text-3xl font-bold text-red-600 mb-2">3,000-5,000₪</div>
                <div className="text-lg font-semibold text-slate-700">צלם מקצועי ליום</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="text-3xl font-bold text-green-600 mb-2">12-25₪</div>
                <div className="text-lg font-semibold text-slate-700">התמונות שלנו לתמונה</div>
              </div>
              <div className="bg-gradient-to-r from-[#8b1e3f] to-[#a91e4f] text-white rounded-2xl p-6 shadow-lg">
                <div className="text-3xl font-bold mb-2">חיסכון של 80%!</div>
                <div className="text-lg font-semibold">עלות נמוכה יותר</div>
              </div>
            </div>
          </div>

          {/* Why It Works Better */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-blue-800 mb-6 text-center flex items-center justify-center gap-3">
              <Zap className="w-8 h-8" />
              למה זה עובד טוב יותר:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { icon: Calendar, text: "אין צורך בהכנת מסעדה ליום צילום" },
                { icon: Clock, text: "אין תלות בזמינות צלם" },
                { icon: Award, text: "תמונות עקביות לכל התפריט" },
                { icon: Sparkles, text: "עדכונים קלים למנות חדשות" }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-md">
                  <div className="bg-blue-100 rounded-full p-3">
                    <item.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-lg font-semibold text-slate-700">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Limited Offer */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-3xl p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-4 flex items-center justify-center gap-3">
                <Shield className="w-8 h-8" />
                הצעה מוגבלת:
              </h3>
              <p className="text-xl font-bold">
                "את/ה בין ה-15 האחרונים השבוע במחיר הזה"
              </p>
            </div>
          </div>

          {/* Full Guarantee */}
          <div className="bg-gradient-to-r from-[#8b1e3f] to-[#a91e4f] text-white rounded-3xl p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-4 flex items-center justify-center gap-3">
                <Shield className="w-8 h-8" />
                ערבות מלאה:
              </h3>
              <p className="text-xl font-bold">
                לא מרוצה? כסף בחזרה, ללא שאלות
              </p>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-8 text-center">
            <h3 className="text-2xl font-bold text-green-800 mb-6">
              עדיין יש שאלות?
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
