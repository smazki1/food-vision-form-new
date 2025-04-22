
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, X } from "lucide-react";

type StatusType = "success" | "error" | null;

interface Props {
  open: boolean;
  onClose: () => void;
  status: StatusType;
  message: string;
}

const iconStyle = "h-5 w-5";

export const FormStatusAlert: React.FC<Props> = ({ open, onClose, status, message }) => {
  if (!open) return null;
  return (
    <div className="w-full flex flex-col items-center mb-2 animate-fade-in">
      <Alert
        variant={status === "success" ? "default" : "destructive"}
        className={`w-full max-w-lg text-center shadow-md flex items-center justify-center relative rounded-lg py-4 bg-white ${
          status === "success" ? "border-emerald-400" : "border-red-300"
        }`}
      >
        <span className="absolute left-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground" onClick={onClose}>
          <X className="h-5 w-5 hover:text-red-400" aria-label="סגור" />
        </span>
        {status === "success" ? (
          <Check className={`mx-2 text-emerald-500 ${iconStyle}`} />
        ) : (
          <X className={`mx-2 text-red-500 ${iconStyle}`} />
        )}
        <AlertDescription className="px-3 text-sm font-semibold break-words">{message}</AlertDescription>
      </Alert>
    </div>
  );
};
