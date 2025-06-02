
import React from "react";
import { Alert } from "@/types/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";

interface AlertsFilterProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  alerts: Alert[];
}

export function AlertsFilter({ currentFilter, onFilterChange, alerts }: AlertsFilterProps) {
  const filterOptions = [
    { value: "all", label: "הכל", count: alerts.length },
    { value: "new", label: "חדשות", count: alerts.filter(alert => alert.status === "new").length },
    { value: "new-lead", label: "לידים חדשים", count: alerts.filter(alert => alert.type === "new-lead").length },
    { value: "reminder-due", label: "תזכורות", count: alerts.filter(alert => alert.type === "reminder-due").length },
    { value: "low-servings", label: "מנות נמוכות", count: alerts.filter(alert => alert.type === "low-servings").length },
  ];

  return (
    <div className="flex items-center gap-2 mb-4">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">סינון:</span>
      {filterOptions.map((option) => (
        <Button
          key={option.value}
          variant={currentFilter === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(option.value)}
          className="gap-2"
        >
          {option.label}
          <Badge variant="secondary" className="text-xs">
            {option.count}
          </Badge>
        </Button>
      ))}
    </div>
  );
}
