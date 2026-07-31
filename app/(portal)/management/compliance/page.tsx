"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scale, Plus, AlertCircle, CheckCircle2, Clock } from "lucide-react";

const complianceItems = [
  { id: "1", title: "Annual Fire Inspection", dueDate: "2026-08-15", status: "compliant" },
  { id: "2", title: "Elevator Certification", dueDate: "2026-09-01", status: "pending" },
  { id: "3", title: "ADA Compliance Review", dueDate: "2026-07-01", status: "overdue" },
];

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Compliance</h1>
          <p className="text-[var(--secondary-text)] mt-1">Track compliance requirements and deadlines</p>
        </div>
        <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
          <Plus className="h-4 w-4 mr-2" />
          Add Compliance Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Scale className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Items</p>
                <p className="text-2xl font-semibold">18</p>
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
                <p className="text-sm text-[var(--secondary-text)]">Compliant</p>
                <p className="text-2xl font-semibold">12</p>
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
                <p className="text-sm text-[var(--secondary-text)]">Pending</p>
                <p className="text-2xl font-semibold">4</p>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Matters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceItems.map((item) => (
              <div key={item.id} className="p-4 bg-[var(--page-background)] rounded-lg flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-[var(--secondary-text)]">Due: {item.dueDate}</p>
                </div>
                <Badge className={
                  item.status === "compliant" ? "bg-green-100 text-green-700" :
                  item.status === "overdue" ? "bg-red-100 text-red-700" :
                  "bg-amber-100 text-amber-700"
                }>
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
