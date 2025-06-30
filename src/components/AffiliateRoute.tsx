import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface AffiliateRouteProps {
  children: React.ReactNode;
}

const AffiliateRoute: React.FC<AffiliateRouteProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for affiliate session in localStorage
    const checkAffiliateSession = () => {
      console.log('=== AFFILIATE ROUTE CHECK ===');
      try {
        const affiliateSession = localStorage.getItem('affiliate_session');
        console.log('AffiliateRoute - raw session:', affiliateSession);
        
        if (affiliateSession) {
          const parsed = JSON.parse(affiliateSession);
          console.log('AffiliateRoute - parsed session:', parsed);
          
          if (parsed.affiliate_id && parsed.email) {
            console.log('AffiliateRoute - valid session found, authorizing access');
            setIsAuthorized(true);
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking affiliate session:', error);
      }
      
      // No valid session found
      console.log('AffiliateRoute - no valid session, redirecting to login');
      setIsAuthorized(false);
      setIsLoading(false);
      navigate('/customer/auth', { replace: true });
    };

    checkAffiliateSession();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">בודק הרשאות שותף...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">גישה נדחתה</h2>
          <p className="text-gray-600 mb-4">אין לך הרשאות שותף למערכת</p>
          <button 
            onClick={() => navigate('/customer/auth')} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            התחבר למערכת
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AffiliateRoute; 