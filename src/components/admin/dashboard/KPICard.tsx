
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number | string;
  change?: number;
  description?: string;
  loading?: boolean;
  icon?: React.ReactNode;
  format?: "number" | "percentage" | "currency";
}

export function KPICard({
  title,
  value,
  change,
  description,
  loading = false,
  icon,
  format = "number",
}: KPICardProps) {
  const formatValue = () => {
    if (typeof value === "string") return value;
    
    switch (format) {
      case "percentage":
        return `${value}%`;
      case "currency":
        return new Intl.NumberFormat("he-IL", {
          style: "currency",
          currency: "ILS",
        }).format(value);
      default:
        return new Intl.NumberFormat("he-IL").format(value);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            {description && <Skeleton className="h-4 w-full" />}
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{formatValue()}</div>
            {(change !== undefined || description) && (
              <p className="text-xs text-muted-foreground">
                {change !== undefined && (
                  <span
                    className={cn(
                      "inline-flex items-center mr-1",
                      change > 0
                        ? "text-green-600"
                        : change < 0
                        ? "text-red-600"
                        : ""
                    )}
                  >
                    {change > 0 ? (
                      <TrendingUp className="h-3 w-3 ml-1" />
                    ) : change < 0 ? (
                      <TrendingDown className="h-3 w-3 ml-1" />
                    ) : null}
                    {change > 0 ? "+" : ""}
                    {change}%
                  </span>
                )}
                {description}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
