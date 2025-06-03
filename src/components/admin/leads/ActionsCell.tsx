import React from "react";
import { Button } from "@/components/ui/button";
import { Lead } from "@/types/lead";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, MoreHorizontal, Trash2, UserPlus } from "lucide-react";
import { useDirectConvertLeadToClient } from "@/hooks/useEnhancedLeads";

interface ActionsCellProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onConvertToClient?: (lead: Lead) => void; // Made optional since we'll handle conversion directly
}

export const ActionsCell: React.FC<ActionsCellProps> = ({
  lead,
  onEdit,
  onDelete,
}) => {
  const convertToClientMutation = useDirectConvertLeadToClient();

  const handleDirectConversion = async () => {
    await convertToClientMutation.mutateAsync(lead.lead_id);
  };

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
        <DropdownMenuItem onClick={() => onDelete(lead.id)}>
          <Trash2 className="mr-2 h-4 w-4" />
          מחיקה
        </DropdownMenuItem>
        {lead.lead_status !== "הפך ללקוח" && (
          <DropdownMenuItem 
            onClick={handleDirectConversion}
            disabled={convertToClientMutation.isPending}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {convertToClientMutation.isPending ? 'המרה...' : 'המר ללקוח'}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
