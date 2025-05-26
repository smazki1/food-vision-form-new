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
      const { data: roleData, error: roleError } = await supabase.rpc('get_my_role');
      
      if (roleError) {
        console.error('Role RPC Error:', roleError);
        // Fallback or generic error, but proceed to check client/lead if role check fails but auth succeeded
        // This might happen if RLS on rpc is not set up for a new user before role is assigned.
        // However, get_my_role is security definer, so it should generally work if the user is authenticated.
        toast.warning('לא ניתן היה לאמת את תפקיד המשתמש. מנסה המשך התחברות...');
      }

      const userRole = roleData as string; // Type assertion, ensure your RPC returns a string

      if (userRole === 'admin') {
        toast.success('התחברות אדמין בוצעה בהצלחה!');
        navigate('/admin/dashboard');
        setIsLoading(false);
        return;
      }

      if (userRole === 'editor') {
        toast.success('התחברות עורך בוצעה בהצלחה!');
        navigate('/editor/dashboard');
        setIsLoading(false);
        return;
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
        navigate('/submit-dishes');
      } else {
        // Create new lead record
        const { error: newLeadError } = await supabase
          .from('leads')
          .insert({ email: user.email, status: 'new_login_lead' }); // Add other fields as necessary

        if (newLeadError) {
          console.error('New Lead Creation Error:', newLeadError);
          toast.error('שגיאה ביצירת רשומת ליד חדשה.');
          setIsLoading(false);
          return;
        }
        toast.success('ברוכה הבאה! נוצרה רשומת ליד חדשה. מועברת לטופס הגשה.');
        navigate('/submit-dishes');
      }

    } catch (error: any) {
      console.error('Login Process Error:', error);
      toast.error(error.message || 'אירעה שגיאה בתהליך ההתחברות.');
    }
    setIsLoading(false);
  };

  const handleNewRestaurantOwner = () => {
    navigate('/submit-dishes');
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
            התחילו עכשיו
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
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">התחילו את המסע שלכן</h2>
              <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">בחרו את סוג החשבון שלכן</p>

              <div className="space-y-4 sm:space-y-5">
                <button
                  type="button"
                  onClick={handleNewRestaurantOwner}
                  className="w-full p-4 sm:p-5 border-2 border-gray-200 rounded-xl text-right hover:border-primary-FV hover:bg-primary-FV/5 focus:outline-none focus:ring-2 focus:ring-primary-FV/50 transition-all duration-300 group"
                >
                  <h4 className="text-md sm:text-lg font-semibold text-gray-700 mb-1 group-hover:text-primary-FV">🍽️ בעלות עסק חדש?</h4>
                  <p className="text-xs sm:text-sm text-gray-600 group-hover:text-primary-FV">קבלו חבילת ניסיון חינמית וגלו איך FoodVision יכול לשדרג את המנות שלכםן.</p>
                </button>

                <button
                  type="button"
                  onClick={handleExistingCustomer}
                  className="w-full p-4 sm:p-5 border-2 border-gray-200 rounded-xl text-right hover:border-primary-FV hover:bg-primary-FV/5 focus:outline-none focus:ring-2 focus:ring-primary-FV/50 transition-all duration-300 group"
                >
                  <h4 className="text-md sm:text-lg font-semibold text-gray-700 mb-1 group-hover:text-primary-FV">👥 לקוחות קיימות?</h4>
                  <p className="text-xs sm:text-sm text-gray-600 group-hover:text-primary-FV">יש לכן כבר חבילה? היכנסו לחשבונכן.</p>
                </button>
              </div>
              
              {/* Example: Special Offer Box - uncomment and style if needed */}
              {/* <div className="mt-6 sm:mt-8 bg-secondary-FV/10 p-5 sm:p-6 rounded-lg text-center border border-secondary-FV/30">
                <h3 className="text-lg sm:text-xl font-semibold text-secondary-FV mb-2">🎁 מבצע מיוחד!</h3>
                <p className="text-sm sm:text-base text-secondary-FV/80">הצטרפו עכשיו וקבלו 7 מנות במתנה בחבילה הראשונה!</p>
              </div> */}
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