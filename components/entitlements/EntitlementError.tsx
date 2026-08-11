"use client";

import { AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface EntitlementErrorProps {
  feature: string;
  error?: string;
  code?: string;
  action?: string;
  onContactAdmin?: () => void;
}

export function EntitlementError({ 
  feature, 
  error = "Feature not enabled", 
  code,
  action,
  onContactAdmin 
}: EntitlementErrorProps) {
  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="flex flex-row items-center gap-2">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
          <Lock className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <CardTitle className="text-lg text-amber-900">Feature Not Available</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-amber-800">
            The <strong>&quot;{feature}&quot;</strong> feature is not enabled for your business.
          </p>
          {action && (
            <p className="text-amber-700 text-sm">
              {action}
            </p>
          )}
          {code && (
            <p className="text-amber-600 text-xs">
              Error code: {code}
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
