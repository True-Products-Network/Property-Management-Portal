"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, FileText, TrendingUp, DollarSign, Users } from "lucide-react";

const reports = [
  { id: "1", name: "Monthly Financial Summary", type: "Financial", lastGenerated: "2026-07-01" },
  { id: "2", name: "Maintenance Activity Report", type: "Operations", lastGenerated: "2026-07-15" },
  { id: "3", name: "Occupancy Report", type: "Property", lastGenerated: "2026-07-20" },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Reports</h1>
          <p className="text-[var(--secondary-text)] mt-1">View and generate reports</p>
        </div>
        <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
          <BarChart3 className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Reports</p>
                <p className="text-2xl font-semibold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Generated This Month</p>
                <p className="text-2xl font-semibold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Financial</p>
                <p className="text-2xl font-semibold">4</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Operational</p>
                <p className="text-2xl font-semibold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="p-4 bg-[var(--page-background)] rounded-lg flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{report.name}</h3>
                  <p className="text-sm text-[var(--secondary-text)]">Type: {report.type}</p>
                  <p className="text-sm text-[var(--secondary-text)]">Last generated: {report.lastGenerated}</p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
