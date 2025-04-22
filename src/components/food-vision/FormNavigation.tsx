import React, { useState } from "react";
import { FormStatusAlert } from "./FormStatusAlert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Database, Loader } from "lucide-react";

interface FormNavigationProps {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  isSubmitting: boolean;
  handleSubmit: () => void;
  isSubmitDisabled?: boolean;
  submissionStatus?: "success" | "error" | null;
  submissionMessage?: string;
  setSubmissionStatus?: (status: "success" | "error" | null) => void;
  setSubmissionMessage?: (msg: string) => void;
}

const FormNavigation: React.FC<FormNavigationProps> = ({
  activeTab,
  setActiveTab,
  isSubmitting,
  handleSubmit,
  isSubmitDisabled = false,
  submissionStatus,
  submissionMessage,
  setSubmissionStatus,
  setSubmissionMessage,
}) => {
  const [localStatus, setLocalStatus] = useState<"success" | "error" | null>(null);
  const [localMsg, setLocalMsg] = useState("");

  const open = (submissionStatus ?? localStatus) !== null;
  const status = submissionStatus ?? localStatus;
  const msg = submissionMessage ?? localMsg;

  const moveToPreviousTab = () => {
    if (activeTab === "dishes") setActiveTab("client");
    else if (activeTab === "cocktails") setActiveTab("dishes");
    else if (activeTab === "drinks") setActiveTab("cocktails");
    else if (activeTab === "additional") setActiveTab("drinks");
  };

  const moveToNextTab = () => {
    if (activeTab === "client") setActiveTab("dishes");
    else if (activeTab === "dishes") setActiveTab("cocktails");
    else if (activeTab === "cocktails") setActiveTab("drinks");
    else if (activeTab === "drinks") setActiveTab("additional");
  };

  const isFirstTab = activeTab === "client";
  const isLastTab = activeTab === "additional";

  const fileGuidelines = (
    <div className="w-full flex flex-col items-center justify-center mt-3 mb-2">
      <div className="w-full max-w-xl rounded bg-neutral-50 border text-xs md:text-sm p-2 text-center text-slate-600 shadow">
        תמיכה: עד 5MB לתמונה (פורמטים: jpg, jpeg, png, webp), עד 4 תמונות לכל פריט.<br/>
        קבצי מיתוג: עד 10MB, תמונה או PDF.
      </div>
    </div>
  );

  return (
    <div className="px-2 py-4 bg-white shadow-sm border-t w-full mt-auto flex flex-col items-center space-y-2">
      <FormStatusAlert
        open={open}
        status={status}
        message={msg}
        onClose={() => {
          setLocalStatus(null);
          setLocalMsg("");
          if (setSubmissionStatus) setSubmissionStatus(null);
          if (setSubmissionMessage) setSubmissionMessage("");
        }}
      />
      {fileGuidelines}

      <div className="flex justify-between items-center w-full max-w-lg mx-auto">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={moveToPreviousTab}
            disabled={isFirstTab || isSubmitting}
          >
            הקודם
          </Button>
          
          {!isLastTab ? (
            <Button type="button" onClick={moveToNextTab} disabled={isSubmitting}>
              הבא
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={async () => {
                setLocalStatus(null);
                setLocalMsg("");
                if (setSubmissionStatus) setSubmissionStatus(null);
                if (setSubmissionMessage) setSubmissionMessage("");
                try {
                  await handleSubmit();
                } catch (_) {
                  // status will be set by parent or toast
                }
              }}
              disabled={isSubmitting || isSubmitDisabled}
              className="w-32"
            >
              {isSubmitting ? (
                <span className="flex gap-2 items-center">
                  <Loader className="animate-spin" />
                  שולח...
                </span>
              ) : "שלח טופס"}
            </Button>
          )}
        </div>
        
        <a href="/admin" className="text-sm text-muted-foreground hover:text-primary flex items-center">
          <Database className="h-3 w-3 mr-1" />
          אזור ניהול
        </a>
      </div>
    </div>
  );
};

export default FormNavigation;
