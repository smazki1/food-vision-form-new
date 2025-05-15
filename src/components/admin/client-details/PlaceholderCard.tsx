
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PlaceholderCardProps {
  title: string;
  description: string;
  message: string;
  icon?: React.ReactNode;
}

export function PlaceholderCard({ title, description, message, icon }: PlaceholderCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          {icon && <div className="mb-4">{icon}</div>}
          <p>{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
