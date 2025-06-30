import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client'; // Corrected path
import { toast } from 'sonner'; // For displaying notifications

// TODO: Import Supabase client and any necessary auth hooks or utility functions
// import { supabase } from '@/integrations/supabase'; 
// import { useAuth } from '@/hooks/useAuth'; // Example, adjust as needed

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'demo'>('login');
  const navigate = useNavigate();

  // TODO: Add state for form inputs (email, password), loading, and errors
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First check if this is an affiliate login (using public function to bypass RLS)
      console.log('Checking affiliate login for email:', email);
      const { data: affiliateLoginData, error: affiliateLoginError } = await supabase
        .rpc('verify_affiliate_login' as any, {
          input_email: email,
          input_password: password
        });

      console.log('Affiliate verification result:', { affiliateLoginData, affiliateLoginError });

      const affiliateResults = affiliateLoginData as any[];
      if (!affiliateLoginError && affiliateResults && affiliateResults.length > 0) {
        const affiliate = affiliateResults[0];
        console.log('Affiliate found:', affiliate);
        
        if (affiliate.is_valid) {
          // Store affiliate info in localStorage for the session
          const sessionData = {
            affiliate_id: affiliate.affiliate_id,
            email: affiliate.email,
            name: affiliate.name
          };
          
          console.log('Storing affiliate session:', sessionData);
          localStorage.setItem('affiliate_session', JSON.stringify(sessionData));
          
          // Verify it was stored
          const storedSession = localStorage.getItem('affiliate_session');
          console.log('Verified stored session:', storedSession);
          
          console.log('Affiliate login successful, redirecting to dashboard');
          toast.success('התחברות שותף בוצעה בהצלחה!');
          navigate('/affiliate/dashboard');
          setIsLoading(false);
          return;
        } else {
          console.log('Invalid password for affiliate');
          toast.error('שם משתמש או סיסמה שגויים');
          setIsLoading(false);
          return;
        }
      } else {
        console.log('No affiliate found with this email, proceeding with regular auth');
      }

      // If not affiliate, proceed with regular Supabase auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Auth Error:', authError);
        toast.error(authError.message || 'התחברות נכשלה. בדקו אימייל וסיסמה ונסו שנית.');
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error('לא התקבל מידע משתמש לאחר ההתחברות.');
        setIsLoading(false);
        return;
      }

      const user = authData.user;

      // 1. Check user role (Admin/Editor)
      console.log('Checking user role for:', user.id);
      const { data: roleData, error: roleError } = await supabase.rpc('get_my_role');
      
      console.log('Role check result:', { roleData, roleError });
      
      if (roleError) {
        console.error('Role RPC Error:', roleError);
        // Try direct query as fallback
        const { data: directRoleData, error: directRoleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
          
        console.log('Direct role check:', { directRoleData, directRoleError });
        
        if (directRoleData?.role === 'admin') {
          toast.success('התחברות אדמין בוצעה בהצלחה!');
          navigate('/admin/dashboard');
          setIsLoading(false);
          return;
        }
        
        if (directRoleData?.role === 'editor') {
          toast.success('התחברות עורך בוצעה בהצלחה!');
          navigate('/editor');
          setIsLoading(false);
          return;
        }
      } else {
        const userRole = roleData as string;
        console.log('User role from RPC:', userRole);

        if (userRole === 'admin') {
          toast.success('התחברות אדמין בוצעה בהצלחה!');
          navigate('/admin/dashboard');
          setIsLoading(false);
          return;
        }

        if (userRole === 'editor') {
          toast.success('התחברות עורך בוצעה בהצלחה!');
          navigate('/editor');
          setIsLoading(false);
          return;
        }
      }

      // 2. Check if existing client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('client_id')
        .eq('user_auth_id', user.id)
        .single();

      if (clientError && clientError.code !== 'PGRST116') { // PGRST116: no rows found
        console.error('Client Check Error:', clientError);
        toast.error('שגיאה בבדיקת נתוני לקוח.');
        setIsLoading(false);
        return;
      }

      if (clientData) {
        toast.success('התחברות לקוח בוצעה בהצלחה!');
        navigate('/customer/dashboard'); // Or /customer/home
        setIsLoading(false);
        return;
      }

      // 3. Check if existing lead or create new lead
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('lead_id')
        .eq('email', user.email) // Assuming user.email is available and correct
        .single();

      if (leadError && leadError.code !== 'PGRST116') {
        console.error('Lead Check Error:', leadError);
        toast.error('שגיאה בבדיקת נתוני ליד.');
        setIsLoading(false);
        return;
      }

      if (leadData) {
        toast.info('נמצאת כליד קיים. מועברת לטופס הגשה.');
        navigate('/public-upload');
      } else {
        // Create new lead record
        const { error: newLeadError } = await supabase
          .from('leads')
          .insert({ 
            contact_name: user.email?.split('@')[0] || 'New User',
            email: user.email,
            phone: '',
            restaurant_name: 'New Restaurant',
            status: 'new_login_lead'
          });

        if (newLeadError) {
          console.error('New Lead Creation Error:', newLeadError);
          toast.error('שגיאה ביצירת רשומת ליד חדשה.');
          setIsLoading(false);
          return;
        }
        toast.success('ברוכה הבאה! נוצרה רשומת ליד חדשה. מועברת לטופס הגשה.');
        navigate('/public-upload');
      }

    } catch (error: any) {
      console.error('Login Process Error:', error);
      toast.error(error.message || 'אירעה שגיאה בתהליך ההתחברות.');
    }
    setIsLoading(false);
  };

  const handleNewRestaurantOwner = () => {
    navigate('/public-upload');
  };

  const handleExistingCustomer = () => {
    setActiveTab('login');
  };
  
  const commonInputClass = "w-full p-3 pr-10 border-2 border-gray-200 rounded-lg text-right focus:border-primary-FV focus:ring-primary-FV placeholder-gray-400 text-gray-700";
  const commonLabelClass = "block mb-2 text-right text-gray-700 font-medium";
  const commonButtonClass = "w-full py-3 px-4 rounded-lg font-semibold transition-colors duration-300 text-lg";

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 selection:bg-primary-FV/20" dir="rtl">
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-primary-FV">
          Food Vision <span className="bg-primary-FV text-white text-lg sm:text-xl px-2.5 py-1 rounded-md ml-1 sm:ml-2 align-middle">FV</span>
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-md mx-auto">
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            className={`flex-1 p-4 sm:p-5 text-center font-medium text-base sm:text-lg transition-colors duration-300 focus:outline-none
              ${activeTab === 'login' ? 'text-primary-FV border-b-[3px] border-primary-FV bg-white' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('login')}
          >
            התחברות
          </button>
          <button
            type="button"
            className={`flex-1 p-4 sm:p-5 text-center font-medium text-base sm:text-lg transition-colors duration-300 focus:outline-none
              ${activeTab === 'demo' ? 'text-primary-FV border-b-[3px] border-primary-FV bg-white' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('demo')}
          >
            הגשה למסעדה קיימת
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {/* Login Tab Content */}
          {activeTab === 'login' && (
            <div className="animate-fadeIn">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6 text-center">ברוכות הבאות!</h2>
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="relative">
                  <label htmlFor="email-login" className={commonLabelClass}>אימייל</label>
                  <Mail className="absolute left-3 top-[46px] sm:top-[48px] transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                  <input
                    type="email"
                    id="email-login"
                    placeholder="name@restaurant.com"
                    className={commonInputClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="relative">
                  <label htmlFor="password-login" className={commonLabelClass}>סיסמה</label>
                  <Lock className="absolute left-3 top-[46px] sm:top-[48px] transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                  <input
                    type="password"
                    id="password-login"
                    placeholder="••••••••"
                    className={commonInputClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className={`${commonButtonClass} bg-primary-FV text-white hover:bg-primary-FV-dark focus:outline-none focus:ring-2 focus:ring-primary-FV focus:ring-offset-2 ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'מתחברות...' : 'התחברות'}
                </button>
              </form>

              <div className="text-center mt-5">
                <a
                  href="https://wa.me/972535238997"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-FV hover:underline focus:outline-none focus:ring-1 focus:ring-primary-FV rounded"
                >
                  נתקלתן בבעיה? צרו קשר
                </a>
              </div>

              <div className="my-6 sm:my-8 flex items-center">
                <hr className="flex-grow border-t border-gray-300" />
                <span className="px-3 sm:px-4 text-sm text-gray-500">או</span>
                <hr className="flex-grow border-t border-gray-300" />
              </div>

              <div className="bg-gray-50 p-5 sm:p-6 rounded-lg text-center border border-gray-200">
                <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-1">��‍💼 צוות / אדמין</h4>
                <p className="text-xs sm:text-sm text-gray-600">גישה לניהול המערכת</p>
              </div>
            </div>
          )}

          {/* Demo/Start Now Tab Content */}
          {activeTab === 'demo' && (
            <div className="text-center animate-fadeIn">
              <button
                type="button"
                onClick={handleNewRestaurantOwner}
                className="w-full p-6 sm:p-8 border-2 border-primary-FV rounded-xl text-center bg-primary-FV text-white hover:bg-primary-FV-dark focus:outline-none focus:ring-2 focus:ring-primary-FV/50 transition-all duration-300 font-semibold text-lg sm:text-xl"
              >
                לחץ/י כאן למעבר לטופס
              </button>
            </div>
          )}
        </div>
      </div>
      
      <footer className="text-center mt-8 sm:mt-10 text-xs sm:text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Food Vision. כל הזכויות שמורות.</p>
        {/* Optional: Add links to Privacy Policy / Terms */}
      </footer>
    </div>
  );
};

export default LoginPage;

// Define primary and secondary colors in tailwind.config.ts if not already present
// For example:
// theme: {
//   extend: {
//     colors: {
//       'primary-FV': '#8b1e3f',
//       'primary-FV-dark': '#721832', // For hover
//       'secondary-FV': '#f5752b',
//     },
//   },
// }, 