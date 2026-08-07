// Association Context
// Provides selected association context for association-scoped pages

"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Association {
  id: string;
  name: string;
  shortName?: string;
}

interface AssociationContextType {
  selectedAssociation: Association | null;
  setSelectedAssociation: (association: Association | null) => void;
  associations: Association[];
  isLoading: boolean;
}

const AssociationContext = createContext<AssociationContextType | undefined>(undefined);

export function AssociationProvider({ children }: { children: ReactNode }) {
  const [selectedAssociation, setSelectedAssociation] = useState<Association | null>(null);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAssociations();
  }, []);

  async function loadAssociations() {
    try {
      const response = await fetch("/api/associations?limit=100");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAssociations(result.data.data || []);
          // Auto-select first association if none selected
          if (!selectedAssociation && result.data.data?.length > 0) {
            setSelectedAssociation(result.data.data[0]);
          }
        }
      }
    } catch (error) {
      console.error("Error loading associations:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AssociationContext.Provider
      value={{
        selectedAssociation,
        setSelectedAssociation,
        associations,
        isLoading,
      }}
    >
      {children}
    </AssociationContext.Provider>
  );
}

export function useAssociation() {
  const context = useContext(AssociationContext);
  if (context === undefined) {
    throw new Error("useAssociation must be used within an AssociationProvider");
  }
  return context;
}
