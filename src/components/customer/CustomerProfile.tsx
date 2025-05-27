import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientAuth } from '@/hooks/useClientAuth';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useClientProfile } from "@/hooks/useClientProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Package, LogOut, MessageCircle, LifeBuoy } from 'lucide-react';
import { Client } from '@/types/client';

interface ClientProfileWithPackage extends Client {
  service_packages?: {
    package_id: string;
    package_name: string;
    total_servings: number;
  } | null;
}

export function CustomerProfile() {
  const { userAuthId } = useClientAuth();
  const { user, signOut: unifiedSignOut } = useUnifiedAuth();
  console.log("[CustomerProfile] userAuthId from useClientAuth:", userAuthId);
  const { clientProfile, loading: profileLoading, error: profileError, updateNotificationPreferences } = useClientProfile(userAuthId || user?.id || undefined) as { clientProfile: ClientProfileWithPackage | null; loading: boolean; error: string | null; updateNotificationPreferences: (emailEnabled: boolean, appEnabled: boolean) => Promise<boolean>; };
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (!unifiedSignOut) { 
        toast({ title: "שגיאה", description: "פונקציית התנתקות לא זמינה.", variant: "destructive"});
        return;
    }
    console.log("[CustomerProfile] Attempting sign out via unifiedSignOut...");
    const { success, error } = await unifiedSignOut(); 

    if (error || !success) {
      console.error("[CustomerProfile] Sign out failed:", error);
      toast({
        title: "שגיאה בהתנתקות",
        description: String(error) || "אירעה שגיאה לא ידועה.",
        variant: "destructive",
      });
    } else {
      console.log("[CustomerProfile] Sign out successful from context, navigating to /login");
      navigate('/login');
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
              {profileError || "אירעה שגיאה בעת טעינת פרופיל המשתמש/ת. אנא נסו שוב מאוחר יותר."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!clientProfile) {
    return (
      <div dir="rtl" className="p-4 text-center">
         <p>לא נטענו נתוני פרופיל.</p>
      </div>
    ); 
  }

  const packageName = clientProfile?.service_packages?.package_name;
  const remainingDishes = clientProfile?.remaining_servings;
  const totalDishes = clientProfile?.service_packages?.total_servings;

  const openWhatsApp = () => {
    const phoneNumber = "+972527772807";
    const message = encodeURIComponent("שלום, אני צריך עזרה בנוגע לחשבון שלי בפוד ויז'ן.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

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
          <p className="text-2xl font-bold text-primary">{remainingDishes !== undefined ? remainingDishes : '-'}
            <span className="text-sm font-normal text-muted-foreground"> / {totalDishes !== undefined ? totalDishes : '-'} מנות</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col items-center space-y-1 text-center pb-2">
          <div className="flex flex-row items-center space-x-2 rtl:space-x-reverse">
            <LifeBuoy className="h-6 w-6 text-primary" />
            <CardTitle className="text-lg font-semibold">זקוקים לעזרה?</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-3 text-center">
          <CardDescription>
            צוות התמיכה שלנו זמין עבורכם/ן וישמח לסייע בכל שאלה או בעיה.
          </CardDescription>
          <Button 
            className="w-full h-12 text-base bg-green-500 hover:bg-green-600 text-white"
            onClick={openWhatsApp}
          >
            <MessageCircle className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0" />
            שלח הודעת WhatsApp
          </Button>
        </CardContent>
      </Card>
      
      <div className="w-full flex justify-center pt-4">
      <Button 
        variant="destructive" 
          className="h-12 text-base px-8"
        onClick={handleLogout}
      >
        <LogOut className="w-5 h-5 ml-2" />
          התנתקות
      </Button>
      </div>
    </div>
  );
}
