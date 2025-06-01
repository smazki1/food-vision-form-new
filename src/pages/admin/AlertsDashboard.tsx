
import React, { useState } from "react";
import { useAlerts } from "@/hooks/useAlerts";
import { AlertType } from "@/types/alert";
import { AlertsList } from "@/components/admin/alerts/AlertsList";
import { RemindersSchedule } from "@/components/admin/alerts/RemindersSchedule";
import { Bell, Calendar, Utensils } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlaceholderCard } from "@/components/admin/client-details/PlaceholderCard";

const AlertsDashboard: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState<AlertType | "all">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  
  // Get alerts data
  const { 
    alerts, 
    allAlertsCount,
    filteredAlertsCount,
    upcomingReminders,
    markAsViewed, 
    dismissAlert,
    markAllAsViewed
  } = useAlerts({ typeFilter });
  
  // Apply sorting
  const sortedAlerts = [...alerts].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">דאשבורד התראות</h1>
      </div>

      {/* Filters and controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex gap-2">
          <Button
            variant={typeFilter === "all" ? "default" : "outline"}
            onClick={() => setTypeFilter("all")}
            className="flex-1 sm:flex-none"
          >
            הכל ({allAlertsCount})
          </Button>
          
          <Button
            variant={typeFilter === "new-lead" ? "default" : "outline"}
            onClick={() => setTypeFilter("new-lead")}
            className="flex-1 sm:flex-none"
          >
            <Bell className="h-4 w-4 mr-2" />
            לידים חדשים
          </Button>
          
          <Button
            variant={typeFilter === "reminder-due" ? "default" : "outline"}
            onClick={() => setTypeFilter("reminder-due")}
            className="flex-1 sm:flex-none"
          >
            <Calendar className="h-4 w-4 mr-2" />
            תזכורות
          </Button>
          
          <Button
            variant={typeFilter === "low-servings" ? "default" : "outline"}
            onClick={() => setTypeFilter("low-servings")}
            className="flex-1 sm:flex-none"
          >
            <Utensils className="h-4 w-4 mr-2" />
            מנות נמוכות
          </Button>
        </div>
        
        <div className="w-full sm:w-32">
          <Select
            value={sortOrder}
            onValueChange={(value) => setSortOrder(value as "newest" | "oldest")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="מיון" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">החדש ביותר</SelectItem>
              <SelectItem value="oldest">הישן ביותר</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Alerts list */}
      {filteredAlertsCount > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <AlertsList
              alerts={sortedAlerts}
              onMarkAllViewed={markAllAsViewed}
              onViewAlert={markAsViewed}
              onDismissAlert={dismissAlert}
            />
          </CardContent>
        </Card>
      ) : (
        <PlaceholderCard
          title="אין התראות"
          description={`לא נמצאו התראות ${typeFilter !== "all" ? "מסוג זה" : ""}`}
          message="התראות חדשות יופיעו כאן כאשר יתקבלו לידים חדשים, תזכורות פעילות, או כאשר ללקוחות יש מעט מנות בחבילה"
          icon={<Bell className="h-12 w-12 text-muted-foreground" />}
        />
      )}

      {/* Reminders schedule */}
      <RemindersSchedule reminders={upcomingReminders} />
    </div>
  );
};

export default AlertsDashboard;
