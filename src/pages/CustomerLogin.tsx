
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const CustomerLogin = () => {
  const [activeTab, setActiveTab] = useState<'start' | 'login'>('start');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { signIn, resetPassword } = useUnifiedAuth();

  const switchTab = (tab: 'start' | 'login') => setActiveTab(tab);
  
  const redirectToUpload = () => {
    navigate('/public-upload');
  };
  
  const selectUserType = () => {
    navigate('/admin-login');
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { success, error } = await signIn(email, password);
      
      if (success) {
        toast.success('התחברת בהצלחה');
        navigate('/customer/dashboard');
      } else {
        toast.error(error || 'שם המשתמש או הסיסמה אינם נכונים');
      }
    } catch (error: any) {
      toast.error('התרחשה שגיאה בתהליך ההתחברות');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('יש להזין כתובת אימייל תחילה');
      return;
    }

    setIsLoading(true);
    
    try {
      const { success, error } = await resetPassword(email);
      
      if (success) {
        toast.success('נשלח לך אימייל עם הוראות לאיפוס הסיסמה');
      } else {
        toast.error(error || 'לא ניתן לאפס סיסמה לאימייל זה');
      }
    } catch (error: any) {
      toast.error('התרחשה שגיאה בתהליך איפוס הסיסמה');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/lovable-uploads/9f3cbbc2-d21d-46aa-a455-196f08dbe887.png" 
              alt="Food Vision Logo" 
              className="w-16 h-16 mr-3"
            />
            <h1 className="text-3xl font-display font-bold text-gray-900">
              Food Vision
            </h1>
          </div>
          <p className="text-gray-600 font-inter">פלטפורמה מתקדמת לעיבוד תמונות מנות</p>
        </div>
        
        {/* Main Card */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
          {/* Tabs */}
          <div className="flex border-b border-gray-200/50">
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 py-4 px-6 text-center font-inter font-medium transition-all duration-300 ${
                activeTab === 'login'
                  ? 'text-primary-FV border-b-2 border-primary-FV bg-primary-FV/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
              }`}
            >
              התחברות
            </button>
            <button
              onClick={() => switchTab('start')}
              className={`flex-1 py-4 px-6 text-center font-inter font-medium transition-all duration-300 ${
                activeTab === 'start'
                  ? 'text-primary-FV border-b-2 border-primary-FV bg-primary-FV/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
              }`}
            >
              התחל עכשיו
            </button>
          </div>
          
          {/* Tab Content */}
          <CardContent className="p-8">
            {activeTab === 'start' && (
              <div className="space-y-6">
                <CardHeader className="text-center p-0">
                  <CardTitle className="text-2xl font-display text-gray-900 mb-2">
                    שדרג את תמונות המנות שלך
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-inter">
                    קבל תמונות מקצועיות ומרהיבות למנות שלך בקלות ובמהירות
                  </CardDescription>
                </CardHeader>
                
                {/* Trial Package Card */}
                <div 
                  onClick={redirectToUpload}
                  className="bg-gradient-to-r from-primary-FV/5 to-secondary-FV/5 border-2 border-primary-FV/20 rounded-xl p-6 hover:shadow-lg hover:border-primary-FV/40 transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-display font-semibold text-gray-900">חבילת ניסיון</h3>
                    <span className="bg-secondary-FV text-white text-xs px-3 py-1 rounded-full font-inter font-medium">
                      חינם לחלוטין
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-primary-FV rounded-full mr-3"></div>
                      <p className="text-gray-700 font-inter">3 תמונות מקצועיות בחינם</p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-primary-FV rounded-full mr-3"></div>
                      <p className="text-gray-700 font-inter">עיבוד מהיר ברמה גבוהה</p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-primary-FV rounded-full mr-3"></div>
                      <p className="text-gray-700 font-inter">תוצאות מרהיבות למנות שלך</p>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-primary-FV to-primary-FV-dark hover:from-primary-FV-dark hover:to-primary-FV text-white font-inter font-medium py-3 rounded-lg transition-all duration-300 group-hover:shadow-md">
                    התחל עכשיו
                  </Button>
                </div>
                
                {/* Promo Box */}
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center">
                  <div className="w-3 h-3 bg-gradient-to-br from-primary-FV to-secondary-FV rounded-full mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-inter font-medium text-orange-800 mb-1">מבצע מיוחד</h4>
                    <p className="text-sm text-orange-700 font-inter">הצטרפו כלקוחות וקבלו 15% הנחה על החבילה הראשונה</p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'login' && (
              <div className="space-y-6">
                <CardHeader className="text-center p-0">
                  <CardTitle className="text-2xl font-display text-gray-900 mb-2">
                    ברוכים הבאים
                  </CardTitle>
                  <CardDescription className="text-gray-600 font-inter">
                    התחברו לחשבונכם כדי לנהל את המנות שלכם
                  </CardDescription>
                </CardHeader>
                
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-inter font-medium">
                      אימייל
                    </Label>
                    <Input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="font-inter border-gray-200 focus:border-primary-FV focus:ring-primary-FV/20 rounded-lg"
                      placeholder="your@email.com"
                      required
                      dir="ltr"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-inter font-medium">
                      סיסמה
                    </Label>
                    <Input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="font-inter border-gray-200 focus:border-primary-FV focus:ring-primary-FV/20 rounded-lg"
                      placeholder="••••••••"
                      required
                      dir="ltr"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-primary-FV to-primary-FV-dark hover:from-primary-FV-dark hover:to-primary-FV text-white font-inter font-medium py-3 rounded-lg transition-all duration-300"
                  >
                    {isLoading ? 'מתחבר...' : 'התחברות'}
                  </Button>
                  
                  <div className="text-center">
                    <button 
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-primary-FV hover:text-primary-FV-dark font-inter transition-colors"
                    >
                      שכחת סיסמה?
                    </button>
                  </div>
                </form>
                
                <div className="relative">
                  <Separator className="my-6" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm text-gray-500 font-inter">או</span>
                </div>
                
                {/* Admin/Team Access */}
                <div 
                  onClick={selectUserType}
                  className="bg-gray-50/50 border-2 border-gray-200 rounded-xl p-5 hover:border-primary-FV/30 hover:bg-primary-FV/5 transition-all duration-300 cursor-pointer text-center"
                >
                  <h4 className="font-inter font-semibold text-gray-800 mb-1">צוות / אדמין</h4>
                  <p className="text-sm text-gray-600 font-inter">כניסה למערכת הניהול המקצועית</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 font-inter">
            © 2024 Food Vision. כל הזכויות שמורות.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
