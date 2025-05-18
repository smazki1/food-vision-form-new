import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import LoginCard from "@/components/customer/auth/LoginCard";
import LoadingSpinner from "@/components/customer/auth/LoadingSpinner";

/**
 * Customer login page updated to use the unified auth system
 */
const CustomerLogin: React.FC = () => {
  const [loginProcessing, setLoginProcessing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, loading, isAuthenticated, hasLinkedClientRecord } = useUnifiedAuth();
  
  // Determine where to navigate the user after successful login
  const getRedirectPath = () => {
    // Check for a specific redirect in location state
    const from = location.state?.from?.pathname;
    
    if (from) return from;
    
    // Otherwise route based on role
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'editor') return '/editor/dashboard';
    
    // For customers, check if they have a linked client record
    if (role === 'customer') {
      return hasLinkedClientRecord 
        ? '/customer/dashboard' 
        : '/account-setup';
    }
    
    // Default fallback
    return '/';
  };
  
  // Handle redirection when authentication state changes
  useEffect(() => {
    if (isAuthenticated && !loading && user) {
      const redirectPath = getRedirectPath();
      console.log(`[CustomerLogin] User authenticated as ${role}, redirecting to:`, redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, loading, user, role, hasLinkedClientRecord, navigate]);
  
  const handleLoginStart = () => setLoginProcessing(true);
  const handleLoginComplete = () => setLoginProcessing(false);

  // If still checking authentication status or processing login, show loading
  if (loading || loginProcessing) {
    return <LoadingSpinner message={loginProcessing ? "מתחבר..." : "טוען..."} />;
  }

  // If already authenticated, show loading with redirect message
  if (isAuthenticated && user) {
    return <LoadingSpinner message="מועב�� לדף הבית..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <LoginCard 
        onLoginStart={handleLoginStart} 
        onLoginComplete={handleLoginComplete} 
      />
    </div>
  );
};

export default CustomerLogin;
