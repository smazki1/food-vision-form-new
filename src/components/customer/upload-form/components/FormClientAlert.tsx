
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from 'lucide-react';

interface FormClientAlertProps {
  currentStepId: number;
  clientId: string | null;
  errorState: string | null;
  onResetToAllSteps: () => void;
}

const FormClientAlert: React.FC<FormClientAlertProps> = ({
  currentStepId,
  clientId,
  errorState,
  onResetToAllSteps
}) => {
  if (currentStepId === 1 || clientId || errorState) return null;

  return (
    <Alert className="mb-6">
      <InfoIcon className="h-4 w-4" />
      <AlertDescription>
        נראה שלא השלמת את פרטי המסעדה. 
        <Button variant="link" className="p-0 h-auto text-[#8B1E3F] hover:underline" onClick={onResetToAllSteps}>
          לחץ כאן
        </Button>
        {' '}
        להשלמת הפרטים או התחבר למערכת.
      </AlertDescription>
    </Alert>
  );
};

export default FormClientAlert;
