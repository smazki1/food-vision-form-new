
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Users, 
  FileText, 
  BarChart4, 
  UserPlus,
  Bell,
  Package,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminNavbarProps {
  onLogout?: () => void;
}

const navItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/admin/dashboard",
  },
  {
    title: "לידים",
    icon: UserPlus,
    href: "/admin/leads",
  },
  {
    title: "לקוחות",
    icon: Users,
    href: "/admin/clients",
  },
  {
    title: "התראות",
    icon: Bell,
    href: "/admin/alerts",
  },
  {
    title: "הגשות",
    icon: FileText,
    href: "/admin/submissions",
  },
  {
    title: "חבילות",
    icon: Package,
    href: "/admin/packages",
  },
  {
    title: "אנליטיקס",
    icon: BarChart4,
    href: "/admin/analytics",
  },
];

const AdminNavbar: React.FC<AdminNavbarProps> = ({ onLogout }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="flex flex-col h-full border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <Link
          to="/admin/dashboard"
          className="flex items-center gap-2 font-semibold"
        >
          <img
            src="/favicon.ico"
            alt="Food Vision AI"
            className="h-6 w-6"
          />
          <span>Food Vision AI</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <div className="grid gap-1 px-2">
          {navItems.map((item) => {
            const isActive = currentPath === item.href;
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
        {onLogout && (
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>התנתקות</span>
          </Button>
        )}
      </div>
    </nav>
  );
};

export default AdminNavbar;
