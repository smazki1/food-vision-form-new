
import React from "react";
import { LeadStatusEnum } from "@/types/lead";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: LeadStatusEnum;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusBadgeVariant = (status: LeadStatusEnum) => {
    switch (status) {
      case LeadStatusEnum.NEW:
        return "new-lead";
      case LeadStatusEnum.IN_TREATMENT:
        return "initial-contact";
      case LeadStatusEnum.INTERESTED:
        return "interested";
      case LeadStatusEnum.NOT_INTERESTED:
        return "not-interested";
      case LeadStatusEnum.CONVERTED_TO_CLIENT:
        return "converted";
      case LeadStatusEnum.ARCHIVED:
        return "archived";
      default:
        return "default";
    }
  };

  return <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>;
};
