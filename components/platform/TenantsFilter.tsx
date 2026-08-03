// Tenants Filter Component
// Filter tabs for tenant list

import Link from "next/link";
import { cn } from "@/lib/utils";

interface TenantsFilterProps {
  totalCount: number;
  activeCount: number;
  pastDueCount: number;
  currentStatus?: string;
}

const filters = [
  { label: "All", value: undefined, countKey: "total" },
  { label: "Active", value: "active", countKey: "active" },
  { label: "Past Due", value: "past_due", countKey: "pastDue" },
];

export function TenantsFilter({
  totalCount,
  activeCount,
  pastDueCount,
  currentStatus,
}: TenantsFilterProps) {
  const counts = {
    total: totalCount,
    active: activeCount,
    pastDue: pastDueCount,
  };

  return (
    <div className="border-b">
      <nav className="flex space-x-8">
        {filters.map((filter) => {
          const isActive = currentStatus === filter.value || (!currentStatus && !filter.value);
          const href = filter.value ? `?status=${filter.value}` : "?";
          
          return (
            <Link
              key={filter.label}
              href={href}
              className={cn(
                "py-4 px-1 border-b-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {filter.label}
              <span
                className={cn(
                  "ml-2 py-0.5 px-2 rounded-full text-xs",
                  isActive
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                {counts[filter.countKey as keyof typeof counts]}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
