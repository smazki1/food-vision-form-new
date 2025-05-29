
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { toast } from "sonner";

/**
 * Redesigned customer login page with modern UI
 */
const CustomerLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'start'>('start');
  
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn, user, loading: authLoading, isAuthenticated, initialized } = useUnifiedAuth();

  // Get the redirect path from location state, or default to dashboard
  const from = location.state?.from?.pathname || "/customer/dashboard";

  // Check if already authenticated and redirect
  useEffect(() => {
    if (initialized && !authLoading && isAuthenticated && user) {
      console.log("[CustomerLogin] User already authenticated, redirecting to:", from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, initialized, authLoading, user, navigate, from]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      const { success, error } = await signIn(email, password);

      if (success) {
        toast.success("ההתחברות בוצעה בהצלחה");
        // Navigation will be handled by useEffect above
      } else {
        toast.error(error || "שם משתמש או סיסמה שגויים");
      }
    } catch (error) {
      console.error("[CustomerLogin] Login error:", error);
      toast.error("שגיאה בהתחברות");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetFreePhotos = () => {
    navigate('/public-upload');
  };

  const handleForgotPassword = () => {
    const phoneNumber = "+972527772807";
    const message = encodeURIComponent("שלום, שכחתי את הסיסמה שלי ואני זקוק לעזרה.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  // Show loading spinner while checking auth state
  if (!initialized || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If already authenticated, show redirect message
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p>מועבר לדף הבית...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center relative overflow-hidden" dir="rtl">
      {/* Background decorations */}
      <div className="absolute w-[500px] h-[500px] rounded-full opacity-5 bg-[#8b1e3f] blur-[100px] -top-[200px] -left-[200px] animate-pulse"></div>
      <div className="absolute w-[500px] h-[500px] rounded-full opacity-5 bg-[#f5752b] blur-[100px] -bottom-[200px] -right-[200px] animate-pulse"></div>
      
      {/* Floating shapes */}
      <div className="absolute w-20 h-20 bg-[#f5752b] opacity-8 top-[15%] right-[10%] animate-bounce" 
           style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}></div>
      <div className="absolute w-15 h-15 bg-[#8b1e3f] opacity-8 bottom-[25%] left-[8%] rounded-full animate-bounce" 
           style={{ animationDelay: '2s' }}></div>
      <div className="absolute w-25 h-25 bg-gray-100 opacity-5 top-[50%] left-[15%] rounded-full animate-bounce"
           style={{ animationDelay: '4s' }}></div>

      <div className="w-full max-w-6xl px-5 relative z-10">
        {/* Logo */}
        <div className="text-center mb-10 animate-fadeIn">
          <h1 className="text-5xl md:text-6xl font-bold text-[#8b1e3f] mb-2" style={{ textShadow: '0 2px 10px rgba(139, 30, 63, 0.1)' }}>
            Food Vision{' '}
            <span className="bg-gradient-to-br from-[#8b1e3f] to-[#a02850] text-white px-3 py-1 rounded text-lg ml-2 shadow-lg">
              FV
            </span>
          </h1>
        </div>

        {/* Auth Container */}
        <div className="bg-white rounded-[20px] shadow-2xl overflow-hidden max-w-lg mx-auto relative animate-fadeIn">
          {/* Gradient top border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8b1e3f] to-[#f5752b]"></div>
          
          {/* Tabs */}
          <div className="flex bg-[rgba(250,250,250,0.8)] backdrop-blur border-b border-[rgba(224,224,224,0.5)]">
            <button
              className={`flex-1 py-5 px-4 text-center font-medium text-base transition-all duration-300 relative ${
                activeTab === 'start' 
                  ? 'text-[#8b1e3f] bg-white' 
                  : 'text-gray-600 hover:bg-[rgba(255,255,255,0.8)]'
              }`}
              onClick={() => setActiveTab('start')}
            >
              התחל עכשיו
              {activeTab === 'start' && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-1 bg-[#8b1e3f] transition-all duration-300"></div>
              )}
            </button>
            <button
              className={`flex-1 py-5 px-4 text-center font-medium text-base transition-all duration-300 relative ${
                activeTab === 'login' 
                  ? 'text-[#8b1e3f] bg-white' 
                  : 'text-gray-600 hover:bg-[rgba(255,255,255,0.8)]'
              }`}
              onClick={() => setActiveTab('login')}
            >
              התחברות
              {activeTab === 'login' && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-1 bg-[#8b1e3f] transition-all duration-300"></div>
              )}
            </button>
          </div>

          {/* Content */}
          <div className="p-10 bg-white">
            {/* Start Tab */}
            {activeTab === 'start' && (
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-semibold text-gray-800 mb-3 text-center">התחילו את המסע שלכם</h2>
                <p className="text-gray-600 mb-8 text-center">גלו איך Food Vision יכול לשדרג את המנות שלכם</p>
                
                <div className="space-y-4">
                  <div 
                    className="border-2 border-gray-200 rounded-2xl p-6 cursor-pointer transition-all duration-300 bg-white relative overflow-hidden hover:border-[#8b1e3f] hover:bg-[#faf5f7] hover:-translate-y-1 hover:shadow-lg group"
                    onClick={handleGetFreePhotos}
                  >
                    <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-[rgba(139,30,63,0.05)] to-transparent transition-all duration-500 group-hover:left-full"></div>
                    <div className="relative">
                      <span className="bg-[#f5752b] text-white px-3 py-1 rounded-full text-sm inline-block mb-3 animate-pulse">
                        🎁 חבילת ניסיון חינמית
                      </span>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">🍽️ קבלו 3 תמונות בחינם</h4>
                      <p className="text-gray-600 text-sm">
                        גלו איך Food Vision יכול לשדרג את המנות שלכם עם 3 צילומי מנות חינם
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA Box */}
                <div className="bg-gradient-to-br from-[#faf5f7] to-[#fff8f5] p-6 rounded-2xl text-center mt-8 border border-[rgba(139,30,63,0.1)] relative overflow-hidden">
                  <div className="absolute -top-5 -right-5 text-6xl opacity-10 transform -rotate-12">🎁</div>
                  <div className="relative">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">מבצע מיוחד לזמן מוגבל!</h3>
                    <p className="text-gray-600 text-sm">
                      הצטרפו עכשיו וקבלו 3 מנות במתנה בחבילה הראשונה + הנחה על החבילה הבאה
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Login Tab */}
            {activeTab === 'login' && (
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">ברוך הבא חזרה!</h2>
                
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <label className="block mb-2 text-gray-700 font-medium">אימייל</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@restaurant.com"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 bg-[#fafafa] focus:outline-none focus:border-[#8b1e3f] focus:bg-white focus:shadow-[0_0_0_4px_rgba(139,30,63,0.1)]"
                      required
                      dir="ltr"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-gray-700 font-medium">סיסמה</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 bg-[#fafafa] focus:outline-none focus:border-[#8b1e3f] focus:bg-white focus:shadow-[0_0_0_4px_rgba(139,30,63,0.1)]"
                      required
                      dir="ltr"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 border-none rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 mt-5 relative overflow-hidden bg-gradient-to-br from-[#8b1e3f] to-[#a02850] text-white shadow-[0_4px_20px_rgba(139,30,63,0.2)] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(139,30,63,0.3)] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                        מתחבר...
                      </div>
                    ) : (
                      "התחבר"
                    )}
                  </button>
                </form>

                <div className="text-center mt-5">
                  <button
                    onClick={handleForgotPassword}
                    className="text-[#8b1e3f] text-sm hover:underline focus:outline-none"
                  >
                    שכחת סיסמה?
                  </button>
                </div>

                <div className="text-center my-8 relative">
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                  <span className="bg-white px-4 relative text-gray-600">או</span>
                </div>

                <div className="border-2 border-gray-200 rounded-2xl p-5 text-center cursor-pointer transition-all duration-300 bg-white relative overflow-hidden hover:border-[#8b1e3f] hover:bg-[#faf5f7] hover:-translate-y-1 hover:shadow-lg group">
                  <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-[rgba(139,30,63,0.05)] to-transparent transition-all duration-500 group-hover:left-full"></div>
                  <div className="relative">
                    <h4 className="text-gray-800 font-semibold mb-2">👨‍💼 צוות / אדמין</h4>
                    <p className="text-gray-600 text-sm">גישה לניהול המערכת ועריכת תמונות</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CustomerLogin;
