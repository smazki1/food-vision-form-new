
import React from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { Home, Image, LogOut } from "lucide-react";

export interface EditorNavItemsProps {
  onLogout: () => void;
}

const EditorNavItems = ({ onLogout }: EditorNavItemsProps) => {
  const location = useLocation();

  // Check if the path starts with the given path
  const isActive = (path: string): boolean => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col gap-1 h-full">
      <div className="space-y-1">
        <Button
          variant={isActive("/editor/dashboard") ? "secondary" : "ghost"}
          className="w-full justify-start"
          asChild
        >
          <Link to="/editor/dashboard">
            <Home className="ml-2 h-4 w-4" />
            דף הבית
          </Link>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive mt-auto"
          onClick={onLogout}
        >
          <LogOut className="ml-2 h-4 w-4" />
          התנתקות
        </Button>
      </div>
    </div>
  );
};

export default EditorNavItems;
