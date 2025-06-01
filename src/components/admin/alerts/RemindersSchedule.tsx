import React, { useState } from "react";
import { Lead } from "@/types/models";
import { format, isSameDay, startOfWeek, addDays, isToday } from "date-fns";
import { he } from "date-fns/locale";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ReminderCell } from "@/components/admin/leads/ReminderCell";
import { useNavigate } from "react-router-dom";

interface RemindersScheduleProps {
  reminders: Lead[];
}

export function RemindersSchedule({ reminders }: RemindersScheduleProps) {
  const navigate = useNavigate();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
  const [view, setView] = useState<"day" | "week">("day");
  
  // Filter reminders for selected date or week
  const filteredReminders = reminders.filter(lead => {
    if (!lead.reminder_at) return false;
    
    const reminderDate = new Date(lead.reminder_at);
    
    if (view === "day" && selectedDate) {
      return isSameDay(reminderDate, selectedDate);
    }
    
    if (view === "week" && selectedDate) {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const weekEnd = addDays(weekStart, 6);
      return reminderDate >= weekStart && reminderDate <= weekEnd;
    }
    
    return false;
  });
  
  const handleViewLead = (leadId: string) => {
    navigate(`/admin/leads`);
  };
  
  // Days with reminders for the calendar
  const hasReminderDay = (date: Date) => {
    return reminders.some(lead => {
      if (!lead.reminder_at) return false;
      return isSameDay(new Date(lead.reminder_at), date);
    });
  };
  
  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">לוח זמנים תזכורות</CardTitle>
          
          <div className="flex gap-2">
            <Button 
              variant={view === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("day")}
            >
              יומי
            </Button>
            <Button 
              variant={view === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("week")}
            >
              שבועי
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calendar */}
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiersStyles={{
                today: { 
                  fontWeight: "bold",
                  border: "2px solid currentColor"
                },
                hasReminder: {
                  backgroundColor: "var(--primary-50)",
                  color: "var(--primary-900)",
                  fontWeight: "bold"
                }
              }}
              modifiers={{
                hasReminder: hasReminderDay
              }}
            />
          </div>
          
          {/* Reminders list */}
          <div>
            <h3 className="font-medium mb-3">
              {view === "day" && selectedDate && (
                <>
                  תזכורות ל{isToday(selectedDate) ? "היום" : format(selectedDate, "dd/MM/yyyy")}
                </>
              )}
              {view === "week" && selectedDate && (
                <>
                  תזכורות לשבוע
                </>
              )}
              {filteredReminders.length > 0 && ` (${filteredReminders.length})`}
            </h3>
            
            {filteredReminders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                אין תזכורות בתאריך זה
              </p>
            ) : (
              <div className="space-y-3">
                {filteredReminders.map(lead => (
                  <div 
                    key={lead.id} 
                    className="p-3 border rounded-md cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewLead(lead.id)}
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{lead.restaurant_name}</span>
                      <ReminderCell reminderDate={lead.reminder_at} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">{lead.contact_name}</span>
                      <Badge variant={lead.lead_status === "מעוניין" ? "success" : "secondary"}>
                        {lead.lead_status}
                      </Badge>
                    </div>
                    {lead.reminder_details && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {lead.reminder_details}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
