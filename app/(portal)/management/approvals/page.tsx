"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Plus, Clock, CheckCircle2, XCircle } from "lucide-react";

const approvals = [
  { id: "1", title: "Landscaping Contract 2026", amount: "$12,000", requestedBy: "Sarah Johnson", status: "pending" },
  { id: "2", title: "Roof Repair - Building B", amount: "$8,500", requestedBy: "Mike Chen", status: "approved" },
  { id: "3", title: "New Security System", amount: "$15,000", requestedBy: "Lisa Davis", status: "rejected" },
];

export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Approvals</h1>
          <p className="text-[var(--secondary-text)] mt-1">Manage board approvals and decisions</p>
        </div>
        <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
          <Plus className="h-4 w-4 mr-2" />
          Request Approval
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <CheckSquare className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Requests</p>
                <p className="text-2xl font-semibold">15</p>
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
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Approved</p>
                <p className="text-2xl font-semibold">9</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Rejected</p>
                <p className="text-2xl font-semibold">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approval Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {approvals.map((approval) => (
              <div key={approval.id} className="p-4 bg-[var(--page-background)] rounded-lg flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{approval.title}</h3>
                  <p className="text-sm text-[var(--secondary-text)]">Amount: {approval.amount}</p>
                  <p className="text-sm text-[var(--secondary-text)]">Requested by: {approval.requestedBy}</p>
                </div>
                <Badge className={
                  approval.status === "approved" ? "bg-green-100 text-green-700" :
                  approval.status === "rejected" ? "bg-red-100 text-red-700" :
                  "bg-amber-100 text-amber-700"
                }>
                  {approval.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
