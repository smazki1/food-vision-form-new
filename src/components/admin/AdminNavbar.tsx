
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Database, Search, Users, Home, FileText, BarChart2 } from "lucide-react";

const AdminNavbar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    navigate("/admin");
  };

  return (
    <nav className="bg-primary text-primary-foreground p-4 flex flex-col h-full">
      <div className="flex items-center mb-8">
        <Database className="mr-2 h-6 w-6" />
        <h1 className="text-xl font-bold">Food Vision Admin</h1>
      </div>
      
      <div className="space-y-2 flex-1">
        <Link to="/admin/dashboard" className="flex items-center p-2 rounded-md hover:bg-primary/80">
          <Home className="mr-2 h-5 w-5" />
          <span>דף הבית</span>
        </Link>
        <Link to="/admin/clients" className="flex items-center p-2 rounded-md hover:bg-primary/80">
          <Users className="mr-2 h-5 w-5" />
          <span>לקוחות</span>
        </Link>
        <Link to="/admin/submissions" className="flex items-center p-2 rounded-md hover:bg-primary/80">
          <FileText className="mr-2 h-5 w-5" />
          <span>הגשות</span>
        </Link>
        <Link to="/admin/analytics" className="flex items-center p-2 rounded-md hover:bg-primary/80">
          <BarChart2 className="mr-2 h-5 w-5" />
          <span>אנליטיקס</span>
        </Link>
      </div>
      
      <div className="mt-auto">
        <Button variant="outline" className="w-full" onClick={handleLogout}>
          התנתקות
        </Button>
      </div>
    </nav>
  );
};

export default AdminNavbar;
