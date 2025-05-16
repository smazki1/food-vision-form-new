
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import EditorSidebar from "@/components/editor/EditorSidebar";
import EditorMobileNav from "@/components/editor/EditorMobileNav";
import { useEditorAuth } from "@/hooks/useEditorAuth";
import { NotificationCenter } from "@/components/admin/notifications/NotificationCenter";
import { useMobile } from "@/hooks/use-mobile";

const EditorLayout: React.FC = () => {
  const { isEditor, isLoading } = useEditorAuth();
  const isMobile = useMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">טוען...</div>;
  }
  
  if (!isEditor) {
    return null;
  }
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar for desktop */}
      <div className="hidden md:block border-r">
        <EditorSidebar />
      </div>
      
      {/* Mobile navigation */}
      {isMobile && (
        <EditorMobileNav 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          onOpen={() => setIsSidebarOpen(true)}
        />
      )}
      
      {/* Main content */}
      <div className="flex flex-1 flex-col w-full">
        <div className="flex justify-end items-center border-b px-6 py-2">
          <NotificationCenter />
        </div>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default EditorLayout;
