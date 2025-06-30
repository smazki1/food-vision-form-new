import React from 'react';
import { useAffiliateAuth, useAffiliateDashboard } from '@/hooks/useAffiliate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, Package, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

const AffiliateDashboardPage: React.FC = () => {
  const { affiliate, isLoading: authLoading } = useAffiliateAuth();
  const { data: stats, isLoading: statsLoading } = useAffiliateDashboard(affiliate?.affiliate_id || '');

  if (authLoading || statsLoading) {
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
        </Card>
      </div>
    );
  }

  const earningsChange = stats ? 
    ((stats.this_month_earnings - stats.last_month_earnings) / Math.max(stats.last_month_earnings, 1)) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">שלום {affiliate.name}</h1>
              <p className="text-gray-600 mt-1">דאשבורד שותפים - Food Vision AI</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600 border-green-200">
                <Award className="w-4 h-4 mr-1" />
                שותף פעיל
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Clients */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">לקוחות פעילים</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active_clients || 0}</div>
              <p className="text-xs text-muted-foreground">
                מתוך {stats?.total_clients || 0} לקוחות בסך הכל
              </p>
            </CardContent>
          </Card>

          {/* Total Earnings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">סה"כ עמלות</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.total_commissions || 0)}</div>
              <p className="text-xs text-muted-foreground">
                שולם: {formatCurrency(stats?.paid_commissions || 0)}
              </p>
            </CardContent>
          </Card>

          {/* Monthly Earnings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">עמלות החודש</CardTitle>
              {earningsChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.this_month_earnings || 0)}</div>
              <p className={`text-xs ${earningsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {earningsChange >= 0 ? '+' : ''}{earningsChange.toFixed(1)}% מהחודש הקודם
              </p>
            </CardContent>
          </Card>

          {/* Active Packages */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">חבילות פעילות</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active_packages || 0}</div>
              <p className="text-xs text-muted-foreground">
                נותרו: {stats?.total_dishes_remaining || 0} מנות
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
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Package className="w-4 h-4 mr-2" />
                רכוש חבילה חדשה
              </Button>
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

        {/* Pending Commissions Alert */}
        {stats && stats.pending_commissions > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800">עמלות ממתינות לתשלום</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-700">
                    יש לך עמלות בסך {formatCurrency(stats.pending_commissions)} הממתינות לתשלום
                  </p>
                  <p className="text-sm text-orange-600 mt-1">
                    התשלום יתבצע בהתאם להסכם השותפות
                  </p>
                </div>
                <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                  צפה בפרטים
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Clients */}
          <Card>
            <CardHeader>
              <CardTitle>לקוחות אחרונים</CardTitle>
              <CardDescription>הלקוחות שהצטרפו לאחרונה דרכך</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* This would be populated with actual recent clients data */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">מסעדת השמן</p>
                    <p className="text-sm text-gray-600">הצטרף לפני 2 ימים</p>
                  </div>
                  <Badge variant="outline">חבילת תפריט מלא</Badge>
                </div>
                <div className="text-center py-4 text-gray-500">
                  <p>אין לקוחות חדשים השבוע</p>
                  <Button variant="link" size="sm" className="mt-2">
                    צפה בכל הלקוחות
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package Usage */}
          <Card>
            <CardHeader>
              <CardTitle>ניצול חבילות</CardTitle>
              <CardDescription>מצב השימוש בחבילות הפעילות שלך</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats && stats.active_packages > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">מנות נותרות</span>
                      <span className="text-sm text-gray-600">{stats.total_dishes_remaining}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">תמונות נותרות</span>
                      <span className="text-sm text-gray-600">{stats.total_images_remaining}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>אין חבילות פעילות</p>
                    <Button variant="link" size="sm" className="mt-2">
                      רכוש חבילה ראשונה
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AffiliateDashboardPage; 