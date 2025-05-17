
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";

const CustomerLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user, loading, isAuthenticated, initialized } = useCustomerAuth();

  // Get the redirect path from location state, or default to dashboard
  const from = location.state?.from?.pathname || "/customer/dashboard";

  // If already logged in, redirect to dashboard
  useEffect(() => {
    // Log all state changes to debug the loop
    console.log("[AUTH_DEBUG] CustomerLogin - Auth state check:", {
      isAuthenticated, 
      initialized, 
      loading, 
      userId: user?.id,
      currentPath: location.pathname,
      targetPath: from, 
      isRedirecting
    });
    
    if (isAuthenticated && initialized && !loading && !isRedirecting) {
      console.log("[AUTH_DEBUG] CustomerLogin - User already authenticated, redirecting to:", from);
      setIsRedirecting(true);
      
      // Use a small delay to ensure state is stable before navigation
      const timeoutId = setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, loading, initialized, navigate, from, isRedirecting, user, location.pathname]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading || isRedirecting) return;
    
    setIsLoading(true);

    try {
      console.log("[AUTH_DEBUG] CustomerLogin - Attempting to login with:", email);
      const { success, error } = await signIn(email, password);

      if (success) {
        toast.success("התחברת בהצלחה");
        console.log("[AUTH_DEBUG] CustomerLogin - Login successful");
        // Let the useEffect handle redirection after auth state updates
      } else {
        toast.error(error || "שם משתמש או סיסמה שגויים");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("[AUTH_DEBUG] CustomerLogin - Login error:", error);
      toast.error("שגיאה בהתחברות");
      setIsLoading(false);
    }
  };

  // If still checking authentication status, show loading
  if (loading && !isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
            <div className="mt-2 text-sm">Cursor Test - Local to Preview</div>
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
              disabled={isLoading || isRedirecting}
            >
              {isLoading || isRedirecting ? (
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
