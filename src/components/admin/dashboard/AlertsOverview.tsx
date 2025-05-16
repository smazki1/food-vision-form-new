
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAlerts } from "@/hooks/useAlerts";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Alert } from "@/types/alert";
import {
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle,
  PackageOpen,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { formatAlertDate } from "@/utils/alertsGenerator";

export function AlertsOverview() {
  const { alerts, markAsViewed } = useAlerts();
  const navigate = useNavigate();

  // Get only the top 5 most recent alerts
  const recentAlerts = alerts.slice(0, 5);

  const getAlertIcon = (alert: Alert) => {
    switch (alert.type) {
      case "new-lead":
        return <Users className="h-4 w-4" />;
      case "reminder-due":
        return <Calendar className="h-4 w-4" />;
      case "low-servings":
        return <PackageOpen className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const handleAlertClick = (alert: Alert) => {
    markAsViewed(alert.id);
    
    // Navigate to the relevant page based on alert type
    switch (alert.type) {
      case "new-lead":
        navigate(`/admin/leads?highlight=${alert.leadId}`);
        break;
      case "reminder-due":
        navigate(`/admin/leads?highlight=${alert.leadId}`);
        break;
      case "low-servings":
        navigate(`/admin/clients/${alert.clientId}`);
        break;
      default:
        break;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-medium">התראות דחופות</CardTitle>
        <Button variant="link" size="sm" className="px-0" onClick={() => navigate("/admin/alerts")}>
          כל ההתראות <ArrowRight className="mr-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {recentAlerts.length > 0 ? (
          <div className="space-y-4">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 cursor-pointer ${
                  alert.status === "new" ? "border-primary" : "border-border"
                }`}
                onClick={() => handleAlertClick(alert)}
              >
                <div className={`${alert.severity === "high" ? "text-red-500" : "text-amber-500"}`}>
                  {getAlertIcon(alert)}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{alert.message}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatAlertDate(alert.timestamp)}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  {alert.status === "new" ? (
                    <span className="inline-flex h-2 w-2 rounded-full bg-primary"></span>
                  ) : (
                    <span className="inline-flex h-2 w-2 rounded-full bg-muted"></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
            <p className="text-muted-foreground">אין התראות דחופות כרגע</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
