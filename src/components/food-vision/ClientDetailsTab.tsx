
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ClientDetails } from "@/types/food-vision";

interface ClientDetailsTabProps {
  clientDetails: ClientDetails;
  setClientDetails: React.Dispatch<React.SetStateAction<ClientDetails>>;
  readOnly?: boolean;
}

const ClientDetailsTab: React.FC<ClientDetailsTabProps> = ({ 
  clientDetails, 
  setClientDetails,
  readOnly = false 
}) => {
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof ClientDetails
  ) => {
    if (readOnly) return;
    setClientDetails({ ...clientDetails, [field]: e.target.value });
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        {readOnly && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-700">
            פרטי הלקוח נטענים באופן אוטומטי מהפרופיל שלך
          </div>
        )}

        <div className="grid gap-6">
          <div className="grid gap-3">
            <Label
              htmlFor="restaurant-name"
              className="text-base font-semibold text-black"
            >
              שם המסעדה <span className="text-red-500">*</span>
            </Label>
            <Input
              id="restaurant-name"
              placeholder="הזן את שם המסעדה"
              value={clientDetails.restaurantName || ""}
              onChange={(e) => handleInputChange(e, "restaurantName")}
              className="text-base"
              readOnly={readOnly}
              disabled={readOnly}
            />
          </div>

          <div className="grid gap-3">
            <Label
              htmlFor="contact-name"
              className="text-base font-semibold text-black"
            >
              שם איש הקשר <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contact-name"
              placeholder="הזן את שם איש הקשר"
              value={clientDetails.contactName || ""}
              onChange={(e) => handleInputChange(e, "contactName")}
              className="text-base"
              readOnly={readOnly}
              disabled={readOnly}
            />
          </div>

          <div className="grid gap-3">
            <Label
              htmlFor="phone-number"
              className="text-base font-semibold text-black"
            >
              מספר טלפון <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone-number"
              type="tel"
              placeholder="הזן מספר טלפון"
              value={clientDetails.phoneNumber || ""}
              onChange={(e) => handleInputChange(e, "phoneNumber")}
              className="text-base"
              readOnly={readOnly}
              disabled={readOnly}
            />
          </div>

          <div className="grid gap-3">
            <Label
              htmlFor="email"
              className="text-base font-semibold text-black"
            >
              כתובת אימייל <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="הזן כתובת אימייל"
              value={clientDetails.email || ""}
              onChange={(e) => handleInputChange(e, "email")}
              className="text-base"
              readOnly={readOnly}
              disabled={readOnly}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientDetailsTab;
