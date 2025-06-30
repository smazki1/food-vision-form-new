import React, { useEffect } from 'react';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface AffiliateRouteProps {
  children: React.ReactNode;
}

const AffiliateRoute: React.FC<AffiliateRouteProps> = ({ children }) => {
  const { role, isLoading, error } = useCurrentUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !error && role !== 'affiliate') {
      console.log('Access denied - user is not an affiliate. Redirecting to admin login.');
      navigate('/admin-login', { replace: true });
    }
  }, [role, isLoading, error, navigate]);

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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">שגיאה בבדיקת הרשאות</h2>
          <p className="text-gray-600 mb-4">לא ניתן לבדוק את הרשאות השותף</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  if (role !== 'affiliate') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">גישה נדחתה</h2>
          <p className="text-gray-600 mb-4">אין לך הרשאות שותף למערכת</p>
          <button 
            onClick={() => navigate('/admin-login')} 
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