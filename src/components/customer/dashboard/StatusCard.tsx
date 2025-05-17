
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface StatusCardProps {
  status: string;
  count: number;
  variant: string;
  displayText: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({ status, count, variant, displayText }) => {
  return (
    <Link 
      to={`/customer/submissions?status=${encodeURIComponent(status)}`}
      className="group"
    >
      <Card className="transition-all group-hover:border-primary">
        <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
          <Badge variant={variant as any}>
            {displayText}
          </Badge>
          <p className="text-3xl font-bold">{count}</p>
          <p className="text-sm text-muted-foreground text-center">לחץ לצפייה</p>
        </CardContent>
      </Card>
    </Link>
  );
};
