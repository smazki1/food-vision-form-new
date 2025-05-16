
import React, { useEffect, useState } from "react";
import { useNavigate, Outlet, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import {
  Clock,
  Home,
  LogOut,
  Settings,
  ImageIcon,
  MessageSquare,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds

const EditorLayout: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { role, isLoading: isRoleLoading } = useCurrentUserRole();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Check if user is authenticated as editor
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const adminAuth = localStorage.getItem("adminAuthenticated") === "true";
      const authTime = Number(localStorage.getItem("adminAuthTime") || "0");
      const currentTime = Date.now();
      const isSessionValid = adminAuth && (currentTime - authTime < SESSION_TIMEOUT);
      
      if (!isSessionValid || !data.session) {
        setIsAuthenticated(false);
        setIsChecking(false);
        navigate("/admin-login");
        return;
      }
      
      setIsAuthenticated(true);
      setIsChecking(false);
    };
    
    checkAuth();
    
    // Set up a timer to check auth periodically
    const authCheckTimer = setInterval(checkAuth, 60000); // Check every minute
    
    return () => {
      clearInterval(authCheckTimer);
    };
  }, [navigate]);
  
  // Check if user has editor role
  useEffect(() => {
    if (!isRoleLoading && role !== 'editor' && !isChecking && isAuthenticated) {
      toast.error("אין לך הרשאות גישה לאזור העורכים");
      navigate("/admin/dashboard");
    }
  }, [role, isRoleLoading, isAuthenticated, isChecking, navigate]);
  
  // Show loading state while checking auth
  if (isChecking || isRoleLoading) {
    return <div className="flex justify-center items-center min-h-screen">טוען...</div>;
  }
  
  // Only render the editor layout if authenticated and has editor role
  if (!isAuthenticated || role !== 'editor') {
    return null;
  }
  
  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    localStorage.removeItem("adminAuthTime");
    toast.info("התנתקת בהצלחה");
    navigate("/admin-login");
  };
  
  const navItems = [
    {
      title: "דאשבורד",
      icon: Home,
      href: "/editor/dashboard",
    },
    {
      title: "משימות שלי",
      icon: Clock,
      href: "/editor/tasks",
    },
    {
      title: "גלריית עבודות",
      icon: ImageIcon,
      href: "/editor/gallery",
    },
    {
      title: "תקשורת",
      icon: MessageSquare,
      href: "/editor/messages",
    },
    {
      title: "הגדרות",
      icon: Settings,
      href: "/editor/settings",
    },
  ];
  
  const MobileNav = () => (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">תפריט</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[385px]">
        <div className="flex flex-col h-full">
          <div className="flex h-14 items-center justify-between border-b px-4">
            <Link
              to="/editor/dashboard"
              className="flex items-center gap-2 font-semibold"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <img
                src="/favicon.ico"
                alt="Food Vision AI"
                className="h-6 w-6"
              />
              <span>Food Vision AI - עורך</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <div className="grid gap-1 px-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                      isActive
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="border-t p-4">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>התנתקות</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
  
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="w-64 hidden md:block shadow-md">
        <div className="flex h-full flex-col border-r bg-background">
          <div className="flex h-14 items-center border-b px-4">
            <Link
              to="/editor/dashboard"
              className="flex items-center gap-2 font-semibold"
            >
              <img
                src="/favicon.ico"
                alt="Food Vision AI"
                className="h-6 w-6"
              />
              <span>Food Vision AI - עורך</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <div className="grid gap-1 px-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                      isActive
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="border-t p-4">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>התנתקות</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="h-14 border-b flex items-center justify-between px-4 md:hidden">
          <Link to="/editor/dashboard" className="font-medium flex items-center">
            <img
              src="/favicon.ico"
              alt="Food Vision AI"
              className="h-6 w-6 mr-2"
            />
            Food Vision AI - עורך
          </Link>
          <MobileNav />
        </header>
        
        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default EditorLayout;
