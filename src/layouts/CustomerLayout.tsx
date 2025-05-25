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
    authenticating, 
    isAuthenticated, 
    clientRecordStatus,
    errorState
  } = useClientAuth();
  const { isAuthenticated: unifiedIsAuthenticated, user: unifiedUser } = useUnifiedAuth();
  const { toast } = useToast();

  console.log("[AUTH_DEBUG] CustomerLayout - State received:", {
    clientId,
    authenticating,
    clientRecordStatus,
    errorState,
    mainAuthIsAuthenticated: unifiedIsAuthenticated,
    mainAuthUser: unifiedUser?.id,
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
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <div className="mt-4 text-sm text-muted-foreground text-center">
          המערכת בגרסת בטא - הטעינה עשויה לקחת מספר שניות. <br />
          במקרה של המתנה ממושכת, אנא רענן את הדף
        </div>
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

  // If not authenticated, redirect to login
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Mobile Header - REMOVED as per request */}
      {/*
      <header className="sticky top-0 z-50 bg-white border-b md:hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold">
              FV
            </div>
            <h1 className="text-xl font-bold">Food Vision</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-gray-500"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>
      */}

      {/* Desktop Sidebar - REMOVED header part and logout button */}
      <aside className="hidden md:block md:w-64 border-r p-4 bg-card">
        {/* Logo and Title - REMOVED as per request */}
        {/* 
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold">
            FV
          </div>
          <h1 className="text-xl font-bold">Food Vision</h1>
        </div>
        */}

        <nav className="flex flex-col gap-1">
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
            variant={isActive("/customer/home") ? "default" : "ghost"}
            className="justify-start"
            asChild
          >
            <Link to="/customer/home">
              <Image className="ml-2 h-4 w-4" />
              הגלריה שלי
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
