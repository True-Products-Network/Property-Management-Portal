"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Association {
  id: string;
  name: string;
  code?: string;
}

interface AssociationContextType {
  associations: Association[];
  activeAssociationId: string | null;
  activeAssociation: Association | null;
  setActiveAssociation: (id: string) => void;
  isLoading: boolean;
}

const AssociationContext = createContext<AssociationContextType | undefined>(undefined);

const STORAGE_KEY = "active_association_id";

export function AssociationProvider({ children }: { children: ReactNode }) {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [activeAssociationId, setActiveAssociationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load associations on mount
  useEffect(() => {
    loadAssociations();
  }, []);

  // Persist active association to localStorage
  useEffect(() => {
    if (activeAssociationId) {
      localStorage.setItem(STORAGE_KEY, activeAssociationId);
    }
  }, [activeAssociationId]);

  const loadAssociations = async () => {
    try {
      const response = await fetch("/api/user/associations");
      if (!response.ok) throw new Error("Failed to load associations");
      
      const data = await response.json();
      setAssociations(data.associations || []);

      // Determine active association
      const storedId = localStorage.getItem(STORAGE_KEY);
      const hasStoredAssociation = data.associations.some((a: Association) => a.id === storedId);
      
      if (storedId && hasStoredAssociation) {
        // Use stored preference if valid
        setActiveAssociationId(storedId);
      } else if (data.associations.length > 0) {
        // Default to first association
        setActiveAssociationId(data.associations[0].id);
      }
    } catch (error) {
      console.error("Error loading associations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setActiveAssociation = (id: string) => {
    setActiveAssociationId(id);
    // Trigger a page refresh or data reload
    window.location.reload();
  };

  const activeAssociation = associations.find(a => a.id === activeAssociationId) || null;

  return (
    <AssociationContext.Provider
      value={{
        associations,
        activeAssociationId,
        activeAssociation,
        setActiveAssociation,
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
