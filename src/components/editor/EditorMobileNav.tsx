
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import editorNavItems from "./EditorNavItems";

interface EditorMobileNavProps {
  onLogout: () => void;
}

const EditorMobileNav: React.FC<EditorMobileNavProps> = ({ onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">תפריט</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[385px]">
        <div className="flex flex-col h-full">
          <div className="flex h-14 items-center justify-between border-b px-4">
            <Link
              to="/editor/dashboard"
              className="flex items-center gap-2 font-semibold"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <img
                src="/favicon.ico"
                alt="Food Vision AI"
                className="h-6 w-6"
              />
              <span>Food Vision AI - עורך</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
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
                    onClick={() => setIsMobileMenuOpen(false)}
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
              <span>התנתקות</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EditorMobileNav;
