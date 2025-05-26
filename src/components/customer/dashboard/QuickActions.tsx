import React from "react";
import { QuickActionCard } from "./QuickActionCard";
// import { Package } from "lucide-react"; // Package icon no longer needed if first card is removed

export const QuickActions: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* REMOVED QuickActionCard for "הגשת פריטים חדשים" */}
      {/* 
      <QuickActionCard
        title="הגשת פריטים חדשים"
        description="הגישו מנות, קוקטיילים או משקאות חדשים לצילום ועריכה"
        icon={<Package className="h-6 w-6 text-primary" />}
        linkTo="/food-vision-form"
        buttonText="הגישו עכשיו"
      />
      */}

      <QuickActionCard
        title="הגלריה שלי"
        description="צפו בכל הפריטים המאושרים והמוכנים לשימוש"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
            <path d="M18 14h-8" />
            <path d="M15 18h-5" />
            <path d="M10 6h8v4h-8V6Z" />
          </svg>
        }
        linkTo="/customer/gallery"
        buttonText="פתיחת גלריה"
        buttonVariant="outline"
      />
    </div>
  );
};
