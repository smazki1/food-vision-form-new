
import React from "react";
import { Client } from "@/types/client";

interface WelcomeSectionProps {
  clientProfile: Client | null;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ clientProfile }) => {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold">שלום, {clientProfile?.contact_name || "לקוח יקר"}</h1>
      <p className="text-muted-foreground">ברוך הבא למערכת Food Vision</p>
    </div>
  );
};
