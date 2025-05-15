
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AssignPackageDialog } from "../client-details/assign-package";
import { BadgePlus, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AddServingsForm } from "./AddServingsForm";
import { Separator } from "@/components/ui/separator";
import ClientsPackageName from "../clients/ClientsPackageName";
import { Client } from "@/types/client";
import { assignPackageToClient } from "@/api/clientApi";

interface PackageSectionProps {
  client: Client;
  onAddServings: (amount: number) => void;
  isAddingServings: boolean;
  onClientUpdate?: () => void;
}

export function PackageSection({ 
  client, 
  onAddServings, 
  isAddingServings,
  onClientUpdate 
}: PackageSectionProps) {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssignPackage = async (values: any) => {
    try {
      setIsAssigning(true);
      await assignPackageToClient(
        client.client_id,
        values.packageId,
        values.servingsCount,
        values.notes,
        values.expirationDate
      );
      
      toast.success("החבילה הוקצתה בהצלחה");
      setIsAssignDialogOpen(false);
      
      // Refresh client data
      if (onClientUpdate) {
        onClientUpdate();
      }
    } catch (error) {
      console.error("Error assigning package to client:", error);
      toast.error("אירעה שגיאה בהקצאת החבילה");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <>
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

          <div className="flex flex-col gap-2">
            <Button 
              variant="default" 
              className="w-full" 
              onClick={() => setIsAssignDialogOpen(true)}
            >
              <RefreshCw className="ml-2 h-4 w-4" />
              {client.current_package_id ? 'שנה חבילה' : 'הקצה חבילה'}
            </Button>
            
            <Button variant="outline" className="w-full" onClick={() => toast.info("פונקציונליות היסטוריית חבילות תהיה זמינה בגרסה הבאה")}>
              צפה בהיסטוריית חבילות
            </Button>
          </div>
        </CardContent>
      </Card>

      <AssignPackageDialog
        client={client}
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        onAssignPackage={handleAssignPackage}
        isSubmitting={isAssigning}
      />
    </>
  );
}

