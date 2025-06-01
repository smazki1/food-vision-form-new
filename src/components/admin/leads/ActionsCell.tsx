import React from "react";
import { Button } from "@/components/ui/button";
import { Lead } from "@/types/models";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, MoreHorizontal, Trash2, UserPlus } from "lucide-react";

interface ActionsCellProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onConvertToClient: (lead: Lead) => void;
}

export const ActionsCell: React.FC<ActionsCellProps> = ({
  lead,
  onEdit,
  onDelete,
  onConvertToClient,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(lead)}>
          <Edit className="mr-2 h-4 w-4" />
          עריכה
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(lead.lead_id)}>
          <Trash2 className="mr-2 h-4 w-4" />
          מחיקה
        </DropdownMenuItem>
        {lead.lead_status !== "הפך ללקוח" && (
          <DropdownMenuItem onClick={() => onConvertToClient(lead)}>
            <UserPlus className="mr-2 h-4 w-4" />
            המר ללקוח
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
