import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useClientAuth } from "@/hooks/useClientAuth";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { Home, Package, Image, User, LogOut, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function CustomerLayout() {
  const location = useLocation();
  const { 
    clientId, 
    authenticating, 
    isAuthenticated, 
    hasLinkedClientRecord,
    hasNoClientRecord,
    clientRecordStatus,
    errorState
  } = useClientAuth();
  const { isAuthenticated: mainAuthIsAuthenticated, user: mainAuthUser } = useCustomerAuth();
  const { toast } = useToast();

  console.log("[AUTH_DEBUG] CustomerLayout - State received:", {
    clientId,
    authenticating,
    clientRecordStatus,
    errorState,
    mainAuthIsAuthenticated,
    mainAuthUser: mainAuthUser?.id,
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
        description: "התנתקת בהצלחה מהמערכת",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "שגיאה בהתנתקות",
        description: "אירעה שגיאה בעת ההתנתקות. אנא נסה שוב.",
        variant: "destructive",
      });
    }
  };

  // If still authenticating, show a loading indicator
  if (authenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Handle the case where user is authenticated but doesn't have a client profile
  const noClientProfileBanner = isAuthenticated && clientRecordStatus === 'not-found' && (
    <Alert className="bg-amber-50 border-amber-200 mb-4">
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-800">אין פרופיל לקוח מקושר</AlertTitle>
      <AlertDescription className="text-amber-700">
        החשבון שלך מאומת, אך אינו מקושר לפרופיל לקוח במערכת. חלק מהתכונות עלולות להיות מוגבלות.
        אנא צור קשר עם התמיכה לסיוע.
      </AlertDescription>
    </Alert>
  );

  // Handle error state with specific message
  const errorBanner = errorState && (
    <Alert className="bg-red-50 border-red-200 mb-4">
      <AlertTriangle className="h-4 w-4 text-red-500" />
      <AlertTitle className="text-red-800">שגיאה בטעינת פרופיל לקוח</AlertTitle>
      <AlertDescription className="text-red-700">
        {errorState}
      </AlertDescription>
    </Alert>
  );

  // If not authenticated, redirect to login (This should be handled by the router)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-bold">יש להתחבר למערכת</h1>
        <Button asChild>
          <Link to="/login">התחברות</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Sidebar */}
      <aside className="md:w-64 border-b md:border-r md:border-b-0 p-4 bg-card">
        <div className="flex items-center justify-center md:justify-start gap-2 mb-6">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold">
            FV
          </div>
          <h1 className="text-xl font-bold">Food Vision</h1>
        </div>

        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
          <Button
            variant={isActive("/customer/dashboard") ? "default" : "ghost"}
            className="justify-start"
            asChild
          >
            <Link to="/customer/dashboard">
              <Home className="ml-2 h-4 w-4" />
              דף הבית
            </Link>
          </Button>

          <Button
            variant={isActive("/customer/submissions") ? "default" : "ghost"}
            className="justify-start"
            asChild
          >
            <Link to="/customer/submissions">
              <Image className="ml-2 h-4 w-4" />
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
            variant={isActive("/food-vision-form") ? "default" : "ghost"}
            className="justify-start"
            asChild
          >
            <Link to="/food-vision-form">
              <Package className="ml-2 h-4 w-4" />
              העלאת מנות חדשות
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

          <Button
            variant="ghost"
            className="justify-start text-destructive hover:text-destructive mt-auto md:mt-4"
            onClick={handleLogout}
          >
            <LogOut className="ml-2 h-4 w-4" />
            התנתקות
          </Button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {errorBanner || noClientProfileBanner}
          <Outlet />
        </div>
      </main>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}
