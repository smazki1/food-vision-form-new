
import React from "react";
import { Submission } from "@/api/submissionApi";

interface SubmissionHeaderProps {
  submission: Submission;
}

const SubmissionHeader: React.FC<SubmissionHeaderProps> = ({ submission }) => {
  return (
    <div className="mb-6">
      <h2 className="text-3xl font-bold mb-1">{submission.item_name_at_submission}</h2>
      <p className="text-muted-foreground">
        {submission.clients?.restaurant_name} | {submission.submission_status}
      </p>
    </div>
  );
};

export default SubmissionHeader;
