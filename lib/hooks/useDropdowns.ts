"use client";

import { useState, useEffect, useCallback } from "react";

interface DropdownOption {
  value: string;
  label: string;
}

interface UseDropdownsResult {
  options: DropdownOption[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook to fetch dropdown values for a specific record type and field
 */
export function useDropdowns(
  recordType: string,
  fieldName: string
): UseDropdownsResult {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    if (!recordType || !fieldName) {
      setOptions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/dropdowns?recordType=${encodeURIComponent(recordType)}&fieldName=${encodeURIComponent(fieldName)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch dropdown options");
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setOptions(result.data);
      } else {
        setOptions([]);
      }
    } catch (err) {
      console.error(`Error fetching dropdowns for ${recordType}/${fieldName}:`, err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [recordType, fieldName]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  return {
    options,
    isLoading,
    error,
    refresh: fetchOptions,
  };
}

/**
 * Hook to fetch multiple dropdown fields at once
 */
export function useMultipleDropdowns(
  fields: { recordType: string; fieldName: string; key: string }[]
): Record<string, UseDropdownsResult> {
  const [results, setResults] = useState<Record<string, UseDropdownsResult>>({});

  useEffect(() => {
    const fetchAll = async () => {
      const newResults: Record<string, UseDropdownsResult> = {};

      for (const field of fields) {
        try {
          const response = await fetch(
            `/api/dropdowns?recordType=${encodeURIComponent(field.recordType)}&fieldName=${encodeURIComponent(field.fieldName)}`
          );

          if (response.ok) {
            const result = await response.json();
            newResults[field.key] = {
              options: result.success && Array.isArray(result.data) ? result.data : [],
              isLoading: false,
              error: null,
              refresh: () => {},
            };
          } else {
            newResults[field.key] = {
              options: [],
              isLoading: false,
              error: "Failed to fetch",
              refresh: () => {},
            };
          }
        } catch (err) {
          newResults[field.key] = {
            options: [],
            isLoading: false,
            error: err instanceof Error ? err.message : "Unknown error",
            refresh: () => {},
          };
        }
      }

      setResults(newResults);
    };

    if (fields.length > 0) {
      fetchAll();
    }
  }, [JSON.stringify(fields)]);

  return results;
}
