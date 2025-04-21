
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientDetails } from "@/types/food-vision";

interface ClientDetailsTabProps {
  clientDetails: ClientDetails;
  setClientDetails: React.Dispatch<React.SetStateAction<ClientDetails>>;
}

const ClientDetailsTab: React.FC<ClientDetailsTabProps> = ({
  clientDetails,
  setClientDetails,
}) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setClientDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Simple validation for phone and email
  const validatePhone = (phone: string) => {
    const phoneRegex = /^[0-9\-\+]{9,15}$/;
    return phoneRegex.test(phone) || phone === "";
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) || email === "";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-muted/20 p-4 rounded-md mb-6">
        <p className="text-sm text-muted-foreground">
          מלא את פרטי הלקוח שלך. כל השדות הם שדות חובה.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="restaurantName">שם המסעדה *</Label>
          <Input
            id="restaurantName"
            name="restaurantName"
            value={clientDetails.restaurantName}
            onChange={handleChange}
            placeholder="הזן את שם המסעדה"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactName">שם איש הקשר *</Label>
          <Input
            id="contactName"
            name="contactName"
            value={clientDetails.contactName}
            onChange={handleChange}
            placeholder="הזן את שם איש הקשר"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">מספר טלפון *</Label>
          <Input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            value={clientDetails.phoneNumber}
            onChange={handleChange}
            placeholder="הזן מספר טלפון"
            required
            className={!validatePhone(clientDetails.phoneNumber) && clientDetails.phoneNumber ? "border-destructive" : ""}
          />
          {!validatePhone(clientDetails.phoneNumber) && clientDetails.phoneNumber && (
            <p className="text-destructive text-sm">מספר טלפון לא תקין</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">כתובת דוא"ל *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={clientDetails.email}
            onChange={handleChange}
            placeholder="הזן כתובת דוא״ל"
            required
            className={!validateEmail(clientDetails.email) && clientDetails.email ? "border-destructive" : ""}
          />
          {!validateEmail(clientDetails.email) && clientDetails.email && (
            <p className="text-destructive text-sm">כתובת דוא"ל לא תקינה</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetailsTab;
