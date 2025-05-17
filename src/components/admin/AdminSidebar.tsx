
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { adminNavItems } from "./AdminNavItems";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface AdminSidebarProps {
  onLogout: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onLogout }) => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname === path + "/";
  };
  
  return (
    <div className="h-full flex flex-col border-r">
      <div className="flex h-14 items-center border-b px-4">
        <NavLink to="/admin" className="flex items-center gap-2 font-bold">
          <img src="/favicon.ico" alt="Food Vision AI" className="h-6 w-6" />
          <span>Food Vision AI</span>
        </NavLink>
      </div>
      
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </NavLink>
          ))}
        </nav>
      </div>
      
      <div className="border-t p-4">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>התנתקות</span>
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;
