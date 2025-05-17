
import React from "react";
import ClientFeedbackTab from "@/components/editor/submission/ClientFeedbackTab";
import { Submission } from "@/api/submissionApi";

interface ClientFeedbackTabContentProps {
  submission: Submission;
  maxEdits: number;
  responseToClient: string;
  setResponseToClient: (value: string) => void;
}

const ClientFeedbackTabContent: React.FC<ClientFeedbackTabContentProps> = ({
  submission,
  maxEdits,
  responseToClient,
  setResponseToClient,
}) => {
  return (
    <ClientFeedbackTab
      submission={submission}
      maxEdits={maxEdits}
      responseToClient={responseToClient}
      setResponseToClient={setResponseToClient}
    />
  );
};

export default ClientFeedbackTabContent;
