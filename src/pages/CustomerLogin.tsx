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
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Brand Header with Enhanced Styling */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="flex items-center justify-center mb-6 group">
            <div className="relative">
              <img 
                src="/lovable-uploads/9f3cbbc2-d21d-46aa-a455-196f08dbe887.png" 
                alt="Food Vision Logo" 
                className="w-20 h-20 mr-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 drop-shadow-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-primary-FV/20 to-secondary-FV/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
            <h1 className="text-4xl font-heebo font-bold bg-gradient-to-r from-primary-FV via-primary-FV-dark to-secondary-FV bg-clip-text text-transparent">
              Food Vision
            </h1>
          </div>
          <p className="text-lg text-gray-600 font-inter font-medium leading-relaxed">פלטפורמה מתקדמת לעיבוד תמונות מנות</p>
        </div>
        
        {/* Enhanced Main Card */}
        <Card className="bg-white/90 backdrop-blur-xl shadow-strong border-0 rounded-3xl overflow-hidden transform transition-all duration-500 hover:shadow-glow animate-scale-in">
          {/* Modern Tabs */}
          <div className="flex w-full border-b border-gray-100 bg-gray-50/50">
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 py-5 sm:py-6 px-4 sm:px-8 text-center font-heebo font-bold text-sm sm:text-base md:text-lg transition-all duration-300 relative ${
                activeTab === 'login'
                  ? 'text-primary-FV bg-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
              style={{ minWidth: '160px' }}
            >
              <span className="relative z-10 whitespace-nowrap">התחברות</span>
              {activeTab === 'login' && (
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-FV to-secondary-FV rounded-t-full"></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-FV/5 to-secondary-FV/5 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <button
              onClick={() => switchTab('start')}
              className={`flex-1 py-5 sm:py-6 px-4 sm:px-8 text-center font-heebo font-bold text-sm sm:text-base md:text-lg transition-all duration-300 relative ${
                activeTab === 'start'
                  ? 'text-primary-FV bg-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
              style={{ minWidth: '160px' }}
            >
              <span className="relative z-10 whitespace-nowrap">התחל עכשיו</span>
              {activeTab === 'start' && (
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-FV to-secondary-FV rounded-t-full"></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-FV/5 to-secondary-FV/5 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
          
          {/* Enhanced Content */}
          <CardContent className="p-5 md:p-10">
            {activeTab === 'start' && (
              <div className="space-y-8 animate-fade-in">
                <CardHeader className="text-center p-0">
                  <CardTitle className="text-3xl font-heebo font-bold text-gray-900 mb-4 leading-tight">
                    שדרג את תמונות המנות שלך ✨
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600 font-inter leading-relaxed">
                    קבלו תמונות מקצועיות ומרהיבות למנות שלכם בקלות ובמהירות
                  </CardDescription>
                </CardHeader>
                
                {/* Enhanced Trial Package Card */}
                <div 
                  onClick={redirectToUpload}
                  className="relative bg-gradient-to-br from-primary-FV/8 via-white to-secondary-FV/8 border-2 border-primary-FV/20 rounded-2xl p-8 cursor-pointer group transition-all duration-500 hover:border-primary-FV/40 hover:shadow-strong hover:-translate-y-2 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-FV/5 to-secondary-FV/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-heebo font-bold text-gray-900">טעימה מהשירות</h3>
                      <span className="bg-gradient-to-r from-secondary-FV to-orange-400 text-white text-sm px-4 py-2 rounded-full font-inter font-semibold shadow-medium">
                        חינם לחלוטין
                      </span>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center group/item">
                        <p className="text-gray-700 font-inter text-lg leading-relaxed"> 3 תמונות מקצועיות בחינם  </p>
                      </div>
                      <div className="flex items-center group/item">
                        <p className="text-gray-700 font-inter text-lg leading-relaxed">עיבוד מהיר ברמה גבוהה  </p>
                      </div>
                      <div className="flex items-center group/item">
                        <p className="text-gray-700 font-inter text-lg leading-relaxed">תוצאות מרהיבות למנות שלך  </p>
                      </div>
                    </div>
                    
                    <Button className="w-full bg-gradient-to-r from-primary-FV to-primary-FV-dark hover:from-primary-FV-dark hover:to-primary-FV text-white font-inter font-semibold py-4 text-lg rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-glow relative overflow-hidden group/btn">
                      <span className="relative z-10">התחל/י עכשיו </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                    </Button>
                  </div>
                </div>
                
                {/* Enhanced Promo Box */}
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-2xl p-6 flex items-center transition-all duration-300 hover:shadow-medium hover:border-orange-300">
                  <div className="w-4 h-4 bg-gradient-to-br from-primary-FV to-secondary-FV rounded-full mr-4 flex-shrink-0 animate-float"></div>
                  <div>
                    <h4 className="font-inter font-bold text-orange-800 mb-2 text-lg">מבצע מיוחד </h4>
                    <p className="text-orange-700 font-inter leading-relaxed">הצטרפו כלקוחות וקבלו 15% הנחה על החבילה הראשונה</p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'login' && (
              <div className="space-y-8 animate-fade-in">
                <CardHeader className="text-center p-0">
                  <CardTitle className="text-3xl font-heebo font-bold text-gray-900 mb-4">
                    ברוכים הבאים! 👋
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600 font-inter leading-relaxed">
                    התחברו לחשבונכם כדי לנהל את המנות שלכם
                  </CardDescription>
                </CardHeader>
                
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-gray-700 font-inter font-semibold text-lg">
                      אימייל 📧
                    </Label>
                    <Input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="font-inter border-2 border-gray-200 focus:border-primary-FV focus:ring-primary-FV/20 rounded-xl py-4 text-lg transition-all duration-300 hover:border-gray-300"
                      placeholder="your@email.com"
                      required
                      dir="ltr"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="password" className="text-gray-700 font-inter font-semibold text-lg">
                      סיסמה 🔒
                    </Label>
                    <Input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="font-inter border-2 border-gray-200 focus:border-primary-FV focus:ring-primary-FV/20 rounded-xl py-4 text-lg transition-all duration-300 hover:border-gray-300"
                      placeholder="••••••••"
                      required
                      dir="ltr"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-primary-FV to-primary-FV-dark hover:from-primary-FV-dark hover:to-primary-FV text-white font-inter font-semibold py-4 text-lg rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-glow relative overflow-hidden group"
                  >
                    <span className="relative z-10">
                      {isLoading ? 'מתחבר... ⏳' : 'התחברות ✨'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Button>
                  
                  <div className="text-center">
                    <button 
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-primary-FV hover:text-primary-FV-dark font-inter font-medium transition-all duration-300 hover:underline text-lg"
                    >
                      שכחת סיסמה? 🔑
                    </button>
                  </div>
                </form>
                
                <div className="relative">
                  <Separator className="my-8" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-gray-500 font-inter text-lg">או</span>
                </div>
                
                {/* Enhanced Admin/Team Access */}
                <div 
                  onClick={selectUserType}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-6 hover:border-primary-FV/30 hover:bg-gradient-to-br hover:from-primary-FV/5 hover:to-secondary-FV/5 transition-all duration-300 cursor-pointer text-center group transform hover:scale-105 hover:shadow-medium"
                >
                  <h4 className="font-inter font-bold text-gray-800 mb-2 text-xl group-hover:text-primary-FV transition-colors duration-300">👥 צוות / אדמין</h4>
                  <p className="text-gray-600 font-inter text-lg leading-relaxed">כניסה למערכת הניהול המקצועית</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Footer */}
        <div className="text-center mt-12 animate-fade-in">
          <p className="text-gray-500 font-inter text-lg leading-relaxed">
            © 2025 Food Vision. כל הזכויות שמורות. 💖
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
