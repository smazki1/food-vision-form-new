
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/**
 * Customer login page with simplified and optimized authentication handling
 */
const CustomerLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>התחברות למערכת</CardTitle>
          <CardDescription>
            התחברו כדי לצפות ולנהל את המנות שלכם
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
                placeholder="הכניסו את כתובת האימייל שלכם"
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
                placeholder="הכניסו את הסיסמה שלכם"
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
                "התחברות"
              )}
            </Button>
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <button
                type="button"
                onClick={() => {
                  const phoneNumber = "+972527772807";
                  const message = encodeURIComponent("שלום, שכחתי את הסיסמה שלי ואני זקוק לעזרה.");
                  window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
                }}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                שכחתם סיסמה? צרו קשר
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default CustomerLogin;
