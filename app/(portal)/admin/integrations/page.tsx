"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";

// Import the actual component
import AdminIntegrationsContent from "./AdminIntegrationsContent";

// Loading fallback
function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
    </div>
  );
}

// Main page component with Suspense
export default function AdminIntegrationsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AdminIntegrationsContent />
    </Suspense>
  );
}
