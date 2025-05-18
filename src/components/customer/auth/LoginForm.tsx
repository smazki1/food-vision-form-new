
import React, { useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useNavigate, useLocation } from "react-router-dom";

interface LoginFormProps {
  onLoginStart: () => void;
  onLoginComplete: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginStart, onLoginComplete }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const loginTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get the redirect path from location state, or default to dashboard
  const from = location.state?.from?.pathname || "/customer/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    // Clear any existing timeout
    if (loginTimeoutRef.current) {
      clearTimeout(loginTimeoutRef.current);
    }
    
    setIsLoading(true);
    onLoginStart();

    // Set a timeout to prevent infinite loading state
    loginTimeoutRef.current = setTimeout(() => {
      if (isLoading) {
        console.error("[AUTH_DEBUG_FINAL_] CustomerLogin - Login timeout after 30 seconds");
        setIsLoading(false);
        toast.error("התחברות נכשלה - תם הזמן המוקצב. אנא נסה שוב או צור קשר עם התמיכה.");
        onLoginComplete();
      }
    }, 30000);

    try {
      console.log("[AUTH_DEBUG_FINAL_] CustomerLogin - Attempting login with:", email);
      const { success, error } = await signIn(email, password);

      // Clear the timeout since we got a response
      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
        loginTimeoutRef.current = null;
      }

      if (success) {
        toast.success("התחברת בהצלחה");
        console.log("[AUTH_DEBUG_FINAL_] CustomerLogin - Login successful");
        // Navigate will be handled by parent component through auth state
      } else {
        console.error("[AUTH_DEBUG_FINAL_] CustomerLogin - Login failed:", error);
        toast.error(error || "שם משתמש או סיסמה שגויים");
      }
    } catch (error) {
      // Clear the timeout since we got a response
      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
        loginTimeoutRef.current = null;
      }

      console.error("[AUTH_DEBUG_FINAL_] CustomerLogin - Login error:", error);
      toast.error("שגיאה בהתחברות. אנא נסה שוב או צור קשר עם התמיכה.");
    } finally {
      setIsLoading(false);
      onLoginComplete();
    }
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
      }
    };
  }, []);

  return (
    <form onSubmit={handleLogin} className="space-y-4">
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
          disabled={isLoading}
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
          disabled={isLoading}
        />
      </div>
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
    </form>
  );
};

export default LoginForm;
