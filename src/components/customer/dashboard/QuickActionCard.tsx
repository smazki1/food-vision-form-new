
import React, { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  linkTo: string;
  buttonText: string;
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({ 
  title, 
  description, 
  icon, 
  linkTo, 
  buttonText,
  buttonVariant = "default"
}) => {
  return (
    <Card className="hover:border-primary transition-all">
      <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-xl font-medium">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
        <Button className="w-full" variant={buttonVariant} asChild>
          <Link to={linkTo}>
            {buttonText}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
