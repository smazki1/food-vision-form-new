
import { useState, useEffect } from "react";
import { Submission } from "@/api/submissionApi";
import { usePackageDetails } from "@/hooks/submission/usePackageDetails";

export function useMaxEdits(submission: Submission) {
  const [maxEdits, setMaxEdits] = useState(1); // Default to 1
  const [currentEditCount, setCurrentEditCount] = useState(0);
  const { getMaxEditsAllowed } = usePackageDetails();
  
  useEffect(() => {
    const fetchMaxEdits = async () => {
      const maxAllowedEdits = await getMaxEditsAllowed(submission);
      setMaxEdits(maxAllowedEdits);
    };
    
    fetchMaxEdits();
    
    // Set current edit count from submission
    setCurrentEditCount(submission.edit_count || 0);
  }, [submission]);
  
  return { maxEdits, currentEditCount };
}
