"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FileText } from "lucide-react";

export default function AdminAuditPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Audit Log</h1>
          <p className="text-[var(--secondary-text)] mt-1">View system activity and security events</p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-[var(--page-background)] rounded-full flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-[var(--teal)]" />
        </div>
        <h2 className="text-lg font-medium text-[var(--main-text)]">Audit Log</h2>
        <p className="text-[var(--secondary-text)] mt-2 max-w-md">
          This page is under construction. Audit log features coming soon.
        </p>
      </div>
    </div>
  );
}
