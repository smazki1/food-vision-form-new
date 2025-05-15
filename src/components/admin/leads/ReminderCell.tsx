
import React from "react";
import { AlertCircle, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";

interface ReminderCellProps {
  reminderDate: string | null;
}

export const ReminderCell: React.FC<ReminderCellProps> = ({ reminderDate }) => {
  if (!reminderDate) return <span>-</span>;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  const isReminderOverdue = (reminderDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const reminder = new Date(reminderDate);
    reminder.setHours(0, 0, 0, 0);
    
    return reminder < today;
  };

  const isReminderToday = (reminderDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const reminder = new Date(reminderDate);
    reminder.setHours(0, 0, 0, 0);
    
    return reminder.getTime() === today.getTime();
  };

  const getReminderIcon = (reminderDate: string) => {
    if (isReminderOverdue(reminderDate)) {
      return <AlertCircle className="h-4 w-4 text-destructive mr-1" />;
    }
    if (isReminderToday(reminderDate)) {
      return <Clock className="h-4 w-4 text-blue-600 mr-1" />;
    }
    return <Calendar className="h-4 w-4 text-muted-foreground mr-1" />;
  };

  return (
    <div className="flex items-center">
      {getReminderIcon(reminderDate)}
      {formatDate(reminderDate)}
    </div>
  );
};
