import React from 'react';
import { useAffiliateAuth } from '@/hooks/useAffiliate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, Package, Award } from 'lucide-react';
import { PackagePurchaseDialog } from '@/components/affiliate/PackagePurchaseDialog';

const AffiliateDashboardPage: React.FC = () => {
  const { affiliate, isLoading: authLoading } = useAffiliateAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען נתוני דאשבורד...</p>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">שגיאת גישה</CardTitle>
            <CardDescription className="text-center">
              לא נמצא חשבון שותף. אנא פנה למנהל המערכת.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 text-center">
              Debug: localStorage data not found or invalid
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">שלום {affiliate.name}</h1>
              <p className="text-gray-600 mt-1">דאשבורד שותפים - Food Vision AI</p>
              <p className="text-sm text-gray-500 mt-2">
                Affiliate ID: {affiliate.affiliate_id}
              </p>
              <p className="text-sm text-gray-500">
                Email: {affiliate.email}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600 border-green-200">
                <Award className="w-4 h-4 mr-1" />
                שותף פעיל
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Grid - Simplified for now */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">לקוחות פעילים</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                בקרוב נוסיף שתתפות נתונים
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">סה"כ עמלות</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₪0</div>
              <p className="text-xs text-muted-foreground">
                שולם: ₪0
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">חבילות פעילות</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                נותרו: 0 מנות
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>פעולות מהירות</CardTitle>
            <CardDescription>
              ניהול מהיר של הלקוחות והחבילות שלך
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <PackagePurchaseDialog affiliateId={affiliate.affiliate_id}>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Package className="w-4 h-4 mr-2" />
                  רכוש חבילה חדשה
                </Button>
              </PackagePurchaseDialog>
              <Button variant="outline" size="lg">
                <Users className="w-4 h-4 mr-2" />
                צפה בלקוחות
              </Button>
              <Button variant="outline" size="lg">
                <DollarSign className="w-4 h-4 mr-2" />
                דוח עמלות
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">מידע להדגבה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-blue-700">
              <p>Status: ההתחברות עובדת!</p>
              <p>Name: {affiliate.name}</p>
              <p>Email: {affiliate.email}</p>
              <p>ID: {affiliate.affiliate_id}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AffiliateDashboardPage; 