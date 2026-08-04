"use client";

import { useState, useRef, useEffect } from "react";
import { Building2, ChevronDown, Check } from "lucide-react";
import { useAssociation } from "@/lib/contexts/AssociationContext";

export function AssociationSelector() {
  const { associations, activeAssociation, setActiveAssociation, isLoading } = useAssociation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--secondary-text)]">
        <Building2 className="h-4 w-4" />
        <span>Loading...</span>
      </div>
    );
  }

  if (associations.length === 0) {
    return null;
  }

  // Don't show selector if only one association and we're on a page that doesn't need it
  // But always show for consistency as requested
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[var(--main-text)] bg-[var(--page-background)] hover:bg-[var(--border-color)] rounded-lg border border-[var(--border-color)] transition-colors"
      >
        <Building2 className="h-4 w-4 text-[var(--teal)]" />
        <span className="max-w-[200px] truncate">
          {activeAssociation?.name || "Select Association"}
        </span>
        <ChevronDown className={`h-4 w-4 text-[var(--secondary-text)] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-[var(--border-color)] py-2 z-50 max-h-[400px] overflow-y-auto">
          <div className="px-3 py-2 border-b border-[var(--border-color)]">
            <p className="text-xs font-medium text-[var(--secondary-text)] uppercase">
              {associations.length === 1 ? "Your Association" : "Select Association"}
            </p>
          </div>
          
          {associations.map((association) => (
            <button
              key={association.id}
              onClick={() => {
                setActiveAssociation(association.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-[var(--page-background)] transition-colors ${
                activeAssociation?.id === association.id
                  ? "bg-[var(--teal)]/5 text-[var(--teal)]"
                  : "text-[var(--main-text)]"
              }`}
            >
              <div className="flex flex-col">
                <span className="font-medium">{association.name}</span>
                {association.code && (
                  <span className="text-xs text-[var(--secondary-text)]">{association.code}</span>
                )}
              </div>
              {activeAssociation?.id === association.id && (
                <Check className="h-4 w-4 text-[var(--teal)]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
