"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// This page redirects to the first association's dashboard
// or shows a message if no associations exist
export default function AssociationDashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    async function redirectToFirstAssociation() {
      try {
        const response = await fetch("/api/associations?limit=1");
        const result = await response.json();
        
        if (result.success && result.data.data.length > 0) {
          const firstAssociation = result.data.data[0];
          router.replace(`/management/associations/${firstAssociation.id}/dashboard`);
        } else {
          // No associations - redirect to associations list
          router.replace("/management/associations");
        }
      } catch (error) {
        console.error("Error loading associations:", error);
        router.replace("/management/associations");
      }
    }

    redirectToFirstAssociation();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
    </div>
  );
}
