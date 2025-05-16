
import { useState, useEffect } from "react";
import { Submission } from "@/api/submissionApi";

export function useMaxEdits(submission: Submission, getMaxEditsAllowed: () => Promise<number>) {
  const [maxEdits, setMaxEdits] = useState<number>(1);
  
  useEffect(() => {
    const fetchMaxEdits = async () => {
      const max = await getMaxEditsAllowed();
      setMaxEdits(max);
    };
    
    fetchMaxEdits();
  }, [getMaxEditsAllowed]);
  
  return maxEdits;
}
