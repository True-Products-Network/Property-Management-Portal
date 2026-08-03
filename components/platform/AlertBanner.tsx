// Alert Banner Component for Platform Dashboard

import { AlertTriangle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface AlertBannerProps {
  type: "warning" | "error" | "info";
  title: string;
  message: string;
  link?: string;
}

export function AlertBanner({ type, title, message, link }: AlertBannerProps) {
  const variant = type === "error" ? "destructive" : type === "warning" ? "default" : "default";
  
  return (
    <Alert variant={variant} className={type === "warning" ? "border-yellow-500 bg-yellow-50" : ""}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {link && (
          <Button variant="outline" size="sm" asChild>
            <a href={link}>View Details</a>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
