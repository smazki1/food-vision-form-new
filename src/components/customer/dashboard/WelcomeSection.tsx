import React from "react";
import { Client } from "@/types/client";

interface WelcomeSectionProps {
  clientProfile: Client | null;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ clientProfile }) => {
  return (
    <div className="w-full mb-6 text-center">
      <h1 className="text-3xl font-bold">שלום, {clientProfile?.contact_name || "לקוח/ה יקר/ה"}</h1>
      <p className="text-muted-foreground">ברוכים הבאים למערכת Food Vision</p>
    </div>
  );
};
