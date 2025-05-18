
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useClientAuth } from "@/hooks/useClientAuth";

const CustomerLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user, loading, isAuthenticated, initialized } = useCustomerAuth();
  const { hasLinkedClientRecord, errorState, clientRecordStatus } = useClientAuth();
  const redirectAttempted = useRef(false);

  // Get the redirect path from location state, or default to dashboard
  const from = location.state?.from?.pathname || "/customer/dashboard";

  // Handle redirection when already logged in - improved logic to avoid loops
  useEffect(() => {
    // Log auth state to help track login flow
    console.log("[AUTH_DEBUG_FINAL_] CustomerLogin - Auth check:", {
      isAuthenticated, 
      initialized, 
      loading, 
      userId: user?.id,
      hasLinkedClientRecord,
      clientRecordStatus,
      errorState,
      currentPath: location.pathname,
      targetPath: from, 
      redirectAttempted: redirectAttempted.current
    });
    
    // Only redirect when fully authenticated and not in a loading state
    if (isAuthenticated && initialized && !loading && !redirectAttempted.current) {
      console.log("[AUTH_DEBUG_FINAL_] CustomerLogin - User authenticated, redirecting to:", from);
      
      // Set the flag first to prevent multiple redirects
      redirectAttempted.current = true;
      
      // Use a small timeout to ensure all state updates are processed
      setTimeout(() => {
        navigate(from, { replace: true });
        
        // Show a warning toast if authenticated but no client record is linked
        if (clientRecordStatus === 'not-found') {
          toast.warning("משתמש מאומת אך אין רשומת לקוח מקושרת. חלק מהתכונות עשויות להיות מוגבלות.", { duration: 6000 });
        }
        
        // Show an error toast if there's an error state
        if (errorState) {
          toast.error(errorState, { duration: 6000 });
        }
      }, 100);
    }
  }, [isAuthenticated, loading, initialized, navigate, from, user, hasLinkedClientRecord, clientRecordStatus, errorState]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    setIsLoading(true);

    try {
      console.log("[AUTH_DEBUG_FINAL_] CustomerLogin - Attempting login with:", email);
      const { success, error } = await signIn(email, password);

      if (success) {
        toast.success("התחברת בהצלחה");
        console.log("[AUTH_DEBUG_FINAL_] CustomerLogin - Login successful");
        // Let the useEffect handle redirection after auth state updates
      } else {
        toast.error(error || "שם משתמש או סיסמה שגויים");
      }
    } catch (error) {
      console.error("[AUTH_DEBUG_FINAL_] CustomerLogin - Login error:", error);
      toast.error("שגיאה בהתחברות");
    } finally {
      setIsLoading(false);
    }
  };

  // If still checking authentication status, show loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If already authenticated, don't render the login form
  if (isAuthenticated && initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <div className="ml-3">מועבר לדף הבית...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>התחברות למערכת</CardTitle>
          <CardDescription>
            התחבר כדי לצפות ולנהל את המנות שלך
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="הכנס את כתובת האימייל שלך"
                required
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="הכנס את הסיסמה שלך"
                required
                dir="ltr"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                "התחבר"
              )}
            </Button>
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <Link
                to="/forgot-password"
                className="hover:text-primary transition-colors"
              >
                שכחת סיסמה?
              </Link>
              <Link
                to="/"
                className="hover:text-primary transition-colors"
              >
                עדיין לא לקוח שלנו? הגש פרטים
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default CustomerLogin;
