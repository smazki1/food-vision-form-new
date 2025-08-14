
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Clicking should be disabled per request – remove Link wrapper

interface StatusCardProps {
  status: string;
  count: number;
  variant: string;
  displayText: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({ status, count, variant, displayText }) => {
  return (
    <div className="group select-none">
      <Card className="transition-all">
        <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
          <Badge variant={variant as any}>
            {displayText}
          </Badge>
          <p className="text-3xl font-bold">{count}</p>
          {/* Remove the clickable instruction */}
        </CardContent>
      </Card>
    </div>
  );
};
