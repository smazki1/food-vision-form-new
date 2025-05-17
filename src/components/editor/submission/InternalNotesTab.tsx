
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface InternalNotesTabProps {
  internalTeamNotes: string | null;
  onAddNote: (note: string) => void;
}

const InternalNotesTab: React.FC<InternalNotesTabProps> = ({ 
  internalTeamNotes, 
  onAddNote 
}) => {
  const [internalNote, setInternalNote] = useState("");

  const handleAddNote = () => {
    onAddNote(internalNote);
    setInternalNote("");
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">הערות פנימיות</h3>
      <div className="mb-3 bg-slate-50 p-3 rounded-md max-h-60 overflow-y-auto">
        {internalTeamNotes ? (
          <pre className="text-sm whitespace-pre-wrap font-sans">
            {internalTeamNotes}
          </pre>
        ) : (
          <p className="text-muted-foreground">אין הערות פנימיות</p>
        )}
      </div>
      <Textarea
        placeholder="הוסף הערה פנימית לגבי המשימה..."
        value={internalNote}
        onChange={(e) => setInternalNote(e.target.value)}
        className="mb-2"
      />
      <Button 
        onClick={handleAddNote}
        disabled={!internalNote.trim()}
        className="w-full"
      >
        שמור הערה פנימית
      </Button>
    </div>
  );
};

export default InternalNotesTab;
