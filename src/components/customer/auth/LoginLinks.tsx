
import React from "react";
import { Link } from "react-router-dom";

const LoginLinks: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
      <Link
        to="/forgot-password"
        className="hover:text-primary transition-colors"
      >
        שכחת סיסמה?
      </Link>
      <Link
        to="/"
        className="hover:text-primary transition-colors"
      >
        עדיין לא לקוח שלנו? הגש פרטים
      </Link>
    </div>
  );
};

export default LoginLinks;
