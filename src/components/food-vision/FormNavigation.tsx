
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Database } from "lucide-react";

interface FormNavigationProps {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  onNext?: () => void;
  onPrev?: () => void;
  isLastTab?: boolean;
  onSubmit?: () => void;
  isSubmitting: boolean;
  isSubmitDisabled?: boolean;
  handleSubmit?: () => void;
}

const FormNavigation: React.FC<FormNavigationProps> = ({
  activeTab,
  setActiveTab,
  onNext,
  onPrev,
  isLastTab = false,
  onSubmit,
  isSubmitting,
  isSubmitDisabled = false,
  handleSubmit,
}) => {
  const moveToPreviousTab = () => {
    if (onPrev) {
      onPrev();
    } else {
      if (activeTab === "dishes") setActiveTab("client");
      else if (activeTab === "cocktails") setActiveTab("dishes");
      else if (activeTab === "drinks") setActiveTab("cocktails");
      else if (activeTab === "additional") setActiveTab("drinks");
    }
  };

  const moveToNextTab = () => {
    if (onNext) {
      onNext();
    } else {
      if (activeTab === "client") setActiveTab("dishes");
      else if (activeTab === "dishes") setActiveTab("cocktails");
      else if (activeTab === "cocktails") setActiveTab("drinks");
      else if (activeTab === "drinks") setActiveTab("additional");
    }
  };

  const handleFormSubmit = () => {
    // Call either onSubmit or handleSubmit (for backward compatibility)
    if (onSubmit) {
      onSubmit();
    } else if (handleSubmit) {
      handleSubmit();
    }
  };

  const isFirstTab = activeTab === "client";
  const isLastTabValue = isLastTab || activeTab === "additional";

  return (
    <div className="px-4 py-4 bg-white shadow-sm border-t w-full mt-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={moveToPreviousTab}
            disabled={isFirstTab || isSubmitting}
          >
            הקודם
          </Button>
          
          {!isLastTabValue ? (
            <Button type="button" onClick={moveToNextTab} disabled={isSubmitting}>
              הבא
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={handleFormSubmit} 
              disabled={isSubmitting || isSubmitDisabled}
            >
              {isSubmitting ? "שולח..." : "שלח טופס"}
            </Button>
          )}
        </div>
        
        <Link to="/admin" className="text-sm text-muted-foreground hover:text-primary flex items-center">
          <Database className="h-3 w-3 mr-1" />
          אזור ניהול
        </Link>
      </div>
    </div>
  );
};

export default FormNavigation;
