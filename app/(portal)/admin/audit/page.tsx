"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Construction, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AuditLogPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">
            Audit Log
          </h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Track all system activities and changes
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </Link>
      </div>

      {/* Under Construction */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6 pb-6 text-center">
          <Construction className="h-16 w-16 mx-auto mb-4 text-amber-500" />
          <h2 className="text-xl font-semibold text-amber-800 mb-2">
            Page Under Construction
          </h2>
          <p className="text-amber-700 mb-4 max-w-md mx-auto">
            This feature is currently being developed. You will be able to view 
            and search through all system activities and audit trails here soon.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-amber-600">
            <Clock className="h-4 w-4" />
            <span>Expected completion: Coming soon</span>
          </div>
        </CardContent>
      </Card>

      {/* Planned Features */}
      <Card>
        <CardHeader>
          <CardTitle>Planned Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--teal)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-[var(--teal)]">1</span>
              </div>
              <div>
                <p className="font-medium">Activity Timeline</p>
                <p className="text-sm text-[var(--secondary-text)]">
                  View chronological log of all user actions and system events
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--teal)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-[var(--teal)]">2</span>
              </div>
              <div>
                <p className="font-medium">Advanced Filtering</p>
                <p className="text-sm text-[var(--secondary-text)]">
                  Filter by user, action type, date range, and affected records
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--teal)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-[var(--teal)]">3</span>
              </div>
              <div>
                <p className="font-medium">Change Tracking</p>
                <p className="text-sm text-[var(--secondary-text)]">
                  See before/after values for all data modifications
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--teal)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-[var(--teal)]">4</span>
              </div>
              <div>
                <p className="font-medium">Export & Reports</p>
                <p className="text-sm text-[var(--secondary-text)]">
                  Export audit logs for compliance and security reviews
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
