import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { toast } from 'sonner';

const CustomerLogin = () => {
  // Tabs state management
  const [activeTab, setActiveTab] = useState<'start' | 'login'>('start');
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { signIn, resetPassword } = useUnifiedAuth();

  // Functions
  const switchTab = (tab: 'start' | 'login') => setActiveTab(tab);
  
  const redirectToUpload = () => {
    navigate('/customer/upload');
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
    <div dir="rtl" className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 right-10 w-24 h-24 rounded-full bg-red-900 opacity-10 animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-36 h-36 rounded-full bg-orange-500 opacity-10 animate-pulse"></div>
      <div className="absolute top-1/3 left-1/4 w-12 h-12 rounded-full bg-orange-500 opacity-5"></div>
      <div className="absolute bottom-1/3 right-1/4 w-16 h-16 rounded-full bg-red-900 opacity-5"></div>
      
      <div className="w-full max-w-lg">
        {/* Logo header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">
            Food Vision <span className="inline-block bg-gradient-to-r from-red-900 to-orange-500 text-white text-sm px-2 py-1 rounded-md mr-1 ml-1">FV</span>
          </h1>
        </div>
        
        {/* Main container */}
        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden">
          {/* Gradient top border */}
          <div className="h-2 bg-gradient-to-l from-red-900 to-orange-500"></div>
          
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-300 ${
                activeTab === 'login'
                  ? 'text-red-900 border-b-2 border-red-900'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              התחברות
            </button>
            <button
              onClick={() => switchTab('start')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-300 ${
                activeTab === 'start'
                  ? 'text-red-900 border-b-2 border-red-900'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              התחל עכשיו
            </button>
          </div>
          
          {/* Tab content */}
          <div className="p-8">
            {activeTab === 'start' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-center text-gray-800">
                  שדרג את תמונות המנות שלך עכשיו
                </h2>
                
                {/* Trial package card */}
                <div 
                  onClick={redirectToUpload}
                  className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">חבילת ניסיון</h3>
                    <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full animate-pulse">
                      חינם לחלוטין
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <p className="text-gray-700">קבל 3 תמונות מקצועיות בחינם</p>
                    </div>
                    <div className="flex items-center">
                      <p className="text-gray-700">עיבוד מהיר ברמה גבוהה</p>
                    </div>
                    <div className="flex items-center">
                      <p className="text-gray-700">תוצאות מרהיבות למנות שלך</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <button className="bg-gradient-to-r from-red-900 to-orange-500 text-white py-3 px-6 rounded-lg font-medium hover:opacity-90 transition-all duration-300 group-hover:shadow-md w-full">
                      התחל עכשיו
                    </button>
                  </div>
                </div>
                
                {/* Promo box */}
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center">
                  <div className="ml-2 w-8 h-8 flex-shrink-0 bg-gradient-to-br from-red-900 to-orange-500 rounded-full"></div>
                  <div>
                    <h4 className="font-medium text-orange-800">מבצע מיוחד</h4>
                    <p className="text-sm text-orange-700">הצטרפו כלקוחות וקבלו 15% הנחה על החבילה הראשונה</p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'login' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                  ברוכים הבאים
                </h2>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      אימייל
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900 text-right"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      סיסמה
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-900 focus:border-red-900 text-right"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-red-900 to-orange-500 text-white py-3 px-6 rounded-lg font-medium hover:opacity-90 transition-all duration-300"
                    >
                      {isLoading ? 'מתחבר...' : 'התחברות'}
                    </button>
                  </div>
                  
                  <div className="text-center">
                    <button 
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-red-900 hover:underline"
                    >
                      שכחת סיסמה?
                    </button>
                  </div>
                </form>
                
                <div className="relative flex items-center mt-6">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className="flex-shrink mx-4 text-gray-500 text-sm">או</span>
                  <div className="flex-grow border-t border-gray-300"></div>
                </div>
                
                {/* Team/Admin card */}
                <div 
                  onClick={selectUserType}
                  className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5 hover:border-red-900 transition-all duration-300 cursor-pointer text-center"
                >
                  <h4 className="font-bold text-gray-800">צוות / אדמין</h4>
                  <p className="text-sm text-gray-600 mt-1">כניסה למערכת הניהול המקצועית</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
