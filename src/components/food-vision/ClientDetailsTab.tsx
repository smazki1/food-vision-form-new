
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientDetails } from "@/types/food-vision";
import { Phone } from "lucide-react";

interface ClientDetailsTabProps {
  clientDetails: ClientDetails;
  setClientDetails: React.Dispatch<React.SetStateAction<ClientDetails>>;
}
const ClientDetailsTab: React.FC<ClientDetailsTabProps> = ({
  clientDetails,
  setClientDetails
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      value
    } = e.target;
    setClientDetails(prev => ({
      ...prev,
      [name]: value
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
        <p className="text-sm text-muted-foreground">מלא את פרטי המסעדה שלך. כל השדות הם שדות חובה.</p>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="restaurantName">שם המסעדה *</Label>
          <Input id="restaurantName" name="restaurantName" value={clientDetails.restaurantName} onChange={handleChange} placeholder="הזן את שם המסעדה" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactName">שם איש הקשר *</Label>
          <Input id="contactName" name="contactName" value={clientDetails.contactName} onChange={handleChange} placeholder="הזן את שם איש הקשר" required />
        </div>

        <div className="space-y-2 col-span-1 md:col-span-2 flex flex-col md:flex-row items-center md:space-x-4 md:space-x-reverse">
          <div className="w-full flex-1">
            <Label htmlFor="phoneNumber" className="block">מספר טלפון *</Label>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-10 text-muted-foreground">
                <Phone />
              </span>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={clientDetails.phoneNumber}
                onChange={handleChange}
                placeholder="הזן מספר טלפון"
                required
                className={`ltr:text-left rtl:text-right ${!validatePhone(clientDetails.phoneNumber) && clientDetails.phoneNumber ? "border-destructive" : ""}`}
                maxLength={15}
                dir="ltr"
                inputMode="tel"
                pattern="[0-9\-\+]{9,15}"
                autoComplete="tel"
              />
            </div>
            {!validatePhone(clientDetails.phoneNumber) && clientDetails.phoneNumber && (
              <p className="text-destructive text-sm">מספר טלפון לא תקין</p>
            )}
          </div>
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
            autoComplete="email"
            inputMode="email"
            dir="ltr"
          />
          {!validateEmail(clientDetails.email) && clientDetails.email && <p className="text-destructive text-sm">כתובת דוא"ל לא תקינה</p>}
        </div>
      </div>
    </div>
  );
};
export default ClientDetailsTab;
