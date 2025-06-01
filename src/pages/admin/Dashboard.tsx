import React from "react";
import { useAlerts } from "@/hooks/useAlerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, ChevronLeft } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { alerts, upcomingReminders } = useAlerts();
  const { leads } = useLeads({});
  const router = useRouter();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayReminders = upcomingReminders.filter(lead => {
    if (!lead.next_follow_up_date) return false;
    const reminderDate = new Date(lead.next_follow_up_date);
    return reminderDate.getTime() === today.getTime();
  });

  const handleReminderClick = (leadId: string) => {
    router.push(`/admin/leads?leadId=${leadId}`);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">תזכורות להיום</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {todayReminders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">אין תזכורות להיום</p>
                ) : (
                  todayReminders.map((lead) => (
                    <div 
                      key={lead.lead_id} 
                      className="flex items-center justify-between p-2 bg-muted rounded cursor-pointer hover:bg-muted/80"
                      onClick={() => handleReminderClick(lead.lead_id)}
                    >
                      <div>
                        <p className="text-sm font-medium">{lead.restaurant_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {lead.next_follow_up_date && new Date(lead.next_follow_up_date).toLocaleTimeString('he-IL', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      <ChevronLeft className="h-4 w-4" />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
