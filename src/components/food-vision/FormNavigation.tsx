
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Loader } from "lucide-react";

interface FormNavigationProps {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  isSubmitting: boolean;
  handleSubmit: () => void;
  isSubmitDisabled?: boolean;
}

const FormNavigation: React.FC<FormNavigationProps> = ({
  activeTab,
  setActiveTab,
  isSubmitting,
  handleSubmit,
  isSubmitDisabled = false,
}) => {
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

  // Debug log to check why the button might be disabled
  console.log('Submit button state:', { isSubmitting, isSubmitDisabled });

  return (
    <div className="px-4 py-4 bg-white shadow-sm border-t w-full mt-auto">
      <div className="flex flex-col items-center w-full">
        <div className="flex items-center gap-4 w-full justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={moveToPreviousTab}
            disabled={isFirstTab || isSubmitting}
          >
            הקודם
          </Button>
          {!isLastTab ? (
            <Button
              type="button"
              onClick={moveToNextTab}
              disabled={isSubmitting}
            >
              הבא
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex gap-2 items-center">
                  <Loader className="animate-spin" />
                  שלח טופס
                </span>
              ) : (
                "שלח טופס"
              )}
            </Button>
          )}
        </div>
        {/* Move Admin button here, less prominent */}
        <div className="mt-4">
          <Link
            to="/admin"
            className="text-xs text-muted-foreground border px-3 py-1 rounded hover:text-primary hover:border-primary flex items-center"
            tabIndex={isSubmitting ? -1 : 0}
          >
            אזור ניהול
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FormNavigation;
