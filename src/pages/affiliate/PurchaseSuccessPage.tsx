import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight, Mail, Phone } from 'lucide-react';

const PurchaseSuccessPage: React.FC = () => {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate('/affiliate/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6" dir="rtl">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-yellow-800">
            תודה על הרכישה!
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Pending Message */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <h3 className="font-semibold text-yellow-900 mb-3">החבילה ממתינה לאישור</h3>
            
            <p className="text-yellow-800 mb-4">
              תשלומך התקבל בהצלחה! החבילה שרכשת ממתינה כעת לאישור מנהל המערכת.
            </p>
            
            <div className="space-y-2 text-sm text-yellow-700">
              <p>• הצוות שלנו יבדוק את הרכישה תוך 24 שעות</p>
              <p>• תקבל הודעה ברגע שהחבילה תתווסף לחשבון שלך</p>
              <p>• לא נדרשת פעילות נוספת מצדך</p>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3">מה קורה הלאה?</h4>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  1
                </div>
                <p className="text-sm text-blue-800">
                  מנהל המערכת יקשר את הרכישה לחשבון השותף שלך
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  2
                </div>
                <p className="text-sm text-blue-800">
                  החבילה תתווסף אוטומטית לחשבון שלך
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  3
                </div>
                <p className="text-sm text-blue-800">
                  תוכל להתחיל להקצות תמונות ללקוחות
                </p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">נתקלת בבעיה?</h4>
            
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>admin@foodvision.co.il</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>050-123-4567</span>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <Button onClick={handleContinue} className="w-full" size="lg">
            <ArrowRight className="w-4 h-4 mr-2" />
            חזור לדאשבורד השותף
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseSuccessPage; 