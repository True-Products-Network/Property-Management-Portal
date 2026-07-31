"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const activities = [
  { id: "1", action: "Maintenance request created", user: "John Smith", timestamp: "2026-07-31 10:30 AM", type: "create" },
  { id: "2", action: "Vendor assigned to MNT-2026-0047", user: "Sarah Johnson", timestamp: "2026-07-31 09:15 AM", type: "update" },
  { id: "3", action: "Payment received: $350.00", user: "System", timestamp: "2026-07-31 08:00 AM", type: "payment" },
  { id: "4", action: "Document uploaded: Insurance.pdf", user: "Mike Chen", timestamp: "2026-07-30 04:45 PM", type: "document" },
  { id: "5", action: "Board approval requested", user: "Lisa Davis", timestamp: "2026-07-30 02:30 PM", type: "approval" },
];

export default function WorkflowActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--main-text)]">Workflow Activity</h1>
        <p className="text-[var(--secondary-text)] mt-1">Track workflow and automation activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Activities</p>
                <p className="text-2xl font-semibold">1,247</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Completed</p>
                <p className="text-2xl font-semibold">1,180</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">In Progress</p>
                <p className="text-2xl font-semibold">45</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Failed</p>
                <p className="text-2xl font-semibold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 bg-[var(--page-background)] rounded-lg flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[var(--teal)]/10 flex items-center justify-center flex-shrink-0">
                  <Activity className="h-4 w-4 text-[var(--teal)]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{activity.action}</p>
                  <div className="flex items-center gap-3 text-sm text-[var(--secondary-text)] mt-1">
                    <span>By: {activity.user}</span>
                    <span>{activity.timestamp}</span>
                  </div>
                </div>
                <Badge variant="secondary">{activity.type}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
