
import React, { useState } from "react";
import { Bell, BellDot, Check, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/formatDate";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export const NotificationCenter: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  
  const unreadCount = notifications?.filter(n => !n.read_status).length || 0;
  
  const handleNotificationClick = (notificationId: string, link?: string) => {
    markAsRead(notificationId);
    setOpen(false);
    
    if (link) {
      navigate(link);
    }
  };
  
  const handleMarkAllAsRead = () => {
    markAllAsRead();
    toast.success("כל ההתראות סומנו כנקראו");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <>
              <BellDot className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            </>
          ) : (
            <Bell className="h-5 w-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 pb-2">
          <h3 className="font-medium">התראות</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={loading || unreadCount === 0}
          >
            סמן הכל כנקרא <Check className="mr-1 h-4 w-4" />
          </Button>
        </div>
        <Separator />
        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">טוען התראות...</div>
          ) : notifications?.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">אין התראות חדשות</div>
          ) : (
            <ul className="py-2">
              {notifications?.map((notification) => (
                <li 
                  key={notification.notification_id} 
                  className={cn(
                    "px-4 py-3 hover:bg-muted/50 cursor-pointer",
                    !notification.read_status && "bg-muted/20 border-r-4 border-primary"
                  )}
                  onClick={() => handleNotificationClick(notification.notification_id, notification.link)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className={cn("text-sm", !notification.read_status && "font-medium")}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.notification_id);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
