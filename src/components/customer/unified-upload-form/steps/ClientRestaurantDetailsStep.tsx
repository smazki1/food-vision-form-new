import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from 'lucide-react';
import { NewItemFormData } from '@/contexts/NewItemFormContext'; // Use NewItemFormData

interface ClientRestaurantDetailsStepProps {
  formData: Pick<NewItemFormData, 'restaurantName' | 'submitterName'>; // Expect relevant parts of NewItemFormData
  errors: Record<string, string>;
  // isAuthenticated is always true for this form context, so might not be needed here
  // isLoadingUserData is replaced by ClientAuthContext.authenticating
  isLoadingAuth: boolean; // Reflects ClientAuthContext.authenticating
  onInputChange: (field: keyof Pick<NewItemFormData, 'restaurantName' | 'submitterName'>, value: string) => void;
}

const ClientRestaurantDetailsStep: React.FC<ClientRestaurantDetailsStepProps> = ({
  formData,
  errors,
  isLoadingAuth,
  onInputChange
}) => {

  // For a client form, this step might be skipped if details are already present (handled in parent form)
  // If shown, it would be to confirm/display existing details.
  // Input fields would likely be disabled or for display only.

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">פרטי המסעדה שלך</h2>
      
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          אלו הפרטים הרשומים לנו עבור המסעדה שלך. אם יש צורך בשינוי, אנא פנה לתמיכה.
        </AlertDescription>
      </Alert>
      
      <div>
        <label className="block text-sm font-medium mb-1">שם המסעדה</label>
        <input
          type="text"
          className="w-full p-3 border rounded-md bg-gray-100 cursor-not-allowed"
          value={formData.restaurantName || ''}
          readOnly // Details are from context, not editable here
          disabled={isLoadingAuth} // Disable if auth is still loading
        />
        {/* Errors for restaurantName might not be relevant if it's read-only from context */}
        {/* errors.restaurantName && (
          <p className="text-red-500 text-xs mt-1">{errors.restaurantName}</p>
        ) */}
      </div>

      {/* submitterName (contact name) is also from context */}
      <div>
        <label className="block text-sm font-medium mb-1">שם איש קשר</label>
        <input
          type="text"
          className="w-full p-3 border rounded-md bg-gray-100 cursor-not-allowed"
          value={formData.submitterName || ''} 
          readOnly
          disabled={isLoadingAuth}
        />
         {/* errors.submitterName && (
          <p className="text-red-500 text-xs mt-1">{errors.submitterName}</p>
        ) */}
      </div>

      {/* Fields for contactEmail and contactPhone are removed as they are not part of NewItemFormData 
           and for an authenticated client, these details are assumed to be part of their profile. 
           The primary contact is `submitterName` from NewItemFormData. */}

    </div>
  );
};

export default ClientRestaurantDetailsStep; 