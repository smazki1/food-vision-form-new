import React, { useContext } from 'react';
import { NewItemFormContext } from '@/contexts/NewItemFormContext';
import { StepProps } from '../FoodVisionUploadForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { useClientAuth } from '@/hooks/useClientAuth';
import { useClientPackage } from '@/hooks/useClientPackage';

const ReviewSubmitStep: React.FC<StepProps> = ({ errors }) => {
  const { formData } = useContext(NewItemFormContext);
  const { clientId } = useClientAuth(); // To conditionally show restaurant details
  const { remainingDishes, packageName } = useClientPackage();

  const { 
    restaurantName, contactName, phone, email, // Restaurant details
    itemName, itemType, description, specialNotes, referenceImages 
  } = formData;

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <h2 className="text-2xl font-semibold mb-1">סקירה ואישור</h2>
        <p className="text-sm text-muted-foreground mb-6">
          אנא בדוק את כל הפרטים שהזנת לפני ההגשה הסופית.
        </p>
      </div>

      {/* Restaurant Details Section - Only show if these details were part of the form flow */}
      {!clientId && (restaurantName || contactName || phone || email) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">פרטי המסעדה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {restaurantName && <p><span className="font-semibold">שם המסעדה:</span> {restaurantName}</p>}
            {contactName && <p><span className="font-semibold">שם איש קשר:</span> {contactName}</p>}
            {phone && <p><span className="font-semibold">טלפון:</span> {phone}</p>}
            {email && <p><span className="font-semibold">אימייל:</span> {email}</p>}
          </CardContent>
        </Card>
      )}

      {/* Item Details Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">פרטי הפריט</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p><span className="font-semibold">שם הפריט:</span> {itemName}</p>
          <p><span className="font-semibold">סוג הפריט:</span> {itemType ? itemType.charAt(0).toUpperCase() + itemType.slice(1) : '-'}</p>
          {description && <p><span className="font-semibold">תיאור:</span> {description}</p>}
          {specialNotes && <p><span className="font-semibold">הערות מיוחדות:</span> {specialNotes}</p>}
        </CardContent>
      </Card>

      {/* Uploaded Images Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">תמונות שהועלו ({referenceImages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {referenceImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {referenceImages.map((file, index) => (
                <div key={index} className="relative group border rounded-md overflow-hidden aspect-square">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={`תמונה ${index + 1}`} 
                    className="w-full h-full object-cover"
                    onLoad={() => URL.revokeObjectURL(file.name)} // Clean up object URL
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                    {file.name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">לא הועלו תמונות.</p>
          )}
        </CardContent>
      </Card>

      {/* Submission Cost / Package Info Alert */}
      <Alert variant={remainingDishes !== undefined && remainingDishes <= 0 ? "destructive" : "default"} className={remainingDishes !== undefined && remainingDishes > 0 && remainingDishes <=5 ? "border-orange-500 text-orange-700 bg-orange-50" : ""}>
        <InfoIcon className={`h-4 w-4 ${remainingDishes !== undefined && remainingDishes <= 0 ? "text-destructive" : (remainingDishes !== undefined && remainingDishes > 0 && remainingDishes <=5 ? "text-orange-700" : "text-primary") }`} />
        <AlertDescription className="text-sm">
          {remainingDishes !== undefined && remainingDishes <= 0 ? (
            <>הגשה זו לא תתאפשר. <strong>לא נותרו לך מנות בחבילה הנוכחית ({packageName}).</strong></>
          ) : (
            <>
              הגשה זו תנצל מנה אחת מהחבילה שלך. 
              {packageName && `(חבילה: ${packageName}) `}
              {remainingDishes !== undefined && `לאחר הגשה זו ייוותרו לך ${remainingDishes - 1} מנות.`}
            </>
          )}
        </AlertDescription>
      </Alert>

      {/* Final Confirmation Prompt */}
      <div className="flex items-center space-x-2 space-x-reverse p-4 bg-green-50 border-l-4 border-green-500 rounded-md">
        <CheckCircle className="h-6 w-6 text-green-600" />
        <p className="text-sm text-green-700">
          בדקתי את כל הפרטים ואני מאשר את ההגשה.
        </p>
      </div>

      {/* Display any submission errors passed from the parent form */}
      {errors?.finalCheck && <p className="text-sm text-red-500 mt-2 text-center">{errors.finalCheck}</p>}
      {errors?.submit && <p className="text-sm text-red-500 mt-2 text-center">{errors.submit}</p>}

    </div>
  );
};

export default ReviewSubmitStep; 