import { Activity } from "lucide-react";

export default function WorkflowActivityPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Workflow Activity</h1>
          <p className="text-[var(--secondary-text)] mt-1">Track workflow and automation activity</p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-[var(--page-background)] rounded-full flex items-center justify-center mb-4">
          <Activity className="h-8 w-8 text-[var(--teal)]" />
        </div>
        <h2 className="text-lg font-medium text-[var(--main-text)]">Workflow Activity</h2>
        <p className="text-[var(--secondary-text)] mt-2 max-w-md">
          This page is under construction. Workflow activity tracking coming soon.
        </p>
      </div>
    </div>
  );
}
