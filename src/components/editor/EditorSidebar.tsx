import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import editorNavItems from "./EditorNavItems";

interface EditorSidebarProps {
  onLogout: () => void;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({ onLogout }) => {
  const location = useLocation();

  return (
    <div className="w-64 hidden md:block shadow-md">
      <div className="flex h-full flex-col border-r bg-background">
        <div className="flex h-14 items-center border-b px-4">
          <Link
            to="/editor"
            className="flex items-center gap-2 font-semibold"
          >
            <img
              src="/favicon.ico"
              alt="Food Vision AI"
              className="h-6 w-6"
            />
            <span>Food Vision AI - Editor</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <div className="grid gap-1 px-2">
            {editorNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="border-t p-4">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditorSidebar;
