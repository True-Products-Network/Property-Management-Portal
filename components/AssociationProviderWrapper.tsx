// Association Provider Wrapper
// Client component to wrap children with AssociationProvider

"use client";

import { AssociationProvider } from "@/lib/context/AssociationContext";
import { ReactNode } from "react";

export function AssociationProviderWrapper({ children }: { children: ReactNode }) {
  return <AssociationProvider>{children}</AssociationProvider>;
}
