
import React from "react";
import { Link, Outlet } from "react-router-dom";
import { useEditorAuth } from "@/hooks/useEditorAuth";
import EditorSidebar from "@/components/editor/EditorSidebar";
import EditorMobileNav from "@/components/editor/EditorMobileNav";

const EditorLayout: React.FC = () => {
  const { isAuthenticated, isChecking, role, isRoleLoading, handleLogout } = useEditorAuth();
  
  // Show loading state while checking auth
  if (isChecking || isRoleLoading) {
    return <div className="flex justify-center items-center min-h-screen">טוען...</div>;
  }
  
  // Only render the editor layout if authenticated and has editor role
  if (!isAuthenticated || role !== 'editor') {
    return null;
  }
  
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <EditorSidebar onLogout={handleLogout} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="h-14 border-b flex items-center justify-between px-4 md:hidden">
          <Link to="/editor/dashboard" className="font-medium flex items-center">
            <img
              src="/favicon.ico"
              alt="Food Vision AI"
              className="h-6 w-6 mr-2"
            />
            Food Vision AI - עורך
          </Link>
          <EditorMobileNav onLogout={handleLogout} />
        </header>
        
        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default EditorLayout;
