// Association Selector Component
// Dropdown to select current association for association-scoped views

"use client";

import { useAssociation } from "@/lib/context/AssociationContext";
import { Building2, ChevronDown } from "lucide-react";

export function AssociationSelector() {
  const { selectedAssociation, setSelectedAssociation, associations, isLoading } = useAssociation();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--secondary-text)]">
        <Building2 className="h-4 w-4" />
        Loading...
      </div>
    );
  }

  if (associations.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--secondary-text)]">
        <Building2 className="h-4 w-4" />
        No associations
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        value={selectedAssociation?.id || "all"}
        onChange={(e) => {
          const value = e.target.value;
          if (value === "all") {
            setSelectedAssociation(null);
          } else {
            const assoc = associations.find((a) => a.id === value);
            setSelectedAssociation(assoc || null);
          }
        }}
        className="appearance-none bg-white border border-[var(--border-color)] rounded-lg pl-9 pr-8 py-2 text-sm font-medium text-[var(--main-text)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)] focus:border-transparent cursor-pointer min-w-[200px]"
      >
        <option value="all">All Associations</option>
        {associations.map((association) => (
          <option key={association.id} value={association.id}>
            {association.name}
          </option>
        ))}
      </select>
      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)] pointer-events-none" />
    </div>
  );
}
