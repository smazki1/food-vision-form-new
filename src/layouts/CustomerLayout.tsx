
import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useClientAuth } from "@/hooks/useClientAuth";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { Home, Package, Image, User, LogOut, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BottomNavigation } from "@/components/customer/BottomNavigation";

export function CustomerLayout() {
  const location = useLocation();
  const { 
    clientId, 
    clientRecordStatus,
    errorState
  } = useClientAuth();
  const { isAuthenticated: unifiedIsAuthenticated, user: unifiedUser, role: unifiedRole, clientId: unifiedAuthClientId } = useUnifiedAuth();
  const { toast } = useToast();

  console.log("[AUTH_DEBUG] CustomerLayout - State received:", {
    clientId,
    clientRecordStatus,
    errorState,
    unifiedIsAuthenticated,
    unifiedUser: unifiedUser?.id,
    unifiedRole,
    unifiedAuthClientId,
    pathname: location.pathname,
    timestamp: Date.now()
  });

  // Check if the current path starts with the given path
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "התנתקות בוצעה בהצלחה",
        description: "התנתקתם/ן בהצלחה מהמערכת",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "שגיאה בהתנתקות",
        description: "אירעה שגיאה בעת ההתנתקות. אנא נסו שוב.",
        variant: "destructive",
      });
    }
  };

  // Handle the case where user is authenticated but doesn't have a client profile
  const noClientProfileBanner = unifiedIsAuthenticated && clientRecordStatus === 'not-found' && (
    <Alert className="bg-amber-50 border-amber-200 mb-4">
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-800">אין פרופיל לקוח מקושר</AlertTitle>
      <AlertDescription className="text-amber-700">
        החשבון שלכם/ן מאומת, אך אינו מקושר לפרופיל לקוח במערכת. חלק מהתכונות עלולות להיות מוגבלות.
        אנא צרו קשר עם התמיכה לסיוע.
      </AlertDescription>
    </Alert>
  );

  // Handle error state with specific message from useClientAuth
  const errorBanner = errorState && (
    <Alert className="bg-red-50 border-red-200 mb-4">
      <AlertTriangle className="h-4 w-4 text-red-500" />
      <AlertTitle className="text-red-800">שגיאה בטעינת פרופיל לקוח</AlertTitle>
      <AlertDescription className="text-red-700">
        {errorState}
      </AlertDescription>
    </Alert>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block md:w-64 border-r p-4 bg-card">
        <nav className="flex flex-col gap-1">
          <Button
            variant={isActive("/customer/dashboard") ? "default" : "ghost"}
            className="justify-start"
            asChild
          >
            <Link to="/customer/dashboard">
              <Home className="ml-2 h-4 w-4" />
              לוח בקרה
            </Link>
          </Button>

          <Button
            variant={isActive("/customer/home") ? "default" : "ghost"}
            className="justify-start"
            asChild
          >
            <Link to="/customer/home">
              <Home className="ml-2 h-4 w-4" />
              דף הבית
            </Link>
          </Button>

          <Button
            variant={isActive("/customer/submissions-status") ? "default" : "ghost"}
            className="justify-start"
            asChild
          >
            <Link to="/customer/submissions-status">
              <Package className="ml-2 h-4 w-4" />
              המנות שלי
            </Link>
          </Button>
          
          <Button
            variant={isActive("/customer/gallery") ? "default" : "ghost"}
            className="justify-start"
            asChild
          >
            <Link to="/customer/gallery">
              <Image className="ml-2 h-4 w-4" />
              הגלריה שלי
            </Link>
          </Button>

          <Button
            variant={isActive("/customer/upload") ? "default" : "ghost"}
            className="justify-start"
            asChild
          >
            <Link to="/customer/upload">
              <Package className="ml-2 h-4 w-4" />
              העלאת מנה חדשה
            </Link>
          </Button>

          <Button
            variant={isActive("/customer/profile") ? "default" : "ghost"}
            className="justify-start"
            asChild
          >
            <Link to="/customer/profile">
              <User className="ml-2 h-4 w-4" />
              פרופיל
            </Link>
          </Button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto p-4">
          {errorBanner || noClientProfileBanner}
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation />

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}
