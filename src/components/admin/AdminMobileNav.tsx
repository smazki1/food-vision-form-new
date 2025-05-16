
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { adminNavItems } from "./AdminNavItems"; 
import { NotificationCenter } from "./notifications/NotificationCenter";

interface AdminMobileNavProps {
  onLogout: () => void;
}

const AdminMobileNav: React.FC<AdminMobileNavProps> = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex items-center justify-between p-4 border-b md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">תפריט</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[350px]">
          <div className="flex h-full flex-col">
            <div className="flex justify-between items-center border-b py-4">
              <NavLink
                to="/admin/dashboard"
                className="flex items-center gap-2 font-bold"
                onClick={() => setIsOpen(false)}
              >
                <img src="/favicon.ico" alt="Food Vision AI" className="h-6 w-6" />
                <span>Food Vision AI</span>
              </NavLink>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-auto py-4">
              <nav className="grid gap-2">
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
                    onClick={() => setIsOpen(false)}
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
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
              >
                <LogOut className="h-4 w-4" />
                <span>התנתקות</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      <NavLink to="/admin/dashboard" className="flex items-center gap-2 font-bold">
        <img src="/favicon.ico" alt="Food Vision AI" className="h-6 w-6" />
        <span className="font-semibold">Food Vision AI</span>
      </NavLink>
      
      <div className="flex items-center">
        <NotificationCenter />
      </div>
    </div>
  );
};

export default AdminMobileNav;
