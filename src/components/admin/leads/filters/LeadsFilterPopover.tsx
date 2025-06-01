import React from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  LeadStatusEnum, 
  LeadSourceEnum, 
  LEAD_STATUS_DISPLAY, 
  LEAD_SOURCE_DISPLAY 
} from "@/types/lead";

interface LeadsFilterPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFiltersCount: number;
  leadStatus: LeadStatusEnum | "all";
  leadSource: LeadSourceEnum | "all";
  dateFilter: "today" | "this-week" | "this-month" | "all";
  onlyReminders: boolean;
  remindersToday: boolean;
  onLeadStatusChange: (value: LeadStatusEnum | "all") => void;
  onLeadSourceChange: (value: LeadSourceEnum | "all") => void;
  onDateFilterChange: (value: "today" | "this-week" | "this-month" | "all") => void;
  onOnlyRemindersChange: (value: boolean) => void;
  onRemindersTodayChange: (value: boolean) => void;
  onClearAllFilters: () => void;
}

export const LeadsFilterPopover: React.FC<LeadsFilterPopoverProps> = ({
  open,
  onOpenChange,
  activeFiltersCount,
  leadStatus,
  leadSource,
  dateFilter,
  onlyReminders,
  remindersToday,
  onLeadStatusChange,
  onLeadSourceChange,
  onDateFilterChange,
  onOnlyRemindersChange,
  onRemindersTodayChange,
  onClearAllFilters,
}) => {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="flex gap-2"
        >
          <Filter className="h-4 w-4" />
          <span>סינון</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-base">אפשרויות סינון</h3>
            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 gap-1 text-xs" 
                onClick={onClearAllFilters}
              >
                <X className="h-3 w-3" /> נקה הכל
              </Button>
            )}
          </div>
          
          {/* Lead Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">סטטוס ליד</label>
            <Select
              value={leadStatus}
              onValueChange={(val) => onLeadStatusChange(val as LeadStatusEnum | "all")}
            >
              <SelectTrigger>
                <SelectValue placeholder="כל הסטטוסים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                {Object.entries(LEAD_STATUS_DISPLAY).map(([enumKey, displayText]) => (
                  <SelectItem key={enumKey} value={enumKey as LeadStatusEnum}>
                    {displayText}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Lead Source Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">מקור ליד</label>
            <Select
              value={leadSource}
              onValueChange={(val) => onLeadSourceChange(val as LeadSourceEnum | "all")}
            >
              <SelectTrigger>
                <SelectValue placeholder="כל המקורות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל המקורות</SelectItem>
                {Object.entries(LEAD_SOURCE_DISPLAY).map(([enumKey, displayText]) => (
                  <SelectItem key={enumKey} value={enumKey as LeadSourceEnum}>
                    {displayText}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Creation Date Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">תאריך יצירה</label>
            <Select
              value={dateFilter}
              onValueChange={(val) => onDateFilterChange(val as "today" | "this-week" | "this-month" | "all")}
            >
              <SelectTrigger>
                <SelectValue placeholder="כל התאריכים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל התאריכים</SelectItem>
                <SelectItem value="today">היום</SelectItem>
                <SelectItem value="this-week">השבוע</SelectItem>
                <SelectItem value="this-month">החודש</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Reminder Filters */}
          <div className="space-y-2">
            <label className="text-sm font-medium">תזכורות</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="only-reminders" 
                  checked={onlyReminders} 
                  onCheckedChange={(val) => onOnlyRemindersChange(Boolean(val))} 
                />
                <label 
                  htmlFor="only-reminders" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mr-2"
                >
                  הצג רק לידים עם תזכורות
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="reminders-today" 
                  checked={remindersToday} 
                  onCheckedChange={(val) => onRemindersTodayChange(Boolean(val))} 
                />
                <label 
                  htmlFor="reminders-today" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mr-2"
                >
                  הצג רק לידים עם תזכורות להיום
                </label>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
