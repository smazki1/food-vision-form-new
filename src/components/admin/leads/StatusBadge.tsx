
import React from "react";
import { LeadStatus } from "@/types/lead";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: LeadStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusBadgeVariant = (status: LeadStatus) => {
    switch (status) {
      case "ליד חדש":
        return "new-lead";
      case "פנייה ראשונית בוצעה":
        return "initial-contact";
      case "מעוניין":
        return "interested";
      case "לא מעוניין":
        return "not-interested";
      case "נקבעה פגישה/שיחה":
        return "meeting-scheduled";
      case "הדגמה בוצעה":
        return "demo-completed";
      case "הצעת מחיר נשלחה":
        return "quote-sent";
      case "ממתין לתשובה":
        return "awaiting-response";
      case "הפך ללקוח":
        return "converted";
      default:
        return "default";
    }
  };

  return <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>;
};
