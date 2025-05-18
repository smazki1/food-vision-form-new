
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import LoginForm from "./LoginForm";
import LoginLinks from "./LoginLinks";

interface LoginCardProps {
  onLoginStart: () => void;
  onLoginComplete: () => void;
}

const LoginCard: React.FC<LoginCardProps> = ({ onLoginStart, onLoginComplete }) => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>התחברות למערכת</CardTitle>
        <CardDescription>
          התחבר כדי לצפות ולנהל את המנות שלך
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm onLoginStart={onLoginStart} onLoginComplete={onLoginComplete} />
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <LoginLinks />
      </CardFooter>
    </Card>
  );
};

export default LoginCard;
