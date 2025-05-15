
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LeadSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const LeadSearchBar: React.FC<LeadSearchBarProps> = ({ value, onChange }) => {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="חיפוש לפי שם מסעדה, איש קשר, אימייל או טלפון..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};
