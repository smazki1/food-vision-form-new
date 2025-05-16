
import React from "react";
import InternalNotesTab from "@/components/editor/submission/InternalNotesTab";

interface InternalNotesTabContentProps {
  internalTeamNotes: string | null;
  onAddNote: (note: string) => Promise<boolean>;
}

const InternalNotesTabContent: React.FC<InternalNotesTabContentProps> = ({
  internalTeamNotes,
  onAddNote,
}) => {
  return (
    <InternalNotesTab
      internalTeamNotes={internalTeamNotes}
      onAddNote={onAddNote}
    />
  );
};

export default InternalNotesTabContent;
