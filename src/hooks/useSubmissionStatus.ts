
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SubmissionStatus } from "@/api/submissionApi";
import { toast } from "sonner";

export function useSubmissionStatus() {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = useMutation({
    mutationFn: async ({ submissionId, status }: { submissionId: string; status: SubmissionStatus }) => {
      setIsUpdating(true);
      try {
        const { data, error } = await supabase
          .from("customer_submissions")
          .update({ submission_status: status })
          .eq("submission_id", submissionId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } finally {
        setIsUpdating(false);
      }
    },
    onSuccess: (data) => {
      toast.success(`סטטוס משימה עודכן ל: ${data.submission_status}`);
      queryClient.invalidateQueries({ queryKey: ["editor-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["submission", data.submission_id] });
    },
    onError: (error) => {
      toast.error(`שגיאה בעדכון סטטוס: ${error instanceof Error ? error.message : "שגיאה לא ידועה"}`);
    },
  });

  return {
    updateStatus,
    isUpdating
  };
}
