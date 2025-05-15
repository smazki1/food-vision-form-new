
import React from "react";
import { Alert } from "@/types/alert";
import { AlertCard } from "./AlertCard";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface AlertsListProps {
  alerts: Alert[];
  onMarkAllViewed: () => void;
  onViewAlert: (alertId: string) => void;
  onDismissAlert: (alertId: string) => void;
}

export function AlertsList({ 
  alerts, 
  onMarkAllViewed, 
  onViewAlert, 
  onDismissAlert 
}: AlertsListProps) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        אין התראות חדשות
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">התראות ({alerts.length})</h3>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={onMarkAllViewed}
          disabled={alerts.length === 0}
        >
          <Check className="h-4 w-4 mr-2" />
          סמן הכל כנצפה
        </Button>
      </div>
      
      <div className="space-y-3">
        {alerts.map(alert => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onView={onViewAlert}
            onDismiss={onDismissAlert}
          />
        ))}
      </div>
    </div>
  );
}
