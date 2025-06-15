import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { toast } from 'sonner';

interface EditorRouteProps {
  children: React.ReactNode;
}

const EditorRoute: React.FC<EditorRouteProps> = ({ children }) => {
  const { 
    isEditor,
    isLoading,
    status,
    error,
    role 
  } = useCurrentUserRole();
  const location = useLocation();

  // Loading state
  if (isLoading && ['INITIALIZING', 'CHECKING_SESSION', 'FETCHING_ROLE'].includes(status)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-3 text-muted-foreground">
          Verifying editor access...
        </p>
      </div>
    );
  }

  // Handle auth errors
  if (error && (status === 'ERROR_SESSION' || status === 'ERROR_FETCHING_ROLE')) {
    console.error('[EditorRoute] Auth error:', error);
    toast.error(`Authentication error: ${error}. Please try logging in again.`);
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }
  
  // Check editor access only
  if (!isEditor) {
    console.warn('[EditorRoute] Access Denied. User is not an editor. Role:', role);
    toast.error("Access Denied: You do not have editor privileges.");
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default EditorRoute; 