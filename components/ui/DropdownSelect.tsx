"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownSelectProps {
  recordType: string;
  fieldName: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  defaultOptions?: DropdownOption[];
}

// Simple cache to avoid repeated API calls
const cache: Record<string, DropdownOption[]> = {};

export function DropdownSelect({
  recordType,
  fieldName,
  value,
  onChange,
  placeholder = "Select...",
  label,
  required = false,
  disabled = false,
  className = "",
  id,
  defaultOptions,
}: DropdownSelectProps) {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `${recordType}:${fieldName}`;

  const fetchOptions = useCallback(async () => {
    // Check cache first
    if (cache[cacheKey]) {
      setOptions(cache[cacheKey]);
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
        throw new Error(`Failed to fetch ${fieldName} options`);
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        // Use fetched options if available, otherwise fall back to defaults
        const finalOptions = result.data.length > 0 ? result.data : (defaultOptions || []);
        setOptions(finalOptions);
        // Cache the result
        cache[cacheKey] = finalOptions;
      } else {
        setOptions(defaultOptions || []);
      }
    } catch (err) {
      console.error(`Error fetching ${fieldName}:`, err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setOptions(defaultOptions || []);
    } finally {
      setIsLoading(false);
    }
  }, [recordType, fieldName, cacheKey]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const selectId = id || `${recordType}-${fieldName}`.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-[var(--main-text)] mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || isLoading}
          required={required}
          className={`
            w-full h-10 px-3 rounded-md border border-[var(--border-color)] bg-white
            focus:outline-none focus:ring-2 focus:ring-[var(--teal)] focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? "border-red-500" : ""}
          `}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {isLoading && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1">
          Error loading options. <button onClick={fetchOptions} className="underline">Retry</button>
        </p>
      )}
    </div>
  );
}

// Hook for when you need the options outside of the select (e.g., for validation)
export function useDropdownOptions(recordType: string, fieldName: string) {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `${recordType}:${fieldName}`;

  useEffect(() => {
    if (cache[cacheKey]) {
      setOptions(cache[cacheKey]);
      setIsLoading(false);
      return;
    }

    const fetchOptions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/dropdowns?recordType=${encodeURIComponent(recordType)}&fieldName=${encodeURIComponent(fieldName)}`
        );
        if (response.ok) {
          const result = await response.json();
          if (result.success && Array.isArray(result.data)) {
            setOptions(result.data);
            cache[cacheKey] = result.data;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, [recordType, fieldName, cacheKey]);

  return { options, isLoading, error };
}

// Clear cache function (useful after admin updates dropdowns)
export function clearDropdownCache(recordType?: string, fieldName?: string) {
  if (recordType && fieldName) {
    delete cache[`${recordType}:${fieldName}`];
  } else {
    Object.keys(cache).forEach((key) => delete cache[key]);
  }
}
