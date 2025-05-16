
import React from "react";
import { useClientProfile } from "@/hooks/useClientProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export function CustomerProfile() {
  const { clientProfile, loading, error, updateNotificationPreferences } = useClientProfile();
  const { toast } = useToast();

  const handleNotificationChange = async (
    emailEnabled: boolean, 
    appEnabled: boolean
  ) => {
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

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-1/2 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !clientProfile) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>שגיאה בטעינת פרופיל</CardTitle>
          <CardDescription>
            אירעה שגיאה בעת טעינת פרופיל המשתמש שלך. אנא נסה שוב מאוחר יותר.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>פרופיל משתמש</CardTitle>
        <CardDescription>
          צפה ועדכן את פרטי המשתמש והעדפות ההתראות שלך
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Details */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">פרטי משתמש</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm text-muted-foreground">שם מסעדה:</div>
            <div>{clientProfile.restaurant_name}</div>
            <div className="text-sm text-muted-foreground">איש קשר:</div>
            <div>{clientProfile.contact_name}</div>
            <div className="text-sm text-muted-foreground">אימייל:</div>
            <div>{clientProfile.email}</div>
            <div className="text-sm text-muted-foreground">טלפון:</div>
            <div>{clientProfile.phone}</div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">הגדרות התראות</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications" className="flex flex-col gap-1">
                <span>קבל התראות באימייל</span>
                <span className="font-normal text-sm text-muted-foreground">
                  קבל עדכונים על סטטוס מנות ועדכונים נוספים באימייל
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
              <Label htmlFor="app-notifications" className="flex flex-col gap-1">
                <span>קבל התראות באפליקציה</span>
                <span className="font-normal text-sm text-muted-foreground">
                  קבל התראות בתוך האפליקציה כשאתה מחובר
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
