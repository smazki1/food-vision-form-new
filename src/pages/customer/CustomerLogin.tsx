
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import LoginCard from "@/components/customer/auth/LoginCard";
import LoadingSpinner from "@/components/customer/auth/LoadingSpinner";

const CustomerLogin: React.FC = () => {
  const [loginProcessing, setLoginProcessing] = useState(false);
  const location = useLocation();
  const from = location.state?.from?.pathname || "/customer/dashboard";
  
  // Handle authentication-based redirects
  const { isLoading, isAuthenticated, initialized } = useAuthRedirect({
    redirectPath: from,
    showWarnings: true
  });
  
  const handleLoginStart = () => setLoginProcessing(true);
  const handleLoginComplete = () => setLoginProcessing(false);

  // If still checking authentication status or processing login, show loading
  if (isLoading || loginProcessing) {
    return <LoadingSpinner message={loginProcessing ? "מתחבר..." : "טוען..."} />;
  }

  // If already authenticated, don't render the login form
  if (isAuthenticated && initialized) {
    return <LoadingSpinner message="מועבר לדף הבית..." />;
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
