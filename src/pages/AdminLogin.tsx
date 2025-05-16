
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";

// Simple admin authentication for demonstration purposes
// In a production environment, use Supabase auth with proper role management
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "food-vision-2025";

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { role, isLoading: isRoleLoading } = useCurrentUserRole();

  // Check if already authenticated and redirect if needed
  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = localStorage.getItem("adminAuthenticated") === "true";
      if (isAuthenticated && location.pathname === "/admin-login") {
        console.log("Already authenticated, checking role");
        
        // Wait for role to load
        if (isRoleLoading) return;
        
        if (role === 'editor') {
          console.log("User has editor role, redirecting to editor dashboard");
          navigate("/editor/dashboard");
        } else {
          console.log("User has admin role, redirecting to admin dashboard");
          navigate("/admin/dashboard");
        }
      }
    };
    
    checkAuth();
  }, [navigate, location, role, isRoleLoading]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Clear any previous authentication to ensure a clean slate
    localStorage.removeItem("adminAuthenticated");
    console.log("Attempting admin login with:", { username });

    // Simple authentication check
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      console.log("Admin credentials match, setting authentication");
      // Store admin session in localStorage
      localStorage.setItem("adminAuthenticated", "true");
      localStorage.setItem("adminAuthTime", Date.now().toString());
      
      toast.success("התחברת בהצלחה");
      navigate("/admin/dashboard");
    } else {
      // Try Supabase auth
      authWithSupabase();
    }
  };
  
  const authWithSupabase = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password
      });
      
      if (error) throw error;
      
      if (data.session) {
        // Store admin session in localStorage
        localStorage.setItem("adminAuthenticated", "true");
        localStorage.setItem("adminAuthTime", Date.now().toString());
        
        // Get user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();
        
        toast.success("התחברת בהצלחה");
        
        if (roleData?.role === 'editor') {
          navigate("/editor/dashboard");
        } else {
          navigate("/admin/dashboard");
        }
      } else {
        toast.error("שם משתמש או סיסמה שגויים");
      }
    } catch (error) {
      console.log("Login failed:", error);
      toast.error("שם משתמש או סיסמה שגויים");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle className="text-xl">התחברות למנהל</CardTitle>
          <CardDescription>הזן את פרטי הכניסה שלך כדי להיכנס לפאנל הניהול</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">שם משתמש / אימייל</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={toggleShowPassword}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "מתחבר..." : "התחברות"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AdminLogin;
