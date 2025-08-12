
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Home,
  Users,
  Package,
  MessageSquare,
  Bell,
  Settings,
  User,
  LogOut,
  BarChart,
  FileSpreadsheet,
  ClipboardList,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  title: string;
  isActive: boolean;
  badge?: number;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon: Icon, title, isActive, badge }) => (
  <Link
    to={href}
    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
      isActive
        ? "bg-secondary text-secondary-foreground"
        : "text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground"
    }`}
  >
    <Icon className="h-4 w-4" />
    {title}
    {badge && (
      <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
        {badge}
      </span>
    )}
  </Link>
);

interface AdminNavbarProps {
  onLogout: () => void;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({ onLogout }) => {
  const location = useLocation();
  
  // Get pending public submissions count
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['pending-public-submissions-count'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('public_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (error) {
        console.error('Error fetching pending submissions count:', error);
        return 0;
      }
      
      return data || 0;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname === path + "/";
  };
  
  return (
    <div className="h-full flex flex-col border-r">
      <div className="flex h-14 items-center border-b px-4">
        <Link to="/admin" className="flex items-center gap-2 font-bold">
          <img src="/favicon.ico" alt="Food Vision AI" className="h-6 w-6" />
          <span>Food Vision AI</span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          <NavItem
            href="/admin/dashboard"
            icon={Home}
            title="דאשבורד"
            isActive={isActive("/admin") || isActive("/admin/dashboard")}
          />
          <NavItem
            href="/admin/leads"
            icon={MessageSquare}
            title="לידים"
            isActive={isActive("/admin/leads")}
          />
          <NavItem
            href="/admin/clients"
            icon={Users}
            title="לקוחות"
            isActive={isActive("/admin/clients")}
          />
          <NavItem
            href="/admin/packages"
            icon={Package}
            title="חבילות"
            isActive={isActive("/admin/packages")}
          />
          <NavItem
            href="/admin/submissions"
            icon={FileSpreadsheet}
            title="הגשות"
            isActive={isActive("/admin/submissions")}
          />
          <NavItem
            href="/admin/public-submissions"
            icon={Globe}
            title="הגשות אנונימיות"
            isActive={isActive("/admin/public-submissions")}
            badge={pendingCount > 0 ? pendingCount : undefined}
          />
          <NavItem
            href="/admin/submissions-queue"
            icon={ClipboardList}
            title="תור הגשות"
            isActive={isActive("/admin/submissions-queue")}
          />
          <NavItem
            href="/admin/analytics"
            icon={BarChart}
            title="אנליטיקס"
            isActive={isActive("/admin/analytics")}
          />
          <NavItem
            href="/admin/alerts"
            icon={Bell}
            title="התראות"
            isActive={isActive("/admin/alerts")}
          />
          <NavItem
            href="/admin/users"
            icon={User}
            title="משתמשים"
            isActive={isActive("/admin/users")}
          />
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

export default AdminNavbar;
