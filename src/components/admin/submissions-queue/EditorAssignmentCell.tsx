
import React, { useState } from "react";
import { useAllEditors } from "@/hooks/useAllEditors";
import { useAssignSubmission } from "@/hooks/useAssignSubmission";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EditorAssignmentCellProps {
  submissionId: string;
  currentEditorId: string | null;
}

export const EditorAssignmentCell: React.FC<EditorAssignmentCellProps> = ({
  submissionId,
  currentEditorId,
}) => {
  const { editors, isLoading: isLoadingEditors } = useAllEditors();
  const [selectedEditorId, setSelectedEditorId] = useState<string | null>(currentEditorId);
  
  const { assignEditor, isAssigning } = useAssignSubmission();
  
  const handleAssignment = async () => {
    if (!selectedEditorId) {
      toast.error("יש לבחור עורך להקצאה");
      return;
    }
    
    try {
      await assignEditor({
        submissionId,
        editorId: selectedEditorId,
        isTransfer: !!currentEditorId
      });
      
      toast.success(currentEditorId 
        ? "המשימה הועברה בהצלחה" 
        : "המשימה הוקצתה בהצלחה"
      );
    } catch (error) {
      toast.error("שגיאה בהקצאת המשימה");
      console.error("Assignment error:", error);
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <Select 
        value={selectedEditorId || ""} 
        onValueChange={setSelectedEditorId}
        disabled={isLoadingEditors || isAssigning}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="בחר עורך" />
        </SelectTrigger>
        <SelectContent>
          {editors.map(editor => (
            <SelectItem 
              key={editor.id} 
              value={editor.id}
            >
              <div className="flex items-center justify-between w-full">
                <span>{editor.name || editor.email}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs bg-secondary rounded-full px-2 ml-2">
                        {editor.tasksCount}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>משימות פעילות</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button 
        onClick={handleAssignment}
        disabled={!selectedEditorId || selectedEditorId === currentEditorId || isAssigning}
        size="sm"
      >
        {isAssigning ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : currentEditorId ? (
          "העבר"
        ) : (
          "הקצה"
        )}
      </Button>
    </div>
  );
};
