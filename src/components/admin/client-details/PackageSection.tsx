
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BadgePlus, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AddServingsForm } from "./AddServingsForm";
import { Separator } from "@/components/ui/separator";
import ClientsPackageName from "../clients/ClientsPackageName";
import { Client } from "@/types/client";

interface PackageSectionProps {
  client: Client;
  onAddServings: (amount: number) => void;
  isAddingServings: boolean;
}

export function PackageSection({ client, onAddServings, isAddingServings }: PackageSectionProps) {
  const handleUpgradePackage = () => {
    toast.info("פונקציונליות שדרוג חבילה תהיה זמינה לאחר הטמעת מודול 2 (ניהול חבילות)");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>פרטי חבילה</CardTitle>
        <CardDescription>מידע על החבילה הנוכחית ומנות שנותרו</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-sm mb-1">חבילה נוכחית</h3>
            <div className="flex items-center">
              <ClientsPackageName packageId={client.current_package_id} />
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-1">מנות שנותרו</h3>
            <Badge variant="secondary" className="text-lg">
              {client.remaining_servings}
            </Badge>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-4">
          <h3 className="font-semibold text-sm">הוספת מנות באופן ידני</h3>
          <AddServingsForm onAddServings={onAddServings} isSubmitting={isAddingServings} />
        </div>

        <Separator className="my-4" />

        <div>
          <Button variant="outline" className="w-full" onClick={handleUpgradePackage}>
            <RefreshCw className="ml-2 h-4 w-4" />
            שדרג/שנה חבילה
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
