"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Plus, Calendar, AlertCircle } from "lucide-react";

const inspections = [
  { id: "1", property: "6722 S Ridgeland", type: "Annual", date: "2026-08-15", status: "scheduled" },
  { id: "2", property: "Oakwood Heights", type: "Fire Safety", date: "2026-08-20", status: "scheduled" },
  { id: "3", property: "Main Street Plaza", type: "HVAC", date: "2026-07-01", status: "overdue" },
];

export default function InspectionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Inspections</h1>
          <p className="text-[var(--secondary-text)] mt-1">Schedule and track property inspections</p>
        </div>
        <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Inspection
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total</p>
                <p className="text-2xl font-semibold">24</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Scheduled</p>
                <p className="text-2xl font-semibold">8</p>
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
                <p className="text-sm text-[var(--secondary-text)]">Overdue</p>
                <p className="text-2xl font-semibold">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Completed</p>
                <p className="text-2xl font-semibold">14</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Inspections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inspections.map((inspection) => (
              <div key={inspection.id} className="p-4 bg-[var(--page-background)] rounded-lg flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{inspection.property}</h3>
                  <p className="text-sm text-[var(--secondary-text)]">{inspection.type} Inspection</p>
                  <p className="text-sm mt-1">Scheduled: {inspection.date}</p>
                </div>
                <Badge className={inspection.status === "overdue" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}>
                  {inspection.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
