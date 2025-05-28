
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface FormErrorAlertProps {
  errorState: string | null;
  isStuckLoading: boolean;
  onRetry: () => void;
  isCreatingClient: boolean;
  isSubmitting: boolean;
}

const FormErrorAlert: React.FC<FormErrorAlertProps> = ({
  errorState,
  isStuckLoading,
  onRetry,
  isCreatingClient,
  isSubmitting
}) => {
  if (!errorState && !isStuckLoading) return null;

  return (
    <Alert className="mb-6 bg-red-50 border-red-200">
      <AlertTriangle className="h-4 w-4 text-red-500" />
      <AlertDescription className="text-red-700">
        {errorState || "הטעינה תקועה - העמוד יטען ללא חיבור לנתוני הלקוח"}
        <Button 
          variant="link" 
          className="p-0 h-auto text-red-700 hover:underline mr-2"
          onClick={onRetry}
          disabled={isCreatingClient || isSubmitting}
        >
          <RefreshCw className="h-3 w-3 ml-1" />
          {isStuckLoading ? 'המשך בלי חיבור' : 'נסו שוב'}
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default FormErrorAlert;
