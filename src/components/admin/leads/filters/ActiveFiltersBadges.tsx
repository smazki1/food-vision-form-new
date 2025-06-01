import React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeadStatus, LeadSource } from "@/types/models";

interface ActiveFiltersBadgesProps {
  leadStatus: LeadStatus | "all";
  leadSource: LeadSource | "all";
  dateFilter: "today" | "this-week" | "this-month" | "all";
  onlyReminders: boolean;
  remindersToday: boolean;
  onClearLeadStatus: () => void;
  onClearLeadSource: () => void;
  onClearDateFilter: () => void;
  onClearOnlyReminders: () => void;
  onClearRemindersToday: () => void;
  onClearAll: () => void;
}

export const ActiveFiltersBadges: React.FC<ActiveFiltersBadgesProps> = ({
  leadStatus,
  leadSource,
  dateFilter,
  onlyReminders,
  remindersToday,
  onClearLeadStatus,
  onClearLeadSource,
  onClearDateFilter,
  onClearOnlyReminders,
  onClearRemindersToday,
  onClearAll,
}) => {
  const activeFiltersCount = [
    leadStatus !== "all", 
    leadSource !== "all", 
    dateFilter !== "all", 
    onlyReminders, 
    remindersToday
  ].filter(Boolean).length;

  if (activeFiltersCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm text-muted-foreground">סינון לפי:</span>
      {leadStatus !== "all" && (
        <Badge variant="outline" className="flex gap-1 items-center">
          סטטוס: {leadStatus}
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={onClearLeadStatus} 
          />
        </Badge>
      )}
      {leadSource !== "all" && (
        <Badge variant="outline" className="flex gap-1 items-center">
          מקור: {leadSource}
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={onClearLeadSource} 
          />
        </Badge>
      )}
      {dateFilter !== "all" && (
        <Badge variant="outline" className="flex gap-1 items-center">
          תאריך: {
            dateFilter === "today" ? "היום" : 
            dateFilter === "this-week" ? "השבוע" : 
            "החודש"
          }
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={onClearDateFilter} 
          />
        </Badge>
      )}
      {onlyReminders && (
        <Badge variant="outline" className="flex gap-1 items-center">
          עם תזכורות
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={onClearOnlyReminders} 
          />
        </Badge>
      )}
      {remindersToday && (
        <Badge variant="outline" className="flex gap-1 items-center">
          תזכורות להיום
          <X 
            className="h-3 w-3 cursor-pointer" 
            onClick={onClearRemindersToday} 
          />
        </Badge>
      )}
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 text-xs" 
        onClick={onClearAll}
      >
        נקה הכל
      </Button>
    </div>
  );
};
