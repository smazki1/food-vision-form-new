
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ClientHeaderProps {
  restaurantName: string;
}

export const ClientHeader: React.FC<ClientHeaderProps> = ({ restaurantName }) => {
  return (
    <div className="flex items-center gap-2">
      <Link to="/admin/clients">
        <Button variant="outline" size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">{restaurantName}</h1>
    </div>
  );
};
