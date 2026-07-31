import { UserPlus } from "lucide-react";

export default function NewPersonPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Add Owner or Tenant</h1>
          <p className="text-[var(--secondary-text)] mt-1">Add a new owner or tenant to the system</p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-[var(--page-background)] rounded-full flex items-center justify-center mb-4">
          <UserPlus className="h-8 w-8 text-[var(--teal)]" />
        </div>
        <h2 className="text-lg font-medium text-[var(--main-text)]">Add Owner or Tenant</h2>
        <p className="text-[var(--secondary-text)] mt-2 max-w-md">
          This form is under construction. Person creation coming soon.
        </p>
      </div>
    </div>
  );
}
