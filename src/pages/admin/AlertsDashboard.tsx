
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAlerts } from '@/hooks/useAlerts';
import { AlertsFilter } from '@/components/admin/alerts/AlertsFilter';
import { RemindersSchedule } from '@/components/admin/alerts/RemindersSchedule';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';

const AlertsDashboard: React.FC = () => {
  const [alertFilter, setAlertFilter] = useState<string>('all');
  
  const {
    alerts,
    upcomingReminders,
    loading,
    markAsViewed
  } = useAlerts();

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">טוען התראות...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">מרכז התראות</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50">
              <Bell className="h-4 w-4 mr-1" />
              {alerts.length} התראות
            </Badge>
            <Badge variant="outline" className="bg-green-50">
              <Calendar className="h-4 w-4 mr-1" />
              {upcomingReminders.length} תזכורות
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="alerts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="alerts">התראות</TabsTrigger>
            <TabsTrigger value="reminders">תזכורות</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-4">
            <AlertsFilter 
              currentFilter={alertFilter}
              onFilterChange={setAlertFilter}
              alerts={alerts}
            />
            
            <div className="grid gap-4">
              {alerts.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-muted-foreground">אין התראות חדשות</p>
                  </CardContent>
                </Card>
              ) : (
                alerts.map((alert) => (
                  <Card key={alert.alert_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <Badge variant="outline">{alert.alert_type}</Badge>
                          </div>
                          <h3 className="font-medium mb-1">{alert.alert_title}</h3>
                          <p className="text-sm text-muted-foreground">{alert.alert_description}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(alert.created_at).toLocaleDateString('he-IL')}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => markAsViewed(alert.alert_id)}
                        >
                          סמן כנקרא
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="reminders">
            <RemindersSchedule />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AlertsDashboard;
