
import React from "react";
import { useNavigate } from "react-router-dom";
import { Alert } from "@/types/alert";
import { formatAlertDate } from "@/utils/alertsGenerator";
import { Bell, Calendar, Utensils, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AlertCardProps {
  alert: Alert;
  onView: (alertId: string) => void;
  onDismiss: (alertId: string) => void;
}

export function AlertCard({ alert, onView, onDismiss }: AlertCardProps) {
  const navigate = useNavigate();
  
  const getAlertIcon = () => {
    switch (alert.type) {
      case "new-lead":
        return <Bell className="h-5 w-5 text-blue-500" />;
      case "reminder-due":
        return <Calendar className="h-5 w-5 text-red-500" />;
      case "low-servings":
        return <Utensils className="h-5 w-5 text-amber-500" />;
    }
  };
  
  const getAlertBadgeVariant = () => {
    switch (alert.type) {
      case "new-lead":
        return "blue";
      case "reminder-due":
        return "destructive";
      case "low-servings":
        return "warning";
    }
  };
  
  const getAlertTypeText = () => {
    switch (alert.type) {
      case "new-lead":
        return "ליד חדש";
      case "reminder-due":
        return "תזכורת";
      case "low-servings":
        return "מנות בחבילה";
    }
  };
  
  const handleAlertAction = () => {
    onView(alert.id);
    
    if (alert.type === "new-lead" || alert.type === "reminder-due") {
      navigate(`/admin/leads`);
    } else if (alert.type === "low-servings") {
      navigate(`/admin/clients/${alert.clientId}`);
    }
  };
  
  return (
    <Card className={`mb-3 border-l-4 ${
      alert.status === "new" 
        ? "border-l-primary" 
        : "border-l-muted"
    }`}>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex gap-3 items-center">
          <div className="flex-shrink-0">
            {getAlertIcon()}
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Badge variant={getAlertBadgeVariant()}>
                {getAlertTypeText()}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatAlertDate(alert.timestamp)}
              </span>
            </div>
            
            <p className="text-sm font-medium mt-1">
              {alert.message}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            size="sm"
            variant="outline"
            className="h-8 px-3"
            onClick={handleAlertAction}
          >
            <Check className="h-4 w-4 mr-1" />
            טפל
          </Button>
          
          <Button 
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => onDismiss(alert.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
