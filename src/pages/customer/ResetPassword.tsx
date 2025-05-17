
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const { loading } = useCustomerAuth();

  // Check if we have a hash parameter in the URL (for password reset)
  useEffect(() => {
    console.log("[AUTH_DEBUG] ResetPassword - Checking for hash parameter in URL");
    
    const hashParams = window.location.hash;
    if (!hashParams || !hashParams.includes('access_token=')) {
      console.log("[AUTH_DEBUG] ResetPassword - No hash parameters found, this might be a direct access");
    } else {
      console.log("[AUTH_DEBUG] ResetPassword - Hash parameters found, ready for password reset");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("הסיסמאות אינן תואמות");
      return;
    }

    if (password.length < 6) {
      toast.error("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    setIsLoading(true);

    try {
      console.log("[AUTH_DEBUG] ResetPassword - Attempting to update password");
      
      // Using updateUser directly since we're already in the hash callback for password reset
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        console.error("[AUTH_DEBUG] ResetPassword - Failed to update password:", error);
        toast.error(error.message || "שגיאה באיפוס הסיסמה");
        return;
      }
      
      console.log("[AUTH_DEBUG] ResetPassword - Password updated successfully");
      setIsSuccess(true);
      toast.success("הסיסמה עודכנה בהצלחה");
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
    } catch (error) {
      console.error("[AUTH_DEBUG] ResetPassword - Unexpected error:", error);
      toast.error("שגיאה בלתי צפויה אירעה באיפוס הסיסמה");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>איפוס סיסמה</CardTitle>
          <CardDescription>
            הזן את הסיסמה החדשה שלך
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה חדשה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="הכנס סיסמה חדשה"
                required
                minLength={6}
                dir="ltr"
                disabled={isSuccess}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">אימות סיסמה</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="הכנס את הסיסמה שוב"
                required
                minLength={6}
                dir="ltr"
                disabled={isSuccess}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || isSuccess}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : isSuccess ? (
                "הסיסמה עודכנה בהצלחה"
              ) : (
                "עדכן סיסמה"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
