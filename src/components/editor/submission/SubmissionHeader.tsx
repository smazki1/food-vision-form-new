
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubmissionHeaderProps {
  title?: string;
}

const SubmissionHeader: React.FC<SubmissionHeaderProps> = ({ title }) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2 mb-6">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => navigate("/editor/dashboard")}
        className="gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        חזרה לדאשבורד
      </Button>
      {title && <h1 className="text-xl font-medium">{title}</h1>}
    </div>
  );
};

export default SubmissionHeader;
