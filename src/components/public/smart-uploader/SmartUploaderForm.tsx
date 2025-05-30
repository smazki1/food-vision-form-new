import React, { useState, useCallback } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Assuming you have a Label component
import { toast } from 'sonner';

// Will be replaced by a call to a Supabase Edge Function
interface BusinessValidationResult {
  isValid: boolean;
  clientId?: string;
  restaurantName?: string;
  message?: string;
  canSubmit?: boolean;
}

const SmartUploaderForm: React.FC = () => {
  const { formData, updateFormData, resetFormData } = useNewItemForm();
  const [businessIdentifier, setBusinessIdentifier] = useState('');
  // const [accessCode, setAccessCode] = useState(''); // Optional for later
  const [businessValidated, setBusinessValidated] = useState<BusinessValidationResult | null>(null);
  const [isVerifyingBusiness, setIsVerifyingBusiness] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Business ID, 2: Item Details etc.

  const validateBusinessWithSupabaseFunction = async (identifier: string): Promise<BusinessValidationResult> => {
    setIsVerifyingBusiness(true);
    try {
      // const { data, error } = await supabase.functions.invoke('validate-business', {
      //   body: { businessIdentifier: identifier },
      // });
      // if (error) throw error;
      // return data as BusinessValidationResult; 

      // SIMULATED RESPONSE FOR NOW:
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      if (identifier.toLowerCase().includes('test')) {
        return {
          isValid: true,
          clientId: 'simulated-client-id-' + Date.now(),
          restaurantName: identifier, // Use the input as restaurant name for now
          canSubmit: true,
          message: "Business validated successfully! (Simulated)"
        };
      } else {
        return { isValid: false, message: "Business not found. (Simulated)" };
      }
    } catch (error: any) {
      console.error("Business validation error:", error);
      return { isValid: false, message: error.message || "Error validating business." };
    } finally {
      setIsVerifyingBusiness(false);
    }
  };

  const handleBusinessVerification = async () => {
    if (!businessIdentifier.trim()) {
      toast.error("Please enter a business name.");
      return;
    }
    const result = await validateBusinessWithSupabaseFunction(businessIdentifier);
    setBusinessValidated(result);
    if (result.isValid && result.restaurantName) {
      updateFormData({
        restaurantName: result.restaurantName,
        submitterName: result.restaurantName, // Or a default contact
      });
      toast.success(result.message || "Validated!");
      setCurrentStep(2); // Move to next step
    } else {
      toast.error(result.message || "Validation failed.");
    }
  };

  if (currentStep === 1) {
    return (
      <div className="max-w-lg mx-auto bg-card p-6 md:p-8 rounded-lg shadow-lg space-y-6" dir="rtl">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-center">זהה את העסק שלך</h2>
          <p className="text-sm text-muted-foreground text-center">
            הזן את שם העסק או המסעדה כדי להתחיל.
          </p>
        </div>
        <div>
          <Label htmlFor="businessName">שם העסק / מסעדה</Label>
          <Input
            id="businessName"
            value={businessIdentifier}
            onChange={(e) => setBusinessIdentifier(e.target.value)}
            placeholder="לדוגמה: פיצה כמעט חינם"
            className="mt-1"
          />
        </div>
        <Button onClick={handleBusinessVerification} disabled={isVerifyingBusiness} className="w-full">
          {isVerifyingBusiness ? "מאמת נתונים..." : "המשך"}
        </Button>
        {businessValidated && !businessValidated.isValid && (
          <p className="text-sm text-red-600 text-center">{businessValidated.message}</p>
        )}
      </div>
    );
  }

  if (currentStep > 1 && businessValidated?.isValid) {
    return (
      <div className="max-w-2xl mx-auto" dir="rtl">
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md mb-6">
          <p className="font-semibold">עסק זוהה בהצלחה: {businessValidated.restaurantName}</p>
          {businessValidated.clientId && <p className="text-sm">מזהה לקוח: {businessValidated.clientId}</p>}
        </div>
        <h2 className="text-xl font-semibold mb-4">שלב 2: פרטי המנה והעלאת תמונות</h2>
        {/* 
          Placeholder for actual form steps (ItemDetails, ImageUpload, Review)
          These would be similar to the ones in ClientUnifiedUploadForm or UnifiedUploadForm.
          You'll need to pass appropriate props and handlers.
          The final submission should use businessValidated.clientId.
        */}
        <div className="bg-muted p-8 rounded-lg text-center">
          <p className="text-lg">טופס העלאת פרטי מנה ותמונות יופיע כאן.</p>
          <p className="text-sm text-muted-foreground mt-2">
            (אינטגרציה של שלבי הטופס הקיימים נדרשת כאן)
          </p>
        </div>
      </div>
    );
  }

  // Fallback if not step 1 and business not validated (should ideally not be reached if logic is correct)
  return (
    <div className="text-center p-6">
      <p>אנא זהה את העסק שלך כדי להמשיך.</p>
      <Button onClick={() => setCurrentStep(1)} variant="link" className="mt-2">
        חזור לזיהוי עסק
      </Button>
    </div>
  );
};

export default SmartUploaderForm; 