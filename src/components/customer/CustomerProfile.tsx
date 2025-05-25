import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useClientAuth } from '@/hooks/useClientAuth';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useClientProfile } from "@/hooks/useClientProfile";
import { useClientPackage } from '@/hooks/useClientPackage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Edit3, KeyRound, Package, LogOut, Bell } from 'lucide-react';
import { Client } from '@/types/client';

export function CustomerProfile() {
  const { userAuthId } = useClientAuth();
  const { user } = useUnifiedAuth();
  console.log("[CustomerProfile] userAuthId from useClientAuth:", userAuthId);
  const { clientProfile, loading: profileLoading, error: profileError, updateNotificationPreferences }: { clientProfile: Client | null; loading: boolean; error: string | null; updateNotificationPreferences: (emailEnabled: boolean, appEnabled: boolean) => Promise<boolean>; } = useClientProfile(userAuthId || undefined);
  const { packageName, remainingDishes, totalDishes } = useClientPackage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "שגיאה בהתנתקות",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate('/login');
    }
  };

  const handleNotificationChange = async (
    emailEnabled: boolean, 
    appEnabled: boolean
  ) => {
    if (!clientProfile) return;
    const success = await updateNotificationPreferences(emailEnabled, appEnabled);
    if (success) {
      toast({
        title: "הגדרות התראות עודכנו",
        description: "העדפות התראות שלך נשמרו בהצלחה",
      });
    } else {
      toast({
        title: "שגיאה בעדכון הגדרות",
        description: "אירעה שגיאה בעת עדכון העדפות ההתראות",
        variant: "destructive",
      });
    }
  };

  if (profileLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </CardContent>
          </Card>
        ))}
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (profileError || (!clientProfile && !profileLoading)) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader className="items-center text-center">
            <CardTitle className="text-xl text-destructive">שגיאה בטעינת פרופיל</CardTitle>
            <CardDescription className="text-base">
              {profileError || "אירעה שגיאה בעת טעינת פרופיל המשתמש שלך. אנא נסה שוב מאוחר יותר."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!clientProfile) {
    return (
      <div className="p-4 text-center">
         <p>לא נטענו נתוני פרופיל.</p>
      </div>
    ); 
  }

  return (
    <div dir="rtl" className="p-4 space-y-6 pb-20 bg-slate-50 min-h-screen">
      <div className="flex flex-col items-center text-center space-y-2 pt-4">
        <Avatar className="w-24 h-24 mb-2">
          <AvatarImage src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || undefined} alt={clientProfile.restaurant_name || 'User'} />
          <AvatarFallback>
            <User className="w-12 h-12" />
          </AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold">{clientProfile.restaurant_name}</h1>
        <p className="text-muted-foreground">{clientProfile.email}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">פרטי חבילה</CardTitle>
          <Package className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium">{packageName || 'לא נטענה חבילה'}</p>
          <p className="text-2xl font-bold text-primary">{remainingDishes}
            <span className="text-sm font-normal text-muted-foreground"> / {totalDishes} מנות</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">הגדרות חשבון</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <Button variant="ghost" className="w-full justify-start px-3">
            <Edit3 className="w-4 h-4 ml-2" />
            ערוך פרופיל
          </Button>
          <Button variant="ghost" className="w-full justify-start px-3">
            <KeyRound className="w-4 h-4 ml-2" />
            שנה סיסמה
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">התראות</CardTitle>
          <Bell className="w-5 h-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications" className="flex flex-col gap-1 flex-1 mr-4">
              <span>התראות באימייל</span>
              <span className="font-normal text-xs text-muted-foreground">
                עדכונים על מנות, חשבונות ועוד.
              </span>
            </Label>
            <Switch 
              id="email-notifications" 
              checked={clientProfile.email_notifications || false}
              onCheckedChange={(checked) => {
                handleNotificationChange(checked, clientProfile.app_notifications || false);
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="app-notifications" className="flex flex-col gap-1 flex-1 mr-4">
              <span>התראות באפליקציה</span>
              <span className="font-normal text-xs text-muted-foreground">
                התראות פנימיות בתוך המערכת.
              </span>
            </Label>
            <Switch 
              id="app-notifications" 
              checked={clientProfile.app_notifications || false}
              onCheckedChange={(checked) => {
                handleNotificationChange(clientProfile.email_notifications || false, checked);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Button 
        variant="destructive" 
        className="w-full h-12 text-base mt-6"
        onClick={handleLogout}
      >
        <LogOut className="w-5 h-5 ml-2" />
        התנתק
      </Button>
    </div>
  );
}
